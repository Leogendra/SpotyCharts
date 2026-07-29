const { fetch_with_timeout, with_retry } = require("./http");
const { RAPIDAPI_KEYS } = require("./env");

let rrIndex = 0;
const next_rapid_key = () => RAPIDAPI_KEYS[rrIndex++ % RAPIDAPI_KEYS.length];


async function fetch_rapid_overview(id) {
    return with_retry(async () => {
        const key = next_rapid_key();
        const res = await fetch_with_timeout(
            `https://spotify23.p.rapidapi.com/artist_overview/?id=${encodeURIComponent(id)}`,
            {
                headers: {
                    "X-RapidAPI-Key": key,
                    "X-RapidAPI-Host": "spotify23.p.rapidapi.com",
                },
            }
        );
        if (!res.ok) {
            const err = new Error(`RapidAPI /artist_overview/${id} -> ${res.status}`);
            err.retriable = false;
            throw err;
        }
        return await res.json();
    });
}


module.exports = { fetch_rapid_overview };
