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

export async function fetchInstagramHtmlFallback(rawUrl: string, timeoutMs = 10_000): Promise<MediaResult> {
  const parsed = parseInstagramUrl(rawUrl);
  if (!parsed.shortcode || parsed.kind === "story" || parsed.kind === "share") {
    throw new InstagramError("INVALID_URL", "That link cannot be resolved as a public Instagram post.");
  }

  const path = parsed.kind === "post" ? "p" : parsed.kind === "tv" ? "tv" : "reel";
  const url = `https://www.instagram.com/${path}/${parsed.shortcode}/`;
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

    const html = await response.text();
    if (!response.ok) {
      throw new InstagramError(
        response.status === 404 ? "NOT_FOUND" : "UPSTREAM_ERROR",
        response.status === 404
          ? "This post doesn't exist or has been deleted."
          : `Instagram returned HTTP ${response.status} while loading the post.`,
        response.status === 404 ? 404 : 502,
      );
    }

    const scriptRe = /<script[^>]*type=["']application\/json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match: RegExpExecArray | null;
    let webInfo: any | undefined;

    while ((match = scriptRe.exec(html))) {
      try {
        const json = JSON.parse(match[1]);
        webInfo = findWebInfo(json);
        if (webInfo) break;
      } catch {
        // Ignore unrelated JSON script blocks.
      }
    }

    const root = webInfo?.items?.[0];
    if (!root) {
      throw new InstagramError(
        "PRIVATE_OR_UNAVAILABLE",
        "Instagram did not expose this public post's media to the web client.",
        403,
      );
    }

    const rawItems = Array.isArray(root.carousel_media) && root.carousel_media.length ? root.carousel_media : [root];
    const items = rawItems.map(normalizeItem).filter(Boolean) as MediaItem[];
    if (!items.length) {
      throw new InstagramError("UPSTREAM_ERROR", "Instagram exposed the post but no downloadable media was found.", 502);
    }

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
  } finally {
    clearTimeout(timer);
  }
}
