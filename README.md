# QuickVideoSaver

Free online tool to download **public** Instagram videos, Reels, photos and audio by pasting a link.
No login, no watermark, nothing stored.

- **Frontend**: Next.js (App Router) + Tailwind, single-column mobile-first UI.
- **Backend**: one stateless endpoint (`/api/download`) + a streaming proxy (`/api/proxy`).
  The extractor lives in [`src/lib/instagram.ts`](src/lib/instagram.ts) and is pure `fetch` –
  the same file runs in Next.js route handlers, a **Cloudflare Worker** (`workers/`) and **Deno Deploy** (`deno/`).
- **No database.** (The template's Postgres wiring is only used by `/api/health` for the local sandbox.)

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

```
POST /api/download        { "url": "https://www.instagram.com/reel/XXXX/" }
GET  /api/download?url=…
→ { ok: true, shortcode, kind, owner, caption, items: [{ type: "video"|"image", url, thumbnail, width, height }], … }
→ { ok: false, code: "INVALID_URL" | "PRIVATE_OR_UNAVAILABLE" | "NOT_FOUND" | "RATE_LIMITED" | "STORIES_UNSUPPORTED" | "UPSTREAM_ERROR", error }

GET  /api/proxy?url=<instagram cdn url>&filename=<name>   → streams the file with Content-Disposition: attachment
```

The extractor tries several public strategies in order (GraphQL `doc_id`s → embed page → web JSON → media-info)
and returns the most specific error. Instagram rotates `doc_id`s occasionally – update `IG_DOC_IDS`
(env var / `wrangler.toml`) without touching code.

## Environment variables

See [`.env.example`](.env.example).

## Deploying for free (no credit card)

### Option A – everything on Cloudflare Workers (recommended, simplest)

```bash
npm i -D @opennextjs/cloudflare wrangler
npx opennextjs-cloudflare build && npx opennextjs-cloudflare deploy
```

Cloudflare's free Workers plan (100k requests/day) runs the whole Next.js app including the API routes.

### Option B – static frontend + separate serverless API

1. **API → Cloudflare Worker**
   ```bash
   npx wrangler login
   npx wrangler deploy          # uses wrangler.toml → https://quickvideosaver-api.<you>.workers.dev
   ```
   (or **Deno Deploy**: create a project at dash.deno.com, link the repo, entrypoint `deno/main.ts`).

2. **Frontend → Cloudflare Pages or GitHub Pages**
   Set `NEXT_PUBLIC_API_BASE=https://quickvideosaver-api.<you>.workers.dev`, remove `src/app/api`
   (the Worker replaces it), add `output: "export"` to `next.config.ts` and build:
   ```bash
   npx next build      # static site in ./out
   ```
   Upload `out/` to Cloudflare Pages (`npx wrangler pages deploy out`) or push it to the `gh-pages` branch.

3. Set `ALLOWED_ORIGIN` on the Worker to your site origin to lock down CORS.

### Domain (GitHub Student Pack → Namecheap `.me`)

1. Claim the free `.me` domain in the Student Developer Pack.
2. Add the domain to Cloudflare (free plan) and copy the two nameservers.
3. In Namecheap → Domain → Nameservers → *Custom DNS* → paste Cloudflare's nameservers.
4. In Cloudflare: Pages/Workers → *Custom domains* → add `quickvideosaver.me` (and `api.` if using Option B).

## Legal

QuickVideoSaver is not affiliated with Instagram or Meta. It only works with public content, never asks for a login,
and stores nothing. Downloaded content may not be used commercially; users are responsible for how they use it.
See `/privacy`, `/terms` and `/dmca`.
