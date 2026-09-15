import { handleProxyRequest, isAllowedMediaUrl } from "@/lib/instagram";

export const dynamic = "force-dynamic";

function normalizeMediaUrl(value: string) {
  return value
    .replaceAll("\\\\u0026", "&")
    .replaceAll("\\u0026", "&")
    .replaceAll("&amp;", "&");
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const target = normalizeMediaUrl(url.searchParams.get("url") || "");
  const inline = url.searchParams.get("inline") === "1";

  // Rebuild the request with a normalized CDN URL so escaped query separators
  // from Instagram page data do not invalidate its signed URL.
  if (target && target !== url.searchParams.get("url")) {
    url.searchParams.set("url", target);
  }

  const response = await handleProxyRequest(new Request(url, request));

  // Instagram may reject Cloudflare's server-side fetch with 403.
  // In that case, send the browser directly to the fresh CDN URL instead
  // of downloading the JSON error as a file.
  if (response.status === 502 && !inline && isAllowedMediaUrl(target)) {
    return Response.redirect(target, 307);
  }

  return response;
}

export function OPTIONS(request: Request) {
  return handleProxyRequest(request);
}
