/**
 * QuickVideoSaver API – Cloudflare Worker entry.
 *
 * Deploy (free tier, no credit card):
 *   npx wrangler login
 *   npx wrangler deploy --config wrangler.toml
 *
 * Endpoints:
 *   POST/GET /api/download?url=<instagram url>   → JSON with direct media URLs
 *   GET      /api/proxy?url=<cdn url>&filename=  → streams the file with Content-Disposition
 *   GET      /api/health                         → { ok: true }
 */
import { createRateLimiter, handleDownloadRequest, handleProxyRequest, jsonResponse } from "../src/lib/instagram";

interface Env {
  IG_DOC_IDS?: string;
  RATE_LIMIT_PER_MINUTE?: string;
  ALLOWED_ORIGIN?: string;
}

let limiter: ReturnType<typeof createRateLimiter> | undefined;

const worker = {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    limiter ??= createRateLimiter(Number(env.RATE_LIMIT_PER_MINUTE || 30), 60_000);

    let res: Response;
    if (url.pathname === "/api/download" || url.pathname === "/download") {
      res = await handleDownloadRequest(request, env, limiter);
    } else if (url.pathname === "/api/proxy" || url.pathname === "/proxy") {
      res = await handleProxyRequest(request);
    } else if (url.pathname === "/api/health" || url.pathname === "/health") {
      res = jsonResponse({ ok: true, service: "quickvideosaver-api" });
    } else {
      res = jsonResponse({ ok: false, error: "Not found" }, 404);
    }

    if (env.ALLOWED_ORIGIN) {
      const headers = new Headers(res.headers);
      headers.set("Access-Control-Allow-Origin", env.ALLOWED_ORIGIN);
      headers.set("Vary", "Origin");
      return new Response(res.body, { status: res.status, headers });
    }
    return res;
  },
};

export default worker;
