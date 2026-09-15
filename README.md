# QuickVideoSaver

Free online tool to download **public** Instagram videos, Reels, photos and audio by pasting a link.
No login, no watermark, nothing stored.

- **Frontend**: Next.js 16 App Router + Tailwind, single-column mobile-first UI.
- **Backend**: Next.js Route Handlers (`/api/download`, `/api/proxy`, `/api/contact`, `/api/health`).
- **Extractor**: `src/lib/instagram.ts` uses the Fetch API and standard Web APIs, so it is compatible with Cloudflare Workers.
- **Database**: none. The old Arena PostgreSQL/Drizzle template wiring has been removed.

## Routes

| Path        | Purpose                                   |
| ----------- | ----------------------------------------- |
| `/`         | Video downloader (home)                   |
| `/photo`    | Photo / carousel downloader               |
| `/audio`    | Audio – MP4 + in-browser WAV extraction   |
| `/reels`    | Reels downloader                          |
| `/stories`  | Stories (honest: needs login → explained) |
| `/privacy`  | Privacy Policy                            |
| `/terms`    | Terms of Service                          |
| `/dmca`     | DMCA policy + contact form                |

## API

```text
POST /api/download        { "url": "https://www.instagram.com/reel/XXXX/" }
GET  /api/download?url=…
→ { ok: true, shortcode, kind, owner, caption, items: [{ type: "video"|"image", url, thumbnail, width, height }], … }
→ { ok: false, code: "INVALID_URL" | "PRIVATE_OR_UNAVAILABLE" | "NOT_FOUND" | "RATE_LIMITED" | "STORIES_UNSUPPORTED" | "UPSTREAM_ERROR", error }

GET /api/proxy?url=<instagram-cdn-url>&filename=<name>
→ streams the file with Content-Disposition: attachment

POST /api/contact
→ optional webhook forwarding; nothing is stored by the app

GET /api/health
→ { ok: true, service: "quickvideosaver", database: false }
```

The extractor tries several public strategies in order (GraphQL `doc_id`s → embed page → web JSON → media-info)
and returns the most specific error. Instagram rotates `doc_id`s occasionally, so update `IG_DOC_IDS` without touching code.

## Environment variables

Copy `.env.example` to `.env.local` for local development. Server-only variables are never exposed to the browser.

Important variables:

- `NEXT_PUBLIC_SITE_URL` – canonical site URL.
- `NEXT_PUBLIC_CONTACT_EMAIL` – email shown on legal pages.
- `IG_DOC_IDS` – comma-separated Instagram GraphQL document IDs.
- `RATE_LIMIT_PER_MINUTE` – best-effort per-instance download rate limit.
- `CONTACT_WEBHOOK_URL` – optional contact/DMCA webhook.

## Cloudflare Workers deployment

The repository is configured for a **single full-stack Cloudflare Worker**. The same deployment serves the Next.js frontend and all API routes, so GitHub Pages and a separate API server are not required.

Cloudflare currently supports OpenNext for existing Next.js applications. Cloudflare now recommends vinext for new Next.js projects, but OpenNext remains a documented deployment path for existing applications. This repository uses OpenNext to keep the existing Next.js application architecture intact.

### Local development

```bash
npm install
npm run dev
```

### Cloudflare preview

```bash
npm run preview
```

This builds the application with OpenNext and starts it through Wrangler's Workers runtime.

### Deploy

```bash
npx wrangler login
npm run deploy
```

The deployment uses `wrangler.toml` and produces a `*.workers.dev` URL. After the domain is connected to Cloudflare, add `quickvideosaver.me` as the Worker's custom domain.

### Production variables

The Worker configuration contains the non-secret values needed by the application:

- `IG_DOC_IDS`
- `RATE_LIMIT_PER_MINUTE`

If you configure a contact webhook, set `CONTACT_WEBHOOK_URL` as a Worker secret rather than committing it to Git.

## Cost

The application does not require PostgreSQL, a VPS, or another paid backend. Cloudflare Workers can be started on its Free plan; actual costs depend on usage and the limits/pricing in effect on your Cloudflare account.

## Domain setup

1. Claim the free `.me` domain through the GitHub Student Developer Pack/Namecheap offer if your checkout qualifies.
2. Add the domain to Cloudflare and copy Cloudflare's assigned nameservers.
3. In Namecheap → Domain → Nameservers → **Custom DNS**, use Cloudflare's nameservers.
4. In Cloudflare Workers, add `quickvideosaver.me` as the Worker's custom domain.

You do **not** need GitHub Pages for this full-stack deployment.

## Legal

QuickVideoSaver is not affiliated with Instagram or Meta. It only works with public content, never asks for a login,
and stores nothing. Downloaded content may not be used commercially; users are responsible for how they use it.
See `/privacy`, `/terms` and `/dmca`.
