const crypto = require("crypto");
const { ADMIN_TOKEN } = require("./env");

const expectedTokenBuf = Buffer.from(ADMIN_TOKEN);


function bearer_auth(req, res, next) {
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


module.exports = { bearer_auth };
