const path = require("path");
const fsp = require("fs/promises");
const { CONCURRENCY } = require("./env");
const { create_limiter } = require("./limiter");
const { write_json_atomic } = require("./fs_utils");
const { fetch_rapid_overview } = require("./rapidapi");

const ROOT = path.join(__dirname, "..");


function to_artist_record(rapidData) {
    const artist = rapidData.data.artist;
    const stats = artist.stats;
    const items = artist.discography?.topTracks?.items ?? [];
    const topSongs = items.slice(0, 3).map((item) => ({
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


async function read_existing_index(outPath) {
    try {
        const raw = await fsp.readFile(outPath, "utf8");
        const arr = JSON.parse(raw);
        return new Map(Array.isArray(arr) ? arr.map((a) => [a.id, a]) : []);
    } catch {
        return new Map();
    }
}


async function ingest_lang(lang, artistsConfig) {
    const outPath = path.join(ROOT, "data", `artists_${lang}.json`);
    const existing = await read_existing_index(outPath);
    const limit = create_limiter(CONCURRENCY);
    const errors = [];
    let refreshed = 0;
    let preserved = 0;

    const entries = artistsConfig[lang] ?? [];
    if (entries.length === 0) {
        return { refreshed, preserved, errors, count: 0 };
    }

    const results = await Promise.all(
        entries.map((entry) =>
            limit(async () => {
                try {
                    const rapid = await fetch_rapid_overview(entry.id);
                    refreshed++;
                    return to_artist_record(rapid);
                }
                catch (err) {
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

    await write_json_atomic(outPath, merged);
    return { refreshed, preserved, errors, count: merged.length };
}


async function run_ingest(lang) {
    const artistsConfig = JSON.parse(await fsp.readFile(path.join(ROOT, "config", "artists.json"), "utf8"));
    const langs = (lang === "all") ? ["fr", "en"] : [lang];
    const perLang = {};
    for (const lang of langs) {
        console.log(`[ingest] starting lang=${lang} (${(artistsConfig[lang] ?? []).length} artists)`);
        perLang[lang] = await ingest_lang(lang, artistsConfig);
        console.log(
            `[ingest] done lang=${lang}: refreshed=${perLang[lang].refreshed} preserved=${perLang[lang].preserved} errors=${perLang[lang].errors.length}`
        );
    }
    return perLang;
}


module.exports = { run_ingest };
