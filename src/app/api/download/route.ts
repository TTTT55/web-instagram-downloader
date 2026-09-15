import { createRateLimiter, handleDownloadRequest, parseInstagramUrl } from "@/lib/instagram";
import { fetchInstagramHtmlFallback } from "@/lib/instagram-html-fallback";

export const dynamic = "force-dynamic";

const rateLimit = createRateLimiter(Number(process.env.RATE_LIMIT_PER_MINUTE || 30), 60_000);

function cleanMediaUrl(value: string): string {
  return value
    .replace(/\\u0026/g, "&")
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&#x26;/gi, "&")
    .replace(/\\"/g, '"');
}

async function getSourceUrl(request: Request): Promise<string> {
  if (request.method === "GET") return new URL(request.url).searchParams.get("url") || "";
  if (request.method === "POST") {
    try {
      const clone = request.clone();
      const contentType = clone.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        const body = (await clone.json()) as { url?: string };
        return body?.url || "";
      }
      const form = await clone.formData();
      return String(form.get("url") || "");
    } catch {
      return "";
    }
  }
  return "";
}

async function handle(request: Request) {
  // Clone before the normal handler consumes the request body. The clone lets
  // the HTML fallback reuse the original Instagram permalink if GraphQL fails.
  const sourceUrlPromise = getSourceUrl(request);
  const response = await handleDownloadRequest(request, { IG_DOC_IDS: process.env.IG_DOC_IDS }, rateLimit);

  // Instagram's Polaris GraphQL endpoint has been intermittently returning
  // `data: null` / execution errors since early September 2026. When the
  // normal extractor cannot resolve a post, read the same prefetched media
  // object from the public HTML application/json payload instead. This is
  // especially important for carousels, where the payload contains all
  // carousel_media children.
  if (!response.ok && response.status >= 400 && response.status < 500) {
    try {
      const sourceUrl = await sourceUrlPromise;
      const parsed = parseInstagramUrl(sourceUrl);
      if (parsed.shortcode && parsed.kind !== "story" && parsed.kind !== "share") {
        const result = await fetchInstagramHtmlFallback(sourceUrl);
        return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
      }
    } catch {
      // Preserve the original extractor error below.
    }
  }

  // Defensive URL normalization. Instagram sometimes embeds CDN URLs in
  // HTML/JSON with escaped ampersands; changing those to literal '&' is
  // required because the CDN signature covers the exact query string.
  if (response.ok && response.headers.get("content-type")?.includes("application/json")) {
    try {
      const body = (await response.json()) as any;
      if (body?.ok && Array.isArray(body.items)) {
        body.items = body.items.map((item: any) => ({
          ...item,
          url: typeof item.url === "string" ? cleanMediaUrl(item.url) : item.url,
          thumbnail: typeof item.thumbnail === "string" ? cleanMediaUrl(item.thumbnail) : item.thumbnail,
        }));
      }
      if (body?.ok && body.owner?.avatar && typeof body.owner.avatar === "string") {
        body.owner.avatar = cleanMediaUrl(body.owner.avatar);
      }
      return Response.json(body, { status: response.status, headers: { "Cache-Control": "no-store" } });
    } catch {
      // Fall through to the original response if it was not valid JSON.
    }
  }

  return response;
}

export { handle as GET, handle as POST, handle as OPTIONS };
