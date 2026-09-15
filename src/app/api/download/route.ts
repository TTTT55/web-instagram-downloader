import { createRateLimiter, handleDownloadRequest } from "@/lib/instagram";

export const dynamic = "force-dynamic";

const rateLimit = createRateLimiter(Number(process.env.RATE_LIMIT_PER_MINUTE || 30), 60_000);

function handle(request: Request) {
  return handleDownloadRequest(request, { IG_DOC_IDS: process.env.IG_DOC_IDS }, rateLimit);
}

export { handle as GET, handle as POST, handle as OPTIONS };
