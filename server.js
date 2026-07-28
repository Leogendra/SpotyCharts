const dotenv = require("dotenv");
const express = require("express");
const path = require("path");
const fsp = require("fs/promises");
const crypto = require("crypto");
const { z } = require("zod");

dotenv.config();

/* ------------------------------ env ---------------------------------- */

const envSchema = z.object({
    PORT: z.string().default("3434"),
    ADMIN_TOKEN: z.string().min(8, "ADMIN_TOKEN must be at least 8 chars"),
    RAPIDAPI_API_KEY_1: z.string(),
    RAPIDAPI_API_KEY_2: z.string().optional(),
    RAPIDAPI_API_KEY_3: z.string().optional(),
    INGEST_CONCURRENCY: z.string().default("4"),
    INGEST_TIMEOUT_MS: z.string().default("15000"),
});

const parsedEnv = envSchema.safeParse(process.env);
if (!parsedEnv.success) {
    console.error("Invalid env config:");
    for (const issue of parsedEnv.error.issues) {
        console.error(` - ${issue.path.join(".")}: ${issue.message}`);
    }
    process.exit(1);
}
const env = parsedEnv.data;
const PORT = Number(env.PORT);
const CONCURRENCY = Math.max(1, Number(env.INGEST_CONCURRENCY));
const TIMEOUT_MS = Math.max(1000, Number(env.INGEST_TIMEOUT_MS));

const RAPIDAPI_KEYS = [env.RAPIDAPI_API_KEY_1, env.RAPIDAPI_API_KEY_2, env.RAPIDAPI_API_KEY_3]
    .filter((k) => typeof k === "string" && k.length > 0);
if (RAPIDAPI_KEYS.length === 0) {
    console.error("At least one RAPIDAPI_API_KEY_* is required.");
    process.exit(1);
}
let rrIndex = 0;
const nextRapidKey = () => RAPIDAPI_KEYS[rrIndex++ % RAPIDAPI_KEYS.length];

/* --------------------------- helpers --------------------------------- */

async function fetchWithTimeout(url, opts = {}, timeoutMs = TIMEOUT_MS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        return await fetch(url, { ...opts, signal: ctrl.signal });
    } finally {
        clearTimeout(t);
    }
}

async function withRetry(fn, { retries = 3, baseDelayMs = 500 } = {}) {
    let lastErr;
    for (let attempt = 0; attempt <= retries; attempt++) {
        try {
            return await fn();
        } catch (err) {
            lastErr = err;
            if (err && err.retriable === false) throw err;
            if (attempt === retries) throw err;
            const wait = baseDelayMs * 2 ** attempt + Math.floor(Math.random() * 200);
            await new Promise((r) => setTimeout(r, wait));
        }
    }
    throw lastErr;
}

function createLimiter(concurrency) {
    let active = 0;
    const queue = [];
    const drain = () => {
        while (active < concurrency && queue.length > 0) {
            const { fn, resolve, reject } = queue.shift();
            active++;
            Promise.resolve()
                .then(fn)
                .then(resolve, reject)
                .finally(() => {
                    active--;
                    drain();
                });
        }
    };
    return (fn) =>
        new Promise((resolve, reject) => {
            queue.push({ fn, resolve, reject });
            drain();
        });
}

async function writeJsonAtomic(target, data) {
    const tmp = `${target}.tmp`;
    await fsp.writeFile(tmp, JSON.stringify(data, null, 2));
    await fsp.rename(tmp, target);
}

/* --------------------------- rapidapi -------------------------------- */

const rapidOverviewSchema = z.object({
    data: z.object({
        artist: z.object({
            id: z.string(),
            profile: z.object({ name: z.string() }),
            stats: z.object({
                followers: z.number(),
                monthlyListeners: z.number().nullable().optional(),
                worldRank: z.number().nullable().optional(),
            }),
            visuals: z
                .object({
                    avatarImage: z
                        .object({ sources: z.array(z.object({ url: z.string() })) })
                        .nullable()
                        .optional(),
                    headerImage: z
                        .object({ sources: z.array(z.object({ url: z.string() })) })
                        .nullable()
                        .optional(),
                })
                .default({}),
            discography: z
                .object({
                    topTracks: z
                        .object({
                            items: z
                                .array(
                                    z.object({
                                        track: z.object({
                                            id: z.string(),
                                            name: z.string(),
                                            playcount: z.union([z.string(), z.number()]).optional(),
                                        }),
                                    })
                                )
                                .default([]),
                        })
                        .default({ items: [] }),
                })
                .default({ topTracks: { items: [] } }),
        }),
    }),
});

async function fetchRapidOverview(id) {
    return withRetry(async () => {
        const key = nextRapidKey();
        const res = await fetchWithTimeout(
            `https://spotify23.p.rapidapi.com/artist_overview/?id=${encodeURIComponent(id)}`,
            {
                headers: {
                    "X-RapidAPI-Key": key,
                    "X-RapidAPI-Host": "spotify23.p.rapidapi.com",
                },
            }
        );
        if (res.status === 429 || res.status >= 500) {
            const err = new Error(`RapidAPI /artist_overview/${id} -> ${res.status}`);
            err.retriable = true;
            throw err;
        }
        if (!res.ok) {
            const err = new Error(`RapidAPI /artist_overview/${id} -> ${res.status}`);
            err.retriable = false;
            throw err;
        }
        const raw = await res.json();
        return rapidOverviewSchema.parse(raw);
    });
}

/* --------------------------- pipeline -------------------------------- */

function toArtistRecord(rapidData) {
    const artist = rapidData.data.artist;
    const stats = artist.stats;
    const topSongs = artist.discography.topTracks.items.slice(0, 3).map((item) => ({
        id: item.track.id,
        name: item.track.name,
        playcount: item.track.playcount != null ? String(item.track.playcount) : "0",
    }));
    return {
        id: artist.id,
        name: artist.profile.name,
        followers: stats.followers,
        worldRank: stats.worldRank ?? null,
        monthlyListeners: stats.monthlyListeners ?? null,
        avatarImage: artist.visuals?.avatarImage?.sources?.[0]?.url ?? null,
        headerImage: artist.visuals?.headerImage?.sources?.[0]?.url ?? null,
        topSongs,
        lastUpdate: Math.floor(Date.now() / 1000),
    };
}

async function readExistingIndex(outPath) {
    try {
        const raw = await fsp.readFile(outPath, "utf8");
        const arr = JSON.parse(raw);
        return new Map(Array.isArray(arr) ? arr.map((a) => [a.id, a]) : []);
    } catch {
        return new Map();
    }
}

async function ingestLang(lang, cfg) {
    const outPath = path.join(__dirname, "data", `artists.${lang}.json`);
    const existing = await readExistingIndex(outPath);
    const limit = createLimiter(CONCURRENCY);
    const errors = [];
    let refreshed = 0;
    let preserved = 0;

    const entries = cfg[lang] ?? [];
    if (entries.length === 0) return { refreshed, preserved, errors, count: 0 };

    const results = await Promise.all(
        entries.map((entry) =>
            limit(async () => {
                try {
                    const rapid = await fetchRapidOverview(entry.id);
                    refreshed++;
                    return toArtistRecord(rapid);
                } catch (err) {
                    errors.push({ id: entry.id, name: entry.name, error: err.message });
                    const fallback = existing.get(entry.id);
                    if (fallback) preserved++;
                    return fallback ?? null;
                }
            })
        )
    );

    const merged = results
        .filter((r) => r !== null)
        .sort((a, b) => (b.monthlyListeners ?? 0) - (a.monthlyListeners ?? 0));

    await writeJsonAtomic(outPath, merged);
    return { refreshed, preserved, errors, count: merged.length };
}

async function runIngest(lang) {
    const cfg = JSON.parse(await fsp.readFile(path.join(__dirname, "config", "artists.json"), "utf8"));
    const langs = lang === "all" ? ["fr", "en"] : [lang];
    const perLang = {};
    for (const l of langs) {
        console.log(`[ingest] starting lang=${l} (${(cfg[l] ?? []).length} artists)`);
        perLang[l] = await ingestLang(l, cfg);
        console.log(
            `[ingest] done lang=${l}: refreshed=${perLang[l].refreshed} preserved=${perLang[l].preserved} errors=${perLang[l].errors.length}`
        );
    }
    return perLang;
}

/* --------------------------- auth ------------------------------------ */

const expectedTokenBuf = Buffer.from(env.ADMIN_TOKEN);

function bearerAuth(req, res, next) {
    const header = req.headers.authorization || "";
    const [scheme, token] = header.split(" ");
    if (scheme !== "Bearer" || !token) {
        return res.status(401).json({ error: "Missing bearer token" });
    }
    const providedBuf = Buffer.from(token);
    if (
        providedBuf.length !== expectedTokenBuf.length ||
        !crypto.timingSafeEqual(providedBuf, expectedTokenBuf)
    ) {
        return res.status(401).json({ error: "Invalid token" });
    }
    next();
}

/* --------------------------- app ------------------------------------- */

const app = express();

app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.use("/data", express.static(path.join(__dirname, "data")));

let ingestRunning = false;

app.get("/fetch-artists", bearerAuth, async (req, res) => {
    if (ingestRunning) {
        return res.status(409).json({ error: "An ingest is already running" });
    }
    const lang = String(req.query.lang ?? "all").toLowerCase();
    if (!["fr", "en", "all"].includes(lang)) {
        return res.status(400).json({ error: "lang must be one of fr|en|all" });
    }

    ingestRunning = true;
    const startedAt = Date.now();
    req.setTimeout(15 * 60 * 1000);
    res.setTimeout(15 * 60 * 1000);

    try {
        const perLang = await runIngest(lang);
        res.json({
            ok: true,
            lang,
            durationMs: Date.now() - startedAt,
            perLang,
        });
    } catch (err) {
        console.error("[ingest] fatal:", err);
        res.status(500).json({ ok: false, error: err.message });
    } finally {
        ingestRunning = false;
    }
});

app.get("/health", (_req, res) => {
    res.json({ ok: true, ingestRunning });
});

app.listen(PORT, () => {
    console.log(`SpotyCharts running on http://localhost:${PORT}`);
});
