import { handleProxyRequest } from "@/lib/instagram";

export const dynamic = "force-dynamic";

/**
 * Dedicated download endpoint.
 *
 * Unlike /api/proxy, this route never redirects to Instagram when the CDN
 * fetch fails. Successful responses are streamed with Content-Disposition:
 * attachment by handleProxyRequest.
 */
export async function GET(request: Request) {
  return handleProxyRequest(request);
}

export function OPTIONS(request: Request) {
  return handleProxyRequest(request);
}
