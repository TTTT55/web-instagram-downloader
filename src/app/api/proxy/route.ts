import { handleProxyRequest, isAllowedMediaUrl } from "@/lib/instagram";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const response = await handleProxyRequest(request);

  // Instagram may reject Cloudflare's server-side fetch with 403.
  // In that case, send the browser directly to the CDN URL instead
  // of downloading the JSON error as a file.
  const url = new URL(request.url);
  const target = url.searchParams.get("url") || "";
  const inline = url.searchParams.get("inline") === "1";

  if (response.status === 502 && !inline && isAllowedMediaUrl(target)) {
    return Response.redirect(target, 307);
  }

  return response;
}

export function OPTIONS(request: Request) {
  return handleProxyRequest(request);
}
