import { createRateLimiter, handleDownloadRequest, parseInstagramUrl } from "@/lib/instagram";
import { fetchInstagramEmbed } from "@/lib/instagram-embed";
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
  if (request.method === "OPTIONS") {
    return handleDownloadRequest(request, { IG_DOC_IDS: process.env.IG_DOC_IDS }, rateLimit);
  }

  const sourceUrl = await getSourceUrl(request);
  if (sourceUrl) {
    try {
      const parsed = parseInstagramUrl(sourceUrl);
      if (parsed.shortcode && parsed.kind !== "story" && parsed.kind !== "share") {
        // Use the balanced embed parser first. This avoids accepting a stale or
        // malformed GraphQL result when Instagram's Polaris endpoint returns a
        // 200 response containing an unusable media object.
        const result = await fetchInstagramEmbed(sourceUrl);
        return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
      }
    } catch {
      // The embed representation is not always exposed. Try the application/json
      // page extractor before falling back to the older GraphQL strategies.
      try {
        const parsed = parseInstagramUrl(sourceUrl);
        if (parsed.shortcode && parsed.kind !== "story" && parsed.kind !== "share") {
          const result = await fetchInstagramHtmlFallback(sourceUrl);
          return Response.json({ ok: true, ...result }, { headers: { "Cache-Control": "no-store" } });
        }
      } catch {
        // Fall through to the existing multi-strategy extractor below.
      }
    }
  }

  const response = await handleDownloadRequest(request, { IG_DOC_IDS: process.env.IG_DOC_IDS }, rateLimit);

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
