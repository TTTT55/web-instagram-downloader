// @ts-nocheck – Deno runtime types are provided by Deno itself.
/**
 * QuickVideoSaver API – Deno Deploy entry (alternative to the Cloudflare Worker).
 *
 * Deploy (free tier, no credit card):
 *   1. Push this repo to GitHub.
 *   2. In https://dash.deno.com create a project → link the repo → entrypoint: deno/main.ts
 *   3. (Optional) set env vars IG_DOC_IDS / RATE_LIMIT_PER_MINUTE / ALLOWED_ORIGIN
 */
import { createRateLimiter, handleDownloadRequest, handleProxyRequest, jsonResponse } from "../src/lib/instagram.ts";

const limiter = createRateLimiter(Number(Deno.env.get("RATE_LIMIT_PER_MINUTE") || 30), 60_000);
const env = { IG_DOC_IDS: Deno.env.get("IG_DOC_IDS") };
const allowedOrigin = Deno.env.get("ALLOWED_ORIGIN");

Deno.serve(async (request: Request) => {
  const url = new URL(request.url);
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
  if (allowedOrigin) {
    const headers = new Headers(res.headers);
    headers.set("Access-Control-Allow-Origin", allowedOrigin);
    headers.set("Vary", "Origin");
    return new Response(res.body, { status: res.status, headers });
  }
  return res;
});
