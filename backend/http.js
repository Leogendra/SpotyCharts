const { TIMEOUT_MS } = require("./env");


async function fetch_with_timeout(url, opts = {}, timeoutMs = TIMEOUT_MS) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        return await fetch(url, { ...opts, signal: ctrl.signal });
    } finally {
        clearTimeout(t);
    }
}


async function with_retry(fn, { retries = 3, baseDelayMs = 500 } = {}) {
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


module.exports = { fetch_with_timeout, with_retry };
