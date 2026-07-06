import cors from "cors";
function parseOrigins(raw) {
    return (raw ?? "http://localhost:3000")
        .split(",")
        .map((o) => o.trim())
        .filter(Boolean);
}
function isVercelOrigin(origin) {
    try {
        const { hostname, protocol } = new URL(origin);
        return (protocol === "https:" &&
            (hostname.endsWith(".vercel.app") || hostname === "vercel.app"));
    }
    catch {
        return false;
    }
}
export function buildCorsOptions() {
    const allowedOrigins = parseOrigins(process.env.CORS_ORIGIN);
    const allowVercel = process.env.CORS_ALLOW_VERCEL !== "false";
    return {
        origin(origin, callback) {
            // Server-to-server, curl, same-origin
            if (!origin) {
                callback(null, true);
                return;
            }
            if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
                callback(null, true);
                return;
            }
            if (allowVercel && isVercelOrigin(origin)) {
                callback(null, true);
                return;
            }
            console.warn(`CORS blocked origin: ${origin}`);
            callback(null, false);
        },
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
    };
}
export const corsMiddleware = cors(buildCorsOptions());
