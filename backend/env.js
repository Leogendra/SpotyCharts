const dotenv = require("dotenv");
const { z } = require("zod");

dotenv.config();


const envSchema = z.object({
    PORT: z.string().default("3434"),
    ADMIN_TOKEN: z.string().min(1, "ADMIN_TOKEN must be set in .env"),
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


const RAPIDAPI_KEYS = [env.RAPIDAPI_API_KEY_1, env.RAPIDAPI_API_KEY_2, env.RAPIDAPI_API_KEY_3]
    .filter((k) => typeof k === "string" && k.length > 0);
if (RAPIDAPI_KEYS.length === 0) {
    console.error("At least one RAPIDAPI_API_KEY_* is required.");
    process.exit(1);
}


module.exports = {
    PORT: Number(env.PORT),
    ADMIN_TOKEN: env.ADMIN_TOKEN,
    CONCURRENCY: Math.max(1, Number(env.INGEST_CONCURRENCY)),
    TIMEOUT_MS: Math.max(1000, Number(env.INGEST_TIMEOUT_MS)),
    RAPIDAPI_KEYS,
};
