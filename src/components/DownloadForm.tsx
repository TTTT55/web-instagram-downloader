"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent, type MouseEvent } from "react";
import type { MediaItem, MediaResult } from "@/lib/instagram";
import { API_BASE, type ToolMode } from "@/lib/site";
import { extractAudioToWav, saveBlob } from "@/lib/audio";

type ApiResponse = ({ ok: true } & MediaResult) | { ok: false; code: string; error: string };

interface Props {
  mode: ToolMode;
  placeholder: string;
}

const STORIES_HINT_RE = /instagram\.com\/stories\//i;

function proxyUrl(url: string, filename: string, inline = false) {
  const p = new URLSearchParams({ url, filename });
  if (inline) p.set("inline", "1");
  return `${API_BASE}/api/proxy?${p.toString()}`;
}

function downloadFileUrl(url: string, filename: string) {
  const p = new URLSearchParams({ url, filename });
  return `${API_BASE}/api/download-file?${p.toString()}`;
}

function fileBase(result: MediaResult, item: MediaItem) {
  const user = result.owner?.username ? `${result.owner.username}_` : "";
  const suffix = result.items.length > 1 ? `_${item.index + 1}` : "";
  return `quickvideosaver_${user}${result.shortcode}${suffix}`;
}

export function DownloadForm({ mode, placeholder }: Props) {
  const [url, setUrl] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [result, setResult] = useState<MediaResult | null>(null);
  const [canPaste, setCanPaste] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCanPaste(typeof navigator !== "undefined" && !!navigator.clipboard?.readText);
  }, []);

  useEffect(() => {
    if (result && resultRef.current) {
      resultRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [result]);

  const submit = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      setError(null);
      setResult(null);
      if (!trimmed) {
        setError({ code: "INVALID_URL", message: "Please paste an Instagram link first." });
        inputRef.current?.focus();
        return;
      }
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/download`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: trimmed, mode }),
        });
        const data = (await res.json()) as ApiResponse;
        if (!data.ok) {
          setError({ code: data.code, message: data.error });
        } else {
          setSourceUrl(trimmed);
          setResult(data);
        }
      } catch {
        setError({ code: "NETWORK", message: "Network error. Please check your connection and try again." });
      } finally {
        setLoading(false);
      }
    },
    [mode],
  );

  const refreshItem = useCallback(
    async (index: number) => {
      if (!sourceUrl) throw new Error("The original Instagram link is no longer available. Please fetch the post again.");

      const res = await fetch(`${API_BASE}/api/download`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: sourceUrl, mode }),
      });
      const data = (await res.json()) as ApiResponse;

      if (!data.ok) throw new Error(data.error);

      const fresh = data.items.find((candidate) => candidate.index === index) ?? data.items[index];
      if (!fresh) throw new Error("Instagram did not return that media item. Please try fetching the post again.");
      return fresh;
    },
    [mode, sourceUrl],
  );

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void submit(url);
  };

  const onPaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text);
        void submit(text);
      }
    } catch {
      inputRef.current?.focus();
    }
  };

  const reset = () => {
    setUrl("");
    setSourceUrl("");
    setResult(null);
    setError(null);
    inputRef.current?.focus();
  };

  const showStoriesHint = mode !== "stories" && STORIES_HINT_RE.test(url);

  return (
    <div className="w-full">
      <form onSubmit={onSubmit} className="card flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:p-2 sm:pl-4" noValidate>
        <div className="relative flex flex-1 items-center">
          <svg className="pointer-events-none absolute left-3 h-5 w-5 text-slate-400 sm:left-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <input
            ref={inputRef}
            type="url"
            inputMode="url"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="none"
            spellCheck={false}
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={placeholder}
            aria-label="Instagram link"
            className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3.5 pl-10 pr-24 text-base text-slate-900 outline-none ring-brand-500/30 placeholder:text-slate-400 focus:border-brand-500 focus:ring-4 sm:border-0 sm:bg-transparent sm:pl-7 sm:focus:ring-0"
          />
          <div className="absolute right-2 flex items-center gap-1">
            {url ? (
              <button
                type="button"
                onClick={reset}
                className="rounded-lg px-2 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
                aria-label="Clear"
              >
                Clear
              </button>
            ) : canPaste ? (
              <button
                type="button"
                onClick={onPaste}
                className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                  <rect x="8" y="2" width="8" height="4" rx="1" />
                  <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                </svg>
                Paste
              </button>
            ) : null}
          </div>
        </div>
        <button type="submit" className="btn-primary w-full sm:w-auto sm:min-w-[150px]" disabled={loading}>
          {loading ? (
            <>
              <svg className="spinner h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              </svg>
              Fetching…
            </>
          ) : (
            <>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M12 3v12" />
                <path d="m7 10 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
              Download
            </>
          )}
        </button>
      </form>

      <p className="mt-3 text-center text-xs text-slate-500">
        By using this tool you agree to our{" "}
        <a href="/terms" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-800">
          Terms of Service
        </a>
        . Public content only — we never ask for your login.
      </p>

      {showStoriesHint && !error && !result ? (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          That looks like a Story link. Instagram requires a login to view Stories, so they usually can&apos;t be fetched. Posts and Reels
          work great.
        </div>
      ) : null}

      {error ? <ErrorBox code={error.code} message={error.message} /> : null}

      {result ? (
        <div ref={resultRef} className="mt-6 scroll-mt-24">
          <ResultCard result={result} mode={mode} refreshItem={refreshItem} />
        </div>
      ) : null}
    </div>
  );
}

function ErrorBox({ code, message }: { code: string; message: string }) {
  const tone =
    code === "RATE_LIMITED"
      ? "border-amber-200 bg-amber-50 text-amber-900"
      : code === "STORIES_UNSUPPORTED"
        ? "border-sky-200 bg-sky-50 text-sky-900"
        : "border-red-200 bg-red-50 text-red-900";
  const title =
    code === "INVALID_URL"
      ? "Invalid link"
      : code === "PRIVATE_OR_UNAVAILABLE"
        ? "Private or unavailable"
        : code === "NOT_FOUND"
          ? "Post not found"
          : code === "RATE_LIMITED"
            ? "Slow down a moment"
            : code === "STORIES_UNSUPPORTED"
              ? "Stories need a login"
              : "Something went wrong";
  return (
    <div role="alert" className={`mt-4 rounded-xl border p-4 text-sm ${tone}`}>
      <p className="font-semibold">{title}</p>
      <p className="mt-1 leading-relaxed opacity-90">{message}</p>
    </div>
  );
}

function ResultCard({ result, mode, refreshItem }: { result: MediaResult; mode: ToolMode; refreshItem: (index: number) => Promise<MediaItem> }) {
  const items = result.items;
  const filtered =
    mode === "photo"
      ? items.filter((i) => i.type === "image")
      : mode === "audio"
        ? items.filter((i) => i.type === "video")
        : items;
  const shown = filtered.length ? filtered : items;
  const noteMismatch = filtered.length === 0;

  return (
    <section className="card overflow-hidden" aria-live="polite">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        {result.owner?.avatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={proxyUrl(result.owner.avatar, "avatar", true)}
            alt=""
            className="h-9 w-9 rounded-full bg-slate-100 object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <span className="ig-gradient inline-flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white">
            {(result.owner?.username || "IG").slice(0, 1).toUpperCase()}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {result.owner?.username ? `@${result.owner.username}` : "Instagram"}{" "}
            <span className="ml-1 rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-500">
              {result.kind}
            </span>
          </p>
          {result.caption ? <p className="line-clamp-3 text-xs text-slate-500">{result.caption}</p> : null}
        </div>
        <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
          {items.length} file{items.length === 1 ? "" : "s"}
        </span>
      </div>

      {noteMismatch ? (
        <p className="border-b border-slate-100 bg-amber-50 px-4 py-2 text-xs text-amber-800">
          {mode === "photo"
            ? "This post has no photos — but here is the media it contains."
            : "This post has no video with audio — here is the media it contains."}
        </p>
      ) : null}

      <ul className="grid gap-4 p-4 sm:grid-cols-2">
        {shown.map((item) => (
          <MediaCard key={item.index} item={item} result={result} mode={mode} refreshItem={refreshItem} />
        ))}
      </ul>
    </section>
  );
}

function MediaCard({ item, result, mode, refreshItem }: { item: MediaItem; result: MediaResult; mode: ToolMode; refreshItem: (index: number) => Promise<MediaItem> }) {
  const base = fileBase(result, item);
  const [audioState, setAudioState] = useState<"idle" | "downloading" | "decoding" | "encoding" | "error">("idle");
  const [audioError, setAudioError] = useState<string | null>(null);
  const [downloadState, setDownloadState] = useState<"idle" | "downloading" | "error">("idle");
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [thumbSrc, setThumbSrc] = useState<string | undefined>(item.thumbnail);
  const [thumbFallback, setThumbFallback] = useState(false);

  const download = async (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setDownloadError(null);
    setDownloadState("downloading");

    try {
      const fresh = await refreshItem(item.index);
      const filename = `${base}.${fresh.type === "video" ? "mp4" : "jpg"}`;

      // First try the browser-to-Instagram CDN path. Some Instagram CDN
      // responses allow CORS, which lets us turn the fresh response into a
      // same-origin blob URL and use the browser's real download mechanism.
      try {
        const upstream = await fetch(fresh.url, {
          mode: "cors",
          credentials: "omit",
          cache: "no-store",
        });
        if (!upstream.ok) throw new Error(`Instagram CDN responded with ${upstream.status}.`);

        const blob = await upstream.blob();
        const blobUrl = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = blobUrl;
        anchor.download = filename;
        anchor.style.display = "none";
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
        setDownloadState("idle");
        return;
      } catch {
        // Fall back to a same-origin streaming endpoint. It sets
        // Content-Disposition: attachment without navigating to Instagram.
      }

      window.location.assign(downloadFileUrl(fresh.url, filename));
    } catch (err) {
      setDownloadState("error");
      setDownloadError((err as Error).message);
    }
  };

  const onExtractAudio = async () => {
    setAudioError(null);
    try {
      const fresh = await refreshItem(item.index);
      const blob = await extractAudioToWav(proxyUrl(fresh.url, `${base}.mp4`, true), (stage) => setAudioState(stage));
      saveBlob(blob, `${base}.wav`);
      setAudioState("idle");
    } catch (err) {
      setAudioState("error");
      setAudioError((err as Error).message);
    }
  };

  const onThumbError = () => {
    if (!thumbFallback && item.thumbnail) {
      setThumbFallback(true);
      setThumbSrc(proxyUrl(item.thumbnail, "thumb", true));
    } else {
      setThumbSrc(undefined);
    }
  };

  const busy = audioState === "downloading" || audioState === "decoding" || audioState === "encoding";
  const downloading = downloadState === "downloading";

  return (
    <li className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
      <div className="relative aspect-square w-full overflow-hidden bg-slate-200">
        {thumbSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={thumbSrc} alt="" className="h-full w-full object-cover" referrerPolicy="no-referrer" loading="lazy" onError={onThumbError} />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">No preview</div>
        )}
        <span className="absolute left-2 top-2 rounded-md bg-black/70 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
          {item.type === "video" ? "Video" : "Photo"}
          {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
        </span>
        {item.type === "video" ? (
          <span className="absolute inset-0 flex items-center justify-center">
            <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/85 text-slate-800 shadow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M8 5v14l11-7z" />
              </svg>
            </span>
          </span>
        ) : null}
      </div>

      <div className="flex flex-col gap-2 p-3">
        {mode === "audio" && item.type === "video" ? (
          <>
            <button type="button" onClick={onExtractAudio} disabled={busy || downloading} className="btn-primary !py-2.5 text-sm">
              {busy ? (
                <>
                  <svg className="spinner h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden>
                    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeOpacity="0.3" strokeWidth="3" />
                    <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {audioState === "downloading" ? "Downloading…" : audioState === "decoding" ? "Extracting audio…" : "Encoding…"}
                </>
              ) : (
                "Download Audio (WAV)"
              )}
            </button>
            <a href="#download" onClick={download} className="btn-secondary" aria-disabled={downloading}>
              {downloading ? "Preparing MP4…" : "Download MP4"}
            </a>
            {audioError ? <p className="text-xs text-red-600">{audioError}</p> : null}
            {downloadError ? <p className="text-xs text-red-600">{downloadError}</p> : null}
          </>
        ) : (
          <>
            <a href="#download" onClick={download} className="btn-primary !py-2.5 text-sm" aria-disabled={downloading}>
              {downloading ? "Preparing download…" : `Download ${item.type === "video" ? "Video" : "Photo"}`}
            </a>
            <a href={item.url} target="_blank" rel="noopener noreferrer nofollow" className="btn-secondary">
              Open in new tab
            </a>
            {downloadError ? <p className="text-xs text-red-600">{downloadError}</p> : null}
          </>
        )}
      </div>
    </li>
  );
}
