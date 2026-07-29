const express = require("express");
const path = require("path");
const { PORT } = require("./backend/env");
const { bearer_auth } = require("./backend/auth");
const { run_ingest } = require("./backend/pipeline");

const app = express();
app.use(express.static(path.join(__dirname, "public"), { extensions: ["html"] }));
app.use("/data", express.static(path.join(__dirname, "data")));

let ingestRunning = false;




app.get("/fetch-artists", bearer_auth, async (req, res) => {
    if (ingestRunning) {
        return res.status(409).json({ error: "An ingest is already running" });
    }
    const lang = String(req.query.lang ?? "all").toLowerCase();
    if (!["fr", "en", "all"].includes(lang)) {
        return res.status(400).json({ error: "lang must be one of fr|en|all" });
    }

    ingestRunning = true;
    const startedAt = Date.now();
    // 15 min timeout
    req.setTimeout(15 * 60 * 1000);
    res.setTimeout(15 * 60 * 1000);

    try {
        const perLang = await run_ingest(lang);
        res.json({
            ok: true,
            lang,
            durationMs: Date.now() - startedAt,
            perLang,
        });
    } 
    catch (err) {
        console.error("[ingest] fatal:", err);
        res.status(500).json({ ok: false, error: err.message });
    } 
    finally {
        ingestRunning = false;
    }
});




app.listen(PORT, () => {
    console.log(`SpotyCharts running on http://localhost:${PORT}`);
});
