import { handleProxyRequest } from "@/lib/instagram";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  return handleProxyRequest(request);
}

export function OPTIONS(request: Request) {
  return handleProxyRequest(request);
}
