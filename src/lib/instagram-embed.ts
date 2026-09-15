import type { MediaItem, MediaResult } from "@/lib/instagram";
import { InstagramError, parseInstagramUrl } from "@/lib/instagram";

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

function cleanUrl(value: unknown): string | undefined {
  if (typeof value !== "string" || !value) return undefined;
  return value
    .replace(/\\u0026/g, "&")
    .replace(/\\u002F/gi, "/")
    .replace(/\\\//g, "/")
    .replace(/&amp;/g, "&")
    .replace(/&#38;/g, "&")
    .replace(/&#x26;/gi, "&")
    .replace(/\\"/g, '"');
}

function best(list: any[] | undefined): any | undefined {
  if (!Array.isArray(list) || !list.length) return undefined;
  return [...list].sort(
    (a, b) => (b?.width ?? 0) * (b?.height ?? 0) - (a?.width ?? 0) * (a?.height ?? 0),
  )[0];
}

function normalizeV1(node: any, index: number): MediaItem | undefined {
  const image = best(node?.image_versions2?.candidates);
  const video = node?.media_type === 2 ? best(node?.video_versions) : undefined;
  const videoUrl = cleanUrl(video?.url);
  const imageUrl = cleanUrl(image?.url);

  if (videoUrl) {
    return {
      index,
      type: "video",
      url: videoUrl,
      thumbnail: imageUrl,
      width: Number(video?.width || node?.original_width) || undefined,
      height: Number(video?.height || node?.original_height) || undefined,
      duration: Number(node?.video_duration) || undefined,
    };
  }
  if (imageUrl) {
    return {
      index,
      type: "image",
      url: imageUrl,
      thumbnail: imageUrl,
      width: Number(image?.width) || undefined,
      height: Number(image?.height) || undefined,
    };
  }
  return undefined;
}

function normalizeLegacy(node: any, shortcode: string, permalink: string): MediaResult | undefined {
  const edges = node?.edge_sidecar_to_children?.edges;
  const nodes = Array.isArray(edges) && edges.length ? edges.map((edge: any) => edge?.node).filter(Boolean) : [node];
  const items = nodes
    .map((item: any, index: number) => {
      const display = best(item?.display_resources?.map((r: any) => ({
        url: r?.src,
        width: r?.config_width,
        height: r?.config_height,
      })));
      const displayUrl = cleanUrl(display?.url ?? item?.display_url);
      const videoUrl = cleanUrl(item?.video_url);
      if (item?.is_video && videoUrl) {
        return {
          index,
          type: "video" as const,
          url: videoUrl,
          thumbnail: displayUrl,
          width: Number(item?.dimensions?.width) || undefined,
          height: Number(item?.dimensions?.height) || undefined,
          duration: Number(item?.video_duration) || undefined,
        };
      }
      if (displayUrl) {
        return {
          index,
          type: "image" as const,
          url: displayUrl,
          thumbnail: displayUrl,
          width: Number(display?.width || item?.dimensions?.width) || undefined,
          height: Number(display?.height || item?.dimensions?.height) || undefined,
        };
      }
      return undefined;
    })
    .filter(Boolean) as MediaItem[];

  if (!items.length) return undefined;

  const kind: MediaResult["kind"] =
    node?.product_type === "clips" || /\/reel\//i.test(permalink)
      ? "reel"
      : node?.product_type === "igtv" || /\/tv\//i.test(permalink)
        ? "tv"
        : "post";

  return {
    shortcode,
    kind,
    permalink,
    owner: node?.owner || node?.user
      ? {
          username: node?.owner?.username ?? node?.user?.username,
          fullName: node?.owner?.full_name ?? node?.user?.full_name,
          avatar: cleanUrl(node?.owner?.profile_pic_url ?? node?.user?.profile_pic_url),
        }
      : undefined,
    caption:
      typeof node?.edge_media_to_caption?.edges?.[0]?.node?.text === "string"
        ? node.edge_media_to_caption.edges[0].node.text
        : typeof node?.caption?.text === "string"
          ? node.caption.text
          : undefined,
    items,
    hasVideo: items.some((item) => item.type === "video"),
    hasImage: items.some((item) => item.type === "image"),
    source: "embed:json-balanced",
  };
}

/**
 * Extract a balanced object from HTML/JavaScript. Instagram has returned the
 * same post object both as normal JSON and as JSON escaped inside a JS string.
 * This scanner handles nested objects and both representations.
 */
function extractBalancedJson(text: string, start: number): string | undefined {
  const firstBrace = text.indexOf("{", start);
  if (firstBrace < 0) return undefined;

  let depth = 0;
  let inString = false;
  let escaped = false;
  let escapedJson = false;

  // If the first JSON token is escaped, e.g. {\"owner\":..., the object is
  // embedded inside a JavaScript string. In that representation \" marks JSON
  // quote boundaries, while \\\" is an escaped quote inside a JSON string.
  const afterBrace = text.slice(firstBrace + 1, firstBrace + 4);
  escapedJson = afterBrace.startsWith('\\"') || afterBrace.startsWith('\\\\"');

  for (let i = firstBrace; i < text.length; i += 1) {
    const ch = text[i];

    if (escapedJson) {
      if (ch === "\\" && text[i + 1] === '"') {
        // A single backslash + quote is a JSON quote delimiter in the escaped
        // representation. Three backslashes + quote represents an escaped
        // quote within a JSON string.
        let slashCount = 0;
        for (let j = i; j >= 0 && text[j] === "\\"; j -= 1) slashCount += 1;
        if (slashCount === 1) {
          inString = !inString;
          i += 1;
          continue;
        }
      }
      if (!inString) {
        if (ch === "{") depth += 1;
        else if (ch === "}") {
          depth -= 1;
          if (depth === 0) return text.slice(firstBrace, i + 1);
        }
      } else if (ch === "\\") {
        i += 1;
      }
      continue;
    }

    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }

    if (ch === '"') inString = true;
    else if (ch === "{") depth += 1;
    else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(firstBrace, i + 1);
    }
  }

  return undefined;
}

function parseCandidate(text: string, key: string): any | undefined {
  const keyRe = new RegExp(`(?:\\\\?\\"|\\\\?')${key}(?:\\\\?\\"|\\\\?')\\s*:`, "g");
  let match: RegExpExecArray | null;

  while ((match = keyRe.exec(text))) {
    const raw = extractBalancedJson(text, match.index + match[0].length);
    if (!raw) continue;

    const candidates = [raw, cleanUrl(raw) ?? raw];
    for (const candidate of candidates) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === "object") return parsed;
      } catch {
        // Try the next representation.
      }
    }
  }
  return undefined;
}

async function fetchEmbed(url: string, timeoutMs: number): Promise<{ status: number; html: string }> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.instagram.com/",
      },
    });
    return { status: response.status, html: await response.text() };
  } finally {
    clearTimeout(timer);
  }
}

export async function fetchInstagramEmbed(rawUrl: string, timeoutMs = 10_000): Promise<MediaResult> {
  const parsed = parseInstagramUrl(rawUrl);
  if (!parsed.shortcode || parsed.kind === "story" || parsed.kind === "share") {
    throw new InstagramError("INVALID_URL", "That link cannot be resolved as a public Instagram post.");
  }

  const path = parsed.kind === "post" ? "p" : parsed.kind === "tv" ? "tv" : "reel";
  const permalink = `https://www.instagram.com/${path}/${parsed.shortcode}/`;
  const { status, html } = await fetchEmbed(`${permalink}embed/captioned/`, timeoutMs);

  if (status >= 400) {
    throw new InstagramError(
      status === 404 ? "NOT_FOUND" : status === 403 ? "PRIVATE_OR_UNAVAILABLE" : "UPSTREAM_ERROR",
      status === 404 ? "This post doesn't exist or has been deleted." : `Instagram embed responded with HTTP ${status}.`,
      status === 404 ? 404 : status === 403 ? 403 : 502,
    );
  }

  // Legacy embed representation.
  const legacy = parseCandidate(html, "shortcode_media") ?? parseCandidate(html, "xdt_shortcode_media");
  if (legacy) {
    const result = normalizeLegacy(legacy, parsed.shortcode, parsed.normalized);
    if (result) return result;
  }

  // Current Polaris/v1 representation can also appear directly in the embed.
  const webInfo = parseCandidate(html, "xdt_api__v1__media__shortcode__web_info");
  const root = webInfo?.items?.[0];
  if (root) {
    const rawItems = Array.isArray(root.carousel_media) && root.carousel_media.length ? root.carousel_media : [root];
    const items = rawItems.map(normalizeV1).filter(Boolean) as MediaItem[];
    if (items.length) {
      const isReel = root.product_type === "clips" || parsed.kind === "reel";
      return {
        shortcode: parsed.shortcode,
        kind: isReel ? "reel" : root.product_type === "igtv" || parsed.kind === "tv" ? "tv" : "post",
        permalink: parsed.normalized,
        owner: root.user
          ? {
              username: root.user.username,
              fullName: root.user.full_name,
              avatar: cleanUrl(root.user.profile_pic_url),
            }
          : undefined,
        caption: typeof root.caption?.text === "string" ? root.caption.text : undefined,
        items,
        hasVideo: items.some((item) => item.type === "video"),
        hasImage: items.some((item) => item.type === "image"),
        source: "embed:v1-balanced",
      };
    }
  }

  throw new InstagramError("UPSTREAM_ERROR", "Could not find a complete media object in Instagram's embed response.", 502);
}
