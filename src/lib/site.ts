export const SITE_NAME = "QuickVideoSaver";
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || "https://quickvideosaver.tech").replace(/\/$/, "");
export const CONTACT_EMAIL = process.env.NEXT_PUBLIC_CONTACT_EMAIL || "support@quickvideosaver.me";
/** Base URL of the API. Empty string = same origin (Next.js route handlers). Set to your Worker URL for static hosting. */
export const API_BASE = (process.env.NEXT_PUBLIC_API_BASE || "").replace(/\/$/, "");
// AdSense publisher ID is public. Keep a fallback here because NEXT_PUBLIC_* values are inlined by Next.js at build time, while Wrangler [vars] are runtime bindings.
export const ADSENSE_CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-9773847388363945";

export type ToolMode = "video" | "photo" | "audio" | "reels" | "stories";

export interface ToolConfig {
  mode: ToolMode;
  path: string;
  nav: string;
  title: string;
  h1: string;
  subtitle: string;
  placeholder: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  features: { title: string; text: string }[];
}

export const TOOLS: Record<ToolMode, ToolConfig> = {
  video: {
    mode: "video",
    path: "/",
    nav: "Video",
    title: "Instagram Video Downloader",
    h1: "Instagram Video Downloader",
    subtitle: "Download Instagram videos in full HD quality — free, fast and without watermark. Just paste the link.",
    placeholder: "Paste Instagram video link here…",
    metaTitle: "Instagram Video Downloader – Download IG Videos Free in HD | QuickVideoSaver",
    metaDescription:
      "QuickVideoSaver is a free online Instagram video downloader. Paste a public post link to save Instagram videos in HD MP4 – no login, no watermark, unlimited downloads.",
    keywords: ["instagram video downloader", "download instagram video", "ig video download", "save instagram video"],
    features: [
      { title: "Full HD quality", text: "We fetch the highest resolution MP4 that Instagram serves — no re‑encoding, no quality loss." },
      { title: "No watermark", text: "Videos are saved exactly as published, with no logos or overlays added." },
      { title: "Works everywhere", text: "iPhone, Android, Windows, Mac — anything with a browser. No app to install." },
      { title: "Carousel support", text: "Posts with multiple videos and photos are listed so you can grab each one." },
    ],
  },
  photo: {
    mode: "photo",
    path: "/photo",
    nav: "Photo",
    title: "Instagram Photo Downloader",
    h1: "Instagram Photo Downloader",
    subtitle: "Save Instagram photos and carousel images in original resolution. Paste the post link and download.",
    placeholder: "Paste Instagram photo link here…",
    metaTitle: "Instagram Photo Downloader – Save IG Photos in Full Resolution | QuickVideoSaver",
    metaDescription:
      "Download Instagram photos and carousel images in full resolution for free. Paste the public post URL – no login, no app, no watermark.",
    keywords: ["instagram photo downloader", "download instagram photo", "save instagram image", "ig image download"],
    features: [
      { title: "Original resolution", text: "Get the largest image Instagram stores — up to 1080px wide and beyond." },
      { title: "Carousels & albums", text: "Multi‑photo posts are split into individual images for download." },
      { title: "JPG output", text: "Photos are delivered as standard JPG files that open anywhere." },
      { title: "Private & secure", text: "Nothing is uploaded or stored — the file goes straight to your device." },
    ],
  },
  audio: {
    mode: "audio",
    path: "/audio",
    nav: "Audio",
    title: "Instagram Audio Downloader",
    h1: "Instagram Audio / MP3 Downloader",
    subtitle: "Extract the sound from any public Instagram reel or video. Download the original MP4 or convert to audio in your browser.",
    placeholder: "Paste Instagram reel or video link here…",
    metaTitle: "Instagram Audio Downloader – Extract MP3 / Sound from Reels | QuickVideoSaver",
    metaDescription:
      "Download the audio from Instagram reels and videos. Paste a public link to extract the sound as an audio file – free, no login required.",
    keywords: ["instagram audio downloader", "instagram mp3", "reel audio download", "instagram sound download"],
    features: [
      { title: "In‑browser extraction", text: "The audio track is extracted on your device using the Web Audio API — nothing is uploaded." },
      { title: "Original video too", text: "Prefer the full clip? Download the MP4 alongside the audio." },
      { title: "Reels & videos", text: "Works with any public reel, IGTV or feed video that contains sound." },
      { title: "Free & unlimited", text: "No limits, no accounts, no watermark." },
    ],
  },
  reels: {
    mode: "reels",
    path: "/reels",
    nav: "Reels",
    title: "Instagram Reels Downloader",
    h1: "Instagram Reels Downloader",
    subtitle: "Download Instagram Reels in HD without watermark. Paste the reel link and save it as MP4 in seconds.",
    placeholder: "Paste Instagram Reels link here…",
    metaTitle: "Instagram Reels Downloader – Save Reels in HD Without Watermark | QuickVideoSaver",
    metaDescription:
      "Free Instagram Reels downloader. Paste the reel URL to download Reels videos in HD MP4 with no watermark, no login, and no limits.",
    keywords: ["instagram reels downloader", "download reels", "reels video download", "save instagram reel"],
    features: [
      { title: "HD Reels", text: "Save Reels at the maximum quality Instagram offers, typically 1080p." },
      { title: "No watermark", text: "Unlike screen recording, the downloaded file has no watermark or UI overlay." },
      { title: "Lightning fast", text: "Our serverless backend fetches the media link in under a second." },
      { title: "Any device", text: "Works on iOS Safari, Android Chrome and desktop browsers alike." },
    ],
  },
  stories: {
    mode: "stories",
    path: "/stories",
    nav: "Stories",
    title: "Instagram Stories Downloader",
    h1: "Instagram Stories Downloader",
    subtitle: "Paste a story link to try fetching it. Note: Instagram requires login to view stories, so only public posts and reels can be guaranteed.",
    placeholder: "Paste Instagram story link here…",
    metaTitle: "Instagram Story Downloader – Save Stories Anonymously | QuickVideoSaver",
    metaDescription:
      "Try downloading Instagram Stories from public accounts. QuickVideoSaver never asks for your login and never stores files.",
    keywords: ["instagram story downloader", "download instagram stories", "save instagram story"],
    features: [
      { title: "Login‑free by design", text: "We will never ask for your Instagram credentials. If Instagram requires a login, we tell you honestly." },
      { title: "Reels & highlights", text: "Stories that were shared as Reels or posts can be downloaded via their post link." },
      { title: "No tracking", text: "We don't log which stories you view or download." },
      { title: "Always free", text: "Every tool on QuickVideoSaver is free with no limits." },
    ],
  },
};

export const TOOL_LIST: ToolConfig[] = [TOOLS.video, TOOLS.photo, TOOLS.audio, TOOLS.reels, TOOLS.stories];

export const FAQ = [
  {
    q: "Is QuickVideoSaver free to use?",
    a: "Yes. QuickVideoSaver is 100% free with no download limits. There is no premium tier and you will never be asked to pay.",
  },
  {
    q: "Do I need to log in or create an account?",
    a: "No. You never need to log in — not to Instagram and not to QuickVideoSaver. Simply paste a public post link and download.",
  },
  {
    q: "Is there a watermark on downloaded videos?",
    a: "No. Files are downloaded exactly as Instagram serves them, without any watermark or added branding.",
  },
  {
    q: "Do you store the videos or photos I download?",
    a: "No. Our backend is stateless: it looks up the public media URL and streams the file to your device. Nothing is saved on our servers and we keep no history of downloads.",
  },
  {
    q: "Can I download from private accounts?",
    a: "No. Only content from public accounts can be downloaded. We do not support (and will never ask for) Instagram logins, so private posts, close-friends stories and age-restricted content cannot be fetched.",
  },
  {
    q: "Where are the downloaded files saved?",
    a: "Files go to your browser's default download location. On iPhone open the Files app → Downloads; on Android check the Downloads folder or your gallery.",
  },
  {
    q: "Which devices and browsers are supported?",
    a: "Any modern browser on iPhone, iPad, Android, Windows, macOS or Linux. There is nothing to install.",
  },
  {
    q: "Can I use downloaded content commercially?",
    a: "No. Downloaded content remains the property of its original creator. It is provided for personal, non-commercial use only and you are responsible for obtaining permission before re-using it.",
  },
];
