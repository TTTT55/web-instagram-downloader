/**
 * QuickVideoSaver – Instagram public media extractor.
 *
 * Runtime‑agnostic: uses only the Fetch API and standard JS, so the exact same
 * module powers the Next.js route handler, the Cloudflare Worker in `workers/`
 * and the Deno Deploy entry in `deno/`.
 *
 * Instagram rotates its internal GraphQL "doc_id"s from time to time. Multiple
 * strategies are attempted in order and the doc_ids can be overridden without a
 * code change via the `IG_DOC_IDS` env variable (comma separated).
 */

export type MediaType = "video" | "image";

export interface MediaItem {
  index: number;
  type: MediaType;
  /** Direct CDN URL of the full quality media. */
  url: string;
  /** Preview image (poster for videos). */
  thumbnail?: string;
  width?: number;
  height?: number;
  /** Duration in seconds when known (videos only). */
  duration?: number;
}

export interface MediaResult {
  shortcode: string;
  kind: "post" | "reel" | "tv";
  permalink: string;
  owner?: { username?: string; fullName?: string; avatar?: string };
  caption?: string;
  items: MediaItem[];
  hasVideo: boolean;
  hasImage: boolean;
  /** Which extraction strategy produced the result (useful for debugging). */
  source: string;
}

export type ErrorCode =
  | "INVALID_URL"
  | "STORIES_UNSUPPORTED"
  | "PRIVATE_OR_UNAVAILABLE"
  | "NOT_FOUND"
  | "RATE_LIMITED"
  | "UPSTREAM_ERROR";

export class InstagramError extends Error {
  code: ErrorCode;
  status: number;
  constructor(code: ErrorCode, message: string, status = 400) {
    super(message);
    this.name = "InstagramError";
    this.code = code;
    this.status = status;
  }
}

export interface ExtractorOptions {
  /** Override the GraphQL doc_ids to try (in order). */
  docIds?: string[];
  /** Per-request timeout in ms for upstream calls. */
  timeoutMs?: number;
  /** Optional logger for debugging. */
  log?: (msg: string) => void;
}

const DEFAULT_DOC_IDS = ["27128499623469141", "8845758582119845", "10015901848480474"];

const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";
const IG_APP_ID = "936619743392459";
const IG_ASBD_ID = "129477";
const IG_LSD = "AVqbxe3J_YA";

/* ------------------------------------------------------------------------ */
/* URL parsing                                                              */
/* ------------------------------------------------------------------------ */

export interface ParsedUrl {
  shortcode?: string;
  kind: "post" | "reel" | "tv" | "story" | "share";
  normalized: string;
}

const SHORTCODE_RE = /^[A-Za-z0-9_-]{5,40}$/;

export function parseInstagramUrl(raw: string): ParsedUrl {
  const trimmed = (raw || "").trim();
  if (!trimmed) throw new InstagramError("INVALID_URL", "Please paste an Instagram link.");

  let url: URL;
  try {
    url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`);
  } catch {
    throw new InstagramError("INVALID_URL", "That doesn't look like a valid URL.");
  }

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  if (!/^(instagram\.com|instagr\.am|ig\.me)$/.test(host) && !host.endsWith(".instagram.com")) {
    throw new InstagramError(
      "INVALID_URL",
      "Only Instagram links are supported (instagram.com/p/…, /reel/…, /tv/…).",
    );
  }

  const parts = url.pathname.split("/").filter(Boolean);

  // /share/... links must be resolved with a redirect first.
  if (parts[0] === "share") {
    return { kind: "share", normalized: url.toString() };
  }

  if (parts[0] === "stories") {
    return { kind: "story", normalized: url.toString() };
  }

  // Patterns: /p/CODE, /reel/CODE, /reels/CODE, /tv/CODE, /{user}/p/CODE, /{user}/reel/CODE
  for (let i = 0; i < parts.length - 1; i++) {
    const seg = parts[i];
    const code = parts[i + 1];
    if ((seg === "p" || seg === "reel" || seg === "reels" || seg === "tv") && SHORTCODE_RE.test(code)) {
      const kind = seg === "p" ? "post" : seg === "tv" ? "tv" : "reel";
      const path = seg === "p" ? "p" : seg === "tv" ? "tv" : "reel";
      return { shortcode: code, kind, normalized: `https://www.instagram.com/${path}/${code}/` };
    }
  }

  throw new InstagramError(
    "INVALID_URL",
    "Couldn't find a post, reel or video ID in that link. Copy the link from the Instagram share menu and try again.",
  );
}

/** Convert a shortcode to Instagram's numeric media id. */
export function shortcodeToMediaId(shortcode: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";
  let id = BigInt(0);
  for (const ch of shortcode.slice(0, 11)) {
    const idx = alphabet.indexOf(ch);
    if (idx < 0) break;
    id = id * BigInt(64) + BigInt(idx);
  }
  return id.toString();
}

/* ------------------------------------------------------------------------ */
/* Helpers                                                                  */
/* ------------------------------------------------------------------------ */

function withTimeout(ms: number): { signal: AbortSignal; clear: () => void } {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, clear: () => clearTimeout(t) };
}

async function fetchText(
  input: string,
  init: RequestInit,
  timeoutMs: number,
): Promise<{ status: number; text: string; headers: Headers }> {
  const { signal, clear } = withTimeout(timeoutMs);
  try {
    const res = await fetch(input, { ...init, signal, redirect: init.redirect ?? "follow" });
    const text = await res.text();
    return { status: res.status, text, headers: res.headers };
  } finally {
    clear();
  }
}

function browserHeaders(extra: Record<string, string> = {}): Record<string, string> {
  return {
    "User-Agent": USER_AGENT,
    Accept: "*/*",
    "Accept-Language": "en-US,en;q=0.9",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-Mode": "cors",
    "Sec-Fetch-Dest": "empty",
    Origin: "https://www.instagram.com",
    Referer: "https://www.instagram.com/",
    ...extra,
  };
}

function statusToError(status: number, fallback: string): InstagramError {
  if (status === 429) return new InstagramError("RATE_LIMITED", "Instagram is rate limiting requests right now. Please wait a minute and try again.", 429);
  if (status === 404) return new InstagramError("NOT_FOUND", "This post doesn't exist or has been deleted.", 404);
  if (status === 401 || status === 403) return new InstagramError("PRIVATE_OR_UNAVAILABLE", "This content is private or requires login. Only public posts are supported.", 403);
  return new InstagramError("UPSTREAM_ERROR", fallback, 502);
}

function randomToken(len = 32): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  const bytes = new Uint8Array(len);
  crypto.getRandomValues(bytes);
  for (const b of bytes) out += chars[b % chars.length];
  return out;
}

function unescapeJsonish(s: string): string {
  return s
    .replace(/\\\\\//g, "/")
    .replace(/\\\//g, "/")
    .replace(/\\u0026/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/\\"/g, '"');
}

function toNumber(v: unknown): number | undefined {
  return typeof v === "number" && Number.isFinite(v) ? v : undefined;
}

type AnyRecord = Record<string, any>;

/* ------------------------------------------------------------------------ */
/* Normalisers                                                              */
/* ------------------------------------------------------------------------ */

function bestVideoVersion(list: AnyRecord[] | undefined): AnyRecord | undefined {
  if (!Array.isArray(list) || !list.length) return undefined;
  return [...list].sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0))[0];
}

function bestImageCandidate(list: AnyRecord[] | undefined): AnyRecord | undefined {
  if (!Array.isArray(list) || !list.length) return undefined;
  return [...list].sort((a, b) => (b.width ?? 0) * (b.height ?? 0) - (a.width ?? 0) * (a.height ?? 0))[0];
}

/** Normalise the "v1 / iPhone API" item format (`items[0]`). */
function normalizeV1Item(media: AnyRecord, shortcode: string, source: string): MediaResult {
  const items: MediaItem[] = [];

  const pushNode = (node: AnyRecord, index: number) => {
    const img = bestImageCandidate(node?.image_versions2?.candidates);
    const vid = node?.media_type === 2 ? bestVideoVersion(node?.video_versions) : undefined;
    if (vid?.url) {
      items.push({
        index,
        type: "video",
        url: vid.url,
        thumbnail: img?.url,
        width: toNumber(vid.width) ?? toNumber(node.original_width),
        height: toNumber(vid.height) ?? toNumber(node.original_height),
        duration: toNumber(node.video_duration),
      });
    } else if (img?.url) {
      items.push({
        index,
        type: "image",
        url: img.url,
        thumbnail: img.url,
        width: toNumber(img.width),
        height: toNumber(img.height),
      });
    }
  };

  if (Array.isArray(media.carousel_media) && media.carousel_media.length) {
    media.carousel_media.forEach((n: AnyRecord, i: number) => pushNode(n, i));
  } else {
    pushNode(media, 0);
  }

  if (!items.length) {
    throw new InstagramError("UPSTREAM_ERROR", "Instagram returned the post but without any downloadable media.", 502);
  }

  const kind: MediaResult["kind"] = media.product_type === "clips" ? "reel" : media.product_type === "igtv" ? "tv" : "post";

  return {
    shortcode,
    kind,
    permalink: `https://www.instagram.com/${kind === "post" ? "p" : kind === "tv" ? "tv" : "reel"}/${shortcode}/`,
    owner: media.user
      ? { username: media.user.username, fullName: media.user.full_name, avatar: media.user.profile_pic_url }
      : undefined,
    caption: typeof media.caption?.text === "string" ? media.caption.text : undefined,
    items,
    hasVideo: items.some((i) => i.type === "video"),
    hasImage: items.some((i) => i.type === "image"),
    source,
  };
}

/** Normalise the legacy GraphQL `shortcode_media` / `xdt_shortcode_media` format. */
function normalizeGraphNode(media: AnyRecord, shortcode: string, source: string): MediaResult {
  const items: MediaItem[] = [];

  const pushNode = (node: AnyRecord, index: number) => {
    const displayRes = bestImageCandidate(node?.display_resources?.map((r: AnyRecord) => ({ url: r.src, width: r.config_width, height: r.config_height })));
    const display = displayRes?.url ?? node?.display_url;
    if (node?.is_video && node?.video_url) {
      items.push({
        index,
        type: "video",
        url: node.video_url,
        thumbnail: display,
        width: toNumber(node?.dimensions?.width),
        height: toNumber(node?.dimensions?.height),
        duration: toNumber(node?.video_duration),
      });
    } else if (display) {
      items.push({
        index,
        type: "image",
        url: display,
        thumbnail: display,
        width: toNumber(displayRes?.width) ?? toNumber(node?.dimensions?.width),
        height: toNumber(displayRes?.height) ?? toNumber(node?.dimensions?.height),
      });
    }
  };

  const edges = media?.edge_sidecar_to_children?.edges;
  if (Array.isArray(edges) && edges.length) {
    edges.forEach((e: AnyRecord, i: number) => pushNode(e?.node ?? {}, i));
  } else {
    pushNode(media, 0);
  }

  if (!items.length) {
    throw new InstagramError("UPSTREAM_ERROR", "Instagram returned the post but without any downloadable media.", 502);
  }

  const kind: MediaResult["kind"] = media.product_type === "clips" ? "reel" : media.product_type === "igtv" ? "tv" : "post";

  return {
    shortcode,
    kind,
    permalink: `https://www.instagram.com/${kind === "post" ? "p" : kind === "tv" ? "tv" : "reel"}/${shortcode}/`,
    owner: media.owner
      ? { username: media.owner.username, fullName: media.owner.full_name, avatar: media.owner.profile_pic_url }
      : undefined,
    caption: media?.edge_media_to_caption?.edges?.[0]?.node?.text,
    items,
    hasVideo: items.some((i) => i.type === "video"),
    hasImage: items.some((i) => i.type === "image"),
    source,
  };
}

/* ------------------------------------------------------------------------ */
/* Strategies                                                               */
/* ------------------------------------------------------------------------ */

async function getCsrfToken(timeoutMs: number): Promise<string> {
  try {
    const { headers, text } = await fetchText(
      "https://www.instagram.com/",
      { headers: { "User-Agent": USER_AGENT, Accept: "text/html" } },
      timeoutMs,
    );
    const cookie = headers.get("set-cookie") || "";
    const m = cookie.match(/csrftoken=([^;,\s]+)/);
    if (m) return m[1];
    const m2 = text.match(/"csrf_token":"([^"]+)"/);
    if (m2) return m2[1];
  } catch {
    /* fall through */
  }
  return randomToken();
}

async function strategyGraphql(shortcode: string, docIds: string[], timeoutMs: number, log?: (m: string) => void): Promise<MediaResult> {
  const csrf = await getCsrfToken(timeoutMs);
  let lastError: InstagramError | undefined;

  for (const docId of docIds) {
    const variables = JSON.stringify({
      shortcode,
      fetch_tagged_user_count: null,
      hoisted_comment_id: null,
      hoisted_reply_id: null,
      __relay_internal__pv__PolarisAIGMMediaWebLabelEnabledrelayprovider: false,
    });

    const body = new URLSearchParams({
      av: "0",
      __d: "www",
      __user: "0",
      __a: "1",
      __req: "3",
      __hs: "20000.HYP:instagram_web_pkg.2.1..0.0",
      dpr: "1",
      __ccg: "UNKNOWN",
      __comet_req: "7",
      lsd: IG_LSD,
      jazoest: "2957",
      __spin_r: "1000000000",
      __spin_b: "trunk",
      fb_api_caller_class: "RelayModern",
      fb_api_req_friendly_name: "PolarisPostRootQuery",
      server_timestamps: "true",
      variables,
      doc_id: docId,
    });

    try {
      const { status, text } = await fetchText(
        "https://www.instagram.com/graphql/query",
        {
          method: "POST",
          headers: browserHeaders({
            "Content-Type": "application/x-www-form-urlencoded",
            "X-IG-App-ID": IG_APP_ID,
            "X-FB-LSD": IG_LSD,
            "X-ASBD-ID": IG_ASBD_ID,
            "X-CSRFToken": csrf,
            "X-FB-Friendly-Name": "PolarisPostRootQuery",
            "X-Requested-With": "XMLHttpRequest",
            Cookie: `csrftoken=${csrf}; ig_did=${randomToken(36)}; mid=${randomToken(28)}`,
          }),
          body: body.toString(),
        },
        timeoutMs,
      );

      log?.(`graphql doc_id=${docId} status=${status}`);

      if (status >= 400) {
        lastError = statusToError(status, `Instagram GraphQL responded with HTTP ${status}.`);
        if (status === 429) throw lastError;
        continue;
      }

      let json: AnyRecord;
      try {
        json = JSON.parse(text);
      } catch {
        lastError = new InstagramError("UPSTREAM_ERROR", "Instagram returned an unexpected (non‑JSON) response.", 502);
        continue;
      }

      if (json?.require_login || json?.status === "fail") {
        lastError = new InstagramError("PRIVATE_OR_UNAVAILABLE", "This post requires login to view. Only public posts are supported.", 403);
        continue;
      }

      const data = json?.data ?? {};

      // New "Polaris" format → v1 items
      const webInfoItems = data?.xdt_api__v1__media__shortcode__web_info?.items;
      if (Array.isArray(webInfoItems) && webInfoItems[0]) {
        return normalizeV1Item(webInfoItems[0], shortcode, `graphql:${docId}`);
      }

      // Legacy format
      const legacy = data?.xdt_shortcode_media ?? data?.shortcode_media;
      if (legacy) {
        return normalizeGraphNode(legacy, shortcode, `graphql:${docId}`);
      }

      // `data: {xdt_shortcode_media: null}` → private / deleted or retired doc_id
      lastError = new InstagramError("PRIVATE_OR_UNAVAILABLE", "This post is private, deleted or unavailable without login.", 403);
    } catch (err) {
      if (err instanceof InstagramError) {
        if (err.code === "RATE_LIMITED") throw err;
        lastError = err;
      } else {
        lastError = new InstagramError("UPSTREAM_ERROR", "Network error while contacting Instagram.", 502);
      }
    }
  }

  throw lastError ?? new InstagramError("UPSTREAM_ERROR", "GraphQL strategy failed.", 502);
}

async function strategyWebJson(shortcode: string, kindPath: string, timeoutMs: number, log?: (m: string) => void): Promise<MediaResult> {
  const { status, text } = await fetchText(
    `https://www.instagram.com/${kindPath}/${shortcode}/?__a=1&__d=dis`,
    {
      headers: browserHeaders({
        "X-IG-App-ID": IG_APP_ID,
        "X-Requested-With": "XMLHttpRequest",
        "Sec-Fetch-Mode": "navigate",
      }),
    },
    timeoutMs,
  );
  log?.(`webjson status=${status}`);
  if (status >= 400) throw statusToError(status, `Instagram responded with HTTP ${status}.`);

  let json: AnyRecord;
  try {
    json = JSON.parse(text);
  } catch {
    throw new InstagramError("UPSTREAM_ERROR", "Instagram returned a non‑JSON response (login wall).", 502);
  }
  if (json?.require_login) {
    throw new InstagramError("PRIVATE_OR_UNAVAILABLE", "This post requires login to view.", 403);
  }
  const item = json?.items?.[0];
  if (item) return normalizeV1Item(item, shortcode, "webjson");
  const node = json?.graphql?.shortcode_media;
  if (node) return normalizeGraphNode(node, shortcode, "webjson");
  throw new InstagramError("PRIVATE_OR_UNAVAILABLE", "This post is private, deleted or unavailable.", 403);
}

async function strategyMediaInfo(shortcode: string, timeoutMs: number, log?: (m: string) => void): Promise<MediaResult> {
  const mediaId = shortcodeToMediaId(shortcode);
  const { status, text } = await fetchText(
    `https://i.instagram.com/api/v1/media/${mediaId}/info/`,
    {
      headers: {
        "User-Agent": "Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)",
        "X-IG-App-ID": IG_APP_ID,
        Accept: "*/*",
      },
    },
    timeoutMs,
  );
  log?.(`mediainfo status=${status}`);
  if (status >= 400) throw statusToError(status, `Instagram media info responded with HTTP ${status}.`);
  let json: AnyRecord;
  try {
    json = JSON.parse(text);
  } catch {
    throw new InstagramError("UPSTREAM_ERROR", "Non‑JSON media info response.", 502);
  }
  const item = json?.items?.[0];
  if (!item) throw new InstagramError("PRIVATE_OR_UNAVAILABLE", "Media info unavailable without login.", 403);
  return normalizeV1Item(item, shortcode, "mediainfo");
}

async function strategyEmbed(shortcode: string, timeoutMs: number, log?: (m: string) => void): Promise<MediaResult> {
  const { status, text: html } = await fetchText(
    `https://www.instagram.com/p/${shortcode}/embed/captioned/`,
    {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
        Referer: "https://www.instagram.com/",
      },
    },
    timeoutMs,
  );
  log?.(`embed status=${status}`);
  if (status >= 400) throw statusToError(status, `Instagram embed responded with HTTP ${status}.`);

  // Embedded JSON blob (present for most public posts)
  const jsonMatch = html.match(/"shortcode_media\\?":(\{[\s\S]*?\})\s*\\?}\s*\\?}\s*\)?[;"]/);
  if (jsonMatch) {
    try {
      const node = JSON.parse(unescapeJsonish(jsonMatch[1]));
      if (node && (node.display_url || node.video_url)) return normalizeGraphNode(node, shortcode, "embed:json");
    } catch {
      /* continue to regex fallbacks */
    }
  }

  const items: MediaItem[] = [];
  const videoUrlMatch = html.match(/video_url\\?"\s*:\s*\\?"((?:[^"\\]|\\.)*?)\\?"/);
  const posterMatch = html.match(/display_url\\?"\s*:\s*\\?"((?:[^"\\]|\\.)*?)\\?"/);
  const videoTag = html.match(/<video[^>]+src="([^"]+)"/i);
  const imageTag = html.match(/class="EmbeddedMediaImage"[^>]*src="([^"]+)"/i) ?? html.match(/<img[^>]+class="EmbeddedMediaImage"[^>]+src="([^"]+)"/i);

  const videoUrl = videoUrlMatch ? unescapeJsonish(videoUrlMatch[1]) : videoTag ? unescapeJsonish(videoTag[1]) : undefined;
  const poster = posterMatch ? unescapeJsonish(posterMatch[1]) : imageTag ? unescapeJsonish(imageTag[1]) : undefined;

  if (videoUrl) items.push({ index: 0, type: "video", url: videoUrl, thumbnail: poster });
  else if (poster) items.push({ index: 0, type: "image", url: poster, thumbnail: poster });

  if (!items.length) {
    if (/private|not available|Sorry, this page isn't available|log in/i.test(html)) {
      throw new InstagramError("PRIVATE_OR_UNAVAILABLE", "This post is private, deleted or unavailable without login.", 403);
    }
    throw new InstagramError("UPSTREAM_ERROR", "Could not find media in the embed page.", 502);
  }

  const usernameMatch = html.match(/class="UsernameText">([^<]+)</) ?? html.match(/"username\\?":\\?"([^"\\]+)/);
  const isReel = /"product_type\\?":\\?"clips"/.test(html);

  return {
    shortcode,
    kind: isReel ? "reel" : "post",
    permalink: `https://www.instagram.com/${isReel ? "reel" : "p"}/${shortcode}/`,
    owner: usernameMatch ? { username: usernameMatch[1] } : undefined,
    items,
    hasVideo: items.some((i) => i.type === "video"),
    hasImage: items.some((i) => i.type === "image"),
    source: "embed:html",
  };
}

async function resolveShareLink(url: string, timeoutMs: number): Promise<string> {
  const { signal, clear } = withTimeout(timeoutMs);
  try {
    const res = await fetch(url, { redirect: "manual", signal, headers: { "User-Agent": USER_AGENT } });
    const loc = res.headers.get("location");
    if (loc) return loc.startsWith("http") ? loc : `https://www.instagram.com${loc}`;
    // Some runtimes follow redirects transparently
    if (res.url && res.url !== url) return res.url;
    throw new InstagramError("INVALID_URL", "Couldn't resolve this share link. Open it in your browser and copy the final URL.");
  } catch (err) {
    if (err instanceof InstagramError) throw err;
    throw new InstagramError("UPSTREAM_ERROR", "Failed to resolve share link.", 502);
  } finally {
    clear();
  }
}

/* ------------------------------------------------------------------------ */
/* Public API                                                               */
/* ------------------------------------------------------------------------ */

const ERROR_PRIORITY: Record<ErrorCode, number> = {
  RATE_LIMITED: 6,
  NOT_FOUND: 5,
  PRIVATE_OR_UNAVAILABLE: 4,
  STORIES_UNSUPPORTED: 3,
  INVALID_URL: 2,
  UPSTREAM_ERROR: 1,
};

export async function fetchInstagramMedia(rawUrl: string, opts: ExtractorOptions = {}): Promise<MediaResult> {
  const timeoutMs = opts.timeoutMs ?? 10_000;
  const docIds = opts.docIds?.length ? opts.docIds : DEFAULT_DOC_IDS;
  const log = opts.log;

  let parsed = parseInstagramUrl(rawUrl);

  if (parsed.kind === "share") {
    const resolved = await resolveShareLink(parsed.normalized, timeoutMs);
    parsed = parseInstagramUrl(resolved);
  }

  if (parsed.kind === "story") {
    throw new InstagramError(
      "STORIES_UNSUPPORTED",
      "Instagram Stories can only be viewed while logged in, so they can't be fetched without an account. We never ask for your login. Public posts, reels and photos are fully supported.",
      422,
    );
  }

  const shortcode = parsed.shortcode!;
  const kindPath = parsed.kind === "post" ? "p" : parsed.kind === "tv" ? "tv" : "reel";

  const strategies: Array<{ name: string; run: () => Promise<MediaResult> }> = [
    { name: "graphql", run: () => strategyGraphql(shortcode, docIds, timeoutMs, log) },
    { name: "embed", run: () => strategyEmbed(shortcode, timeoutMs, log) },
    { name: "webjson", run: () => strategyWebJson(shortcode, kindPath, timeoutMs, log) },
    { name: "mediainfo", run: () => strategyMediaInfo(shortcode, timeoutMs, log) },
  ];

  const errors: InstagramError[] = [];

  for (const s of strategies) {
    try {
      const result = await s.run();
      // Ensure permalink reflects the URL the user pasted when we know the kind.
      result.permalink = parsed.normalized;
      if ((parsed.kind === "reel" || parsed.kind === "tv") && result.kind === "post") result.kind = parsed.kind;
      log?.(`success via ${s.name}`);
      return result;
    } catch (err) {
      const e = err instanceof InstagramError ? err : new InstagramError("UPSTREAM_ERROR", (err as Error)?.message || "Unknown error", 502);
      log?.(`${s.name} failed: ${e.code} ${e.message}`);
      errors.push(e);
      if (e.code === "RATE_LIMITED") break;
    }
  }

  errors.sort((a, b) => ERROR_PRIORITY[b.code] - ERROR_PRIORITY[a.code]);
  const top = errors[0];
  if (top && top.code !== "UPSTREAM_ERROR") throw top;

  throw new InstagramError(
    "PRIVATE_OR_UNAVAILABLE",
    "We couldn't fetch this post. It may be private, deleted, age‑restricted, or Instagram may be temporarily blocking requests. Please double‑check the link is from a public account and try again in a moment.",
    422,
  );
}

/* ------------------------------------------------------------------------ */
/* Shared request handling (used by Next.js route, Worker and Deno)         */
/* ------------------------------------------------------------------------ */

export const ALLOWED_MEDIA_HOST_SUFFIXES = [".cdninstagram.com", ".fbcdn.net", "cdninstagram.com", "instagram.com"];

export function isAllowedMediaUrl(u: string): boolean {
  try {
    const url = new URL(u);
    if (url.protocol !== "https:") return false;
    const host = url.hostname.toLowerCase();
    return ALLOWED_MEDIA_HOST_SUFFIXES.some((s) => host === s.replace(/^\./, "") || host.endsWith(s));
  } catch {
    return false;
  }
}

export function jsonResponse(body: unknown, status = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
      ...extraHeaders,
    },
  });
}

export function errorResponse(err: unknown): Response {
  if (err instanceof InstagramError) {
    return jsonResponse({ ok: false, code: err.code, error: err.message }, err.status);
  }
  const message = err instanceof Error ? err.message : "Unexpected error";
  return jsonResponse({ ok: false, code: "UPSTREAM_ERROR", error: message }, 500);
}

/**
 * Minimal, best-effort in-memory rate limiter (per isolate). Stateless
 * deployments can't share state, but this still blunts abusive bursts.
 */
export function createRateLimiter(limit = 30, windowMs = 60_000) {
  const hits = new Map<string, { count: number; reset: number }>();
  return (key: string): { allowed: boolean; retryAfter: number } => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || entry.reset < now) {
      hits.set(key, { count: 1, reset: now + windowMs });
      if (hits.size > 5000) {
        for (const [k, v] of hits) if (v.reset < now) hits.delete(k);
      }
      return { allowed: true, retryAfter: 0 };
    }
    entry.count += 1;
    if (entry.count > limit) return { allowed: false, retryAfter: Math.ceil((entry.reset - now) / 1000) };
    return { allowed: true, retryAfter: 0 };
  };
}

/** Handle `/api/download` for any runtime. */
export async function handleDownloadRequest(
  request: Request,
  env: { IG_DOC_IDS?: string } = {},
  rateLimit?: ReturnType<typeof createRateLimiter>,
): Promise<Response> {
  if (request.method === "OPTIONS") return jsonResponse({}, 204);

  let url: string | null = null;
  if (request.method === "GET") {
    url = new URL(request.url).searchParams.get("url");
  } else if (request.method === "POST") {
    try {
      const ct = request.headers.get("content-type") || "";
      if (ct.includes("application/json")) {
        const body = (await request.json()) as { url?: string };
        url = body?.url ?? null;
      } else {
        const form = await request.formData();
        url = String(form.get("url") ?? "");
      }
    } catch {
      return jsonResponse({ ok: false, code: "INVALID_URL", error: "Malformed request body." }, 400);
    }
  } else {
    return jsonResponse({ ok: false, code: "INVALID_URL", error: "Method not allowed." }, 405);
  }

  if (rateLimit) {
    const ip =
      request.headers.get("cf-connecting-ip") ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "anonymous";
    const { allowed, retryAfter } = rateLimit(ip);
    if (!allowed) {
      return jsonResponse(
        { ok: false, code: "RATE_LIMITED", error: `Too many requests. Please wait ${retryAfter}s and try again.` },
        429,
        { "Retry-After": String(retryAfter) },
      );
    }
  }

  try {
    const docIds = env.IG_DOC_IDS?.split(",").map((s) => s.trim()).filter(Boolean);
    const result = await fetchInstagramMedia(url ?? "", { docIds });
    return jsonResponse({ ok: true, ...result });
  } catch (err) {
    return errorResponse(err);
  }
}

/** Handle `/api/proxy` – streams Instagram CDN media with a download filename. */
export async function handleProxyRequest(request: Request): Promise<Response> {
  if (request.method === "OPTIONS") return jsonResponse({}, 204);
  const sp = new URL(request.url).searchParams;
  const target = sp.get("url") || "";
  const filename = (sp.get("filename") || "quickvideosaver").replace(/[^\w.\-]+/g, "_").slice(0, 120);
  const inline = sp.get("inline") === "1";

  if (!isAllowedMediaUrl(target)) {
    return jsonResponse({ ok: false, code: "INVALID_URL", error: "Only Instagram CDN URLs can be proxied." }, 400);
  }

  const { signal, clear } = withTimeout(30_000);
  try {
    const upstream = await fetch(target, {
      signal,
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "*/*",
        Referer: "https://www.instagram.com/",
        ...(request.headers.get("range") ? { Range: request.headers.get("range")! } : {}),
      },
    });
    if (!upstream.ok && upstream.status !== 206) {
      return jsonResponse({ ok: false, code: "UPSTREAM_ERROR", error: `Media host responded with ${upstream.status}. The link may have expired – fetch the post again.` }, 502);
    }
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const headers = new Headers({
      "Content-Type": contentType,
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "private, max-age=0, no-store",
      "X-Content-Type-Options": "nosniff",
    });
    const len = upstream.headers.get("content-length");
    if (len) headers.set("Content-Length", len);
    const range = upstream.headers.get("content-range");
    if (range) headers.set("Content-Range", range);
    headers.set("Accept-Ranges", "bytes");
    if (!inline) {
      const ext = contentType.includes("video") ? "mp4" : contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
      const name = filename.includes(".") ? filename : `${filename}.${ext}`;
      headers.set("Content-Disposition", `attachment; filename="${name}"`);
    }
    return new Response(upstream.body, { status: upstream.status, headers });
  } catch {
    return jsonResponse({ ok: false, code: "UPSTREAM_ERROR", error: "Failed to fetch media from Instagram's CDN." }, 502);
  } finally {
    // Do not clear the timeout before the body has streamed; the abort only affects headers phase in practice.
    clear();
  }
}
