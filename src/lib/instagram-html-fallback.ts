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

function firstImage(node: any): any | undefined {
  const candidates = node?.image_versions2?.candidates;
  if (!Array.isArray(candidates) || !candidates.length) return undefined;
  return [...candidates].sort(
    (a, b) => (b?.width ?? 0) * (b?.height ?? 0) - (a?.width ?? 0) * (a?.height ?? 0),
  )[0];
}

function firstVideo(node: any): any | undefined {
  const versions = node?.video_versions;
  if (!Array.isArray(versions) || !versions.length) return undefined;
  return [...versions].sort(
    (a, b) => (b?.width ?? 0) * (b?.height ?? 0) - (a?.width ?? 0) * (a?.height ?? 0),
  )[0];
}

function normalizeItem(node: any, index: number): MediaItem | undefined {
  const image = firstImage(node);
  const video = node?.media_type === 2 ? firstVideo(node) : undefined;
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

function normalizeGraphNode(node: any, shortcode: string, permalink: string, source: string): MediaResult {
  const edges = node?.edge_sidecar_to_children?.edges;
  const rawItems = Array.isArray(edges) && edges.length ? edges.map((edge: any) => edge?.node).filter(Boolean) : [node];
  const items = rawItems.map(normalizeItem).filter(Boolean) as MediaItem[];

  if (!items.length) {
    throw new InstagramError("UPSTREAM_ERROR", "Instagram exposed the post but no downloadable media was found.", 502);
  }

  const isReel = node?.product_type === "clips" || /\/reel\//i.test(permalink);
  const kind: MediaResult["kind"] = isReel ? "reel" : node?.product_type === "igtv" || /\/tv\//i.test(permalink) ? "tv" : "post";

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
    source,
  };
}

function findWebInfo(value: unknown): any | undefined {
  if (!value || typeof value !== "object") return undefined;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = findWebInfo(item);
      if (found) return found;
    }
    return undefined;
  }

  const record = value as Record<string, unknown>;
  const candidate = record.xdt_api__v1__media__shortcode__web_info;
  if (candidate && typeof candidate === "object") return candidate;

  for (const child of Object.values(record)) {
    const found = findWebInfo(child);
    if (found) return found;
  }
  return undefined;
}

/**
 * Extract a balanced JavaScript/JSON object beginning at `start`.
 *
 * A regex such as /\\{[\\s\\S]*?\\}/ is unsafe here because Instagram's
 * shortcode_media object contains many nested objects. This scanner tracks
 * brace depth and quoted strings, so the returned slice is the complete node.
 */
function extractBalancedObject(text: string, start: number): string | undefined {
  const firstBrace = text.indexOf("{", start);
  if (firstBrace < 0) return undefined;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = firstBrace; i < text.length; i += 1) {
    const ch = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth += 1;
    } else if (ch === "}") {
      depth -= 1;
      if (depth === 0) return text.slice(firstBrace, i + 1);
    }
  }

  return undefined;
}

function parseEmbeddedNode(html: string): any | undefined {
  const keyRe = /(?:\\\\?"(?:shortcode_media|xdt_shortcode_media)\\\\?")\s*:/g;
  let match: RegExpExecArray | null;

  while ((match = keyRe.exec(html))) {
    const objectText = extractBalancedObject(html, match.index + match[0].length);
    if (!objectText) continue;

    try {
      const normalized = objectText
        .replace(/\\u0026/g, "&")
        .replace(/\\u002F/gi, "/")
        .replace(/\\\//g, "/")
        .replace(/&amp;/g, "&");
      const node = JSON.parse(normalized);
      if (node && (node.display_url || node.video_url || node.edge_sidecar_to_children)) return node;
    } catch {
      // Try the next embedded object.
    }
  }

  return undefined;
}

async function fetchHtml(url: string, timeoutMs: number): Promise<{ status: number; html: string }> {
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

export async function fetchInstagramHtmlFallback(rawUrl: string, timeoutMs = 10_000): Promise<MediaResult> {
  const parsed = parseInstagramUrl(rawUrl);
  if (!parsed.shortcode || parsed.kind === "story" || parsed.kind === "share") {
    throw new InstagramError("INVALID_URL", "That link cannot be resolved as a public Instagram post.");
  }

  const path = parsed.kind === "post" ? "p" : parsed.kind === "tv" ? "tv" : "reel";
  const permalink = `https://www.instagram.com/${path}/${parsed.shortcode}/`;

  // 1. Instagram's embed endpoint. This is intentionally parsed with a real
  // brace balancer so nested owner/dimensions/sidecar objects are preserved.
  try {
    const embed = await fetchHtml(`${permalink}embed/captioned/`, timeoutMs);
    if (embed.status < 400) {
      const node = parseEmbeddedNode(embed.html);
      if (node) return normalizeGraphNode(node, parsed.shortcode, parsed.normalized, "embed:json-balanced");
    }
  } catch {
    // Continue to the canonical page fallback below.
  }

  // 2. Canonical public page. Recent Instagram web pages often expose the
  // v1 media object inside an application/json script block.
  try {
    const response = await fetchHtml(permalink, timeoutMs);
    if (response.status >= 400) {
      throw new InstagramError(
        response.status === 404 ? "NOT_FOUND" : "UPSTREAM_ERROR",
        response.status === 404 ? "This post doesn't exist or has been deleted." : `Instagram returned HTTP ${response.status} while loading the post.`,
        response.status === 404 ? 404 : 502,
      );
    }

    const scriptRe = /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    let webInfo: any | undefined;

    while ((match = scriptRe.exec(response.html))) {
      try {
        const json = JSON.parse(match[1]);
        webInfo = findWebInfo(json);
        if (webInfo) break;
      } catch {
        // Ignore unrelated JSON script blocks.
      }
    }

    const root = webInfo?.items?.[0];
    if (root) {
      const rawItems = Array.isArray(root.carousel_media) && root.carousel_media.length ? root.carousel_media : [root];
      const items = rawItems.map(normalizeItem).filter(Boolean) as MediaItem[];
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
          source: "html:application-json",
        };
      }
    }
  } catch (err) {
    if (err instanceof InstagramError) throw err;
  }

  throw new InstagramError(
    "PRIVATE_OR_UNAVAILABLE",
    "Instagram did not expose this public post's media to the web client.",
    403,
  );
}
