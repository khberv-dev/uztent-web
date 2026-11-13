# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`uztent-web` is a Vite + React 19 SPA (plain JS/JSX, no TypeScript) for a Twitch-like streaming product. Dark UI modeled on twitch.tv with **blue** (`--color-primary`) instead of Twitch purple. Backend is a separate API at `VITE_API_URL` (default `http://localhost:8000/v1`).

## Commands

```bash
npm install
cp .env.example .env         # required: env.js throws at startup if a required VITE_* var is missing
npm run dev       # http://localhost:8080 (port is fixed: it must match the Google OAuth redirect URI)
npm run build
npm run preview   # also on 8080
npm run lint
```

No test runner is configured (Vitest would be the natural fit).

## Architecture

- **UI language is Uzbek (Latin script)**, with no i18n layer: strings are written in Uzbek directly in the components. Words Uzbek users say in English stay English: stream, live, chat, video, link, username, email, moderator, ban/unban, slow mode, stream key, server, encoder, offline. Use `ʻ` (U+02BB) in oʻ/gʻ and `’` for the apostrophe in suffixes on English words (`live’da`, `encoder’da`). Dates and numbers use `Intl` with `'uz'` (`lib/format.js`). The API's messages are English: `getErrorMessage()` maps the documented ones to Uzbek (`API_MESSAGES` in `api/errors.js`). Code that branches on an API message must read the raw `error.response.data.message`, not the translated text.
- **Env flags:** `VITE_SHOW_BETA_BADGE=true` shows a "Beta" label next to the navbar logo. Optional flags go through `flag()` in `config/env.js` (`true`/`1`/`yes`), and components read them from `env`, never from `import.meta.env`.
- **Import alias:** `@/` → `src/` (set in `vite.config.js`).
- **Components follow atomic design** in `src/components/{atoms,molecules,organisms,templates}`, then `src/pages`. Each component lives in its own folder (`Name/Name.jsx`, `Name.module.css`, `index.js`), and every level has a barrel `index.js`. Import from the barrel (`@/components/atoms`). Lower levels must not import from higher ones. Atoms are presentational and data-free. Organisms may call feature hooks (e.g. `Sidebar` uses `useRecommendedChannels`).
- **Styling:** CSS Modules plus design tokens in `src/styles/tokens.css`. `html { font-size: 62.5% }`, so `1rem = 10px`. Use tokens (`var(--space-3)`, `var(--color-surface)`) instead of raw values. Join class names with `cn()` from `@/lib/cn`.
- **Data layer:** `src/api/client.js` is the single axios instance. Endpoint wrappers live in `src/api/{auth,users}.js`, and NestJS error parsing (`getErrorMessage`, `getValidationErrors` to map 400 messages onto form fields) lives in `src/api/errors.js`. React code reaches data only through TanStack Query hooks in `src/features/<feature>/`. The current user is the `queryKeys.me` query (`useMe()` in `features/users`), not session state.
- **Session (`src/lib/session.js`):** the access token is kept in memory only; the refresh token is kept in localStorage (as the API's client guide recommends). "Signed in" means a refresh token exists (`useIsAuthenticated()`). Every auth response (`/auth/google`, `/auth/login`, `/auth/refresh`, `/auth/password`) must go through `applyAuthResponse()` in `lib/authSession.js`, which stores the new token pair and seeds the `me` cache. When the session ends, the whole query cache is cleared automatically.
- **Routing:** `react-router` (v8, declarative `<Routes>`) in `src/routes/AppRoutes.jsx`, with path constants in `routes/paths.js`. Never hard-code paths. Viewer (consumer) and streamer (publisher) pages are kept separate:
  - **Auth:** `/auth` and `/auth/google` use `AuthLayout`.
  - **Viewer pages** use `MainLayout` (navbar plus the "Live now" sidebar): `/`, `/w/:username` (a channel's current live stream; `getByUsername()` returns `{status: 'live', stream}`, or `offline` for 404 `User is not live`, or `not-found` for 404 `User not found`), `/streams/:id` (one live session), `/vods/:id`, and `/settings` for the account (profile, password). `/w/:username` and `/streams/:id` render the same `LiveStreamView` organism.
  - **Streamer pages** live under the **`/dashboard` prefix** (`paths.dashboard.*`) and use `DashboardLayout` (navbar plus `DashboardNav`): `/dashboard` is the stream manager, `/dashboard/videos` the user's recordings, `/dashboard/settings` the stream key. Their page components are in `src/pages/dashboard/`. New publisher features go here, not in the viewer pages.
  - **Public vs protected:** `/`, `/w/:username` and `/streams/:id` are public, because their endpoints need no token. Signed-out visitors see a "Log in" button, and anything needing a login (VOD lists, the VOD lookup after a stream ends) is hidden for them. `/vods/:id`, `/settings` and all of `/dashboard` are wrapped in `ProtectedRoute`. After signing in, the user goes back to `location.state.from`; for Google this is kept in sessionStorage across the redirect (`redirectToGoogle(returnTo)`). Guards redirect as soon as auth state changes, so sign-in and sign-out code never needs to navigate.

## Auth and the backend API

The backend docs define these endpoints: `POST /auth/{google,login,refresh,logout,password}`, `GET/PATCH /users/me`, plus the stream, VOD and chat endpoints below. Rules that shape the client code:

- **Refresh tokens are single use.** `refreshAccessToken()` in `client.js` shares one in-flight refresh per tab and takes a Web Lock (`uztent.auth.refresh`) across tabs. It re-reads the token from storage inside the lock. Don't call `/auth/refresh` any other way.
- **Interceptors:** the request interceptor refreshes first when there's no access token (for example after a page reload). The response interceptor refreshes and retries once **only** on a 401 whose body is exactly `message: "Unauthorized"`. Other 401s on protected endpoints (such as `Current password is incorrect` from `/auth/password`) are passed to the caller. A failed refresh clears the session, and so does `404 User not found`, but only from `/users/me` or `/auth/password` (`ACCOUNT_PATHS`). `GET /streams/:username` returns the same message for an unknown username, which must not sign anyone out. Public endpoints are listed in `PUBLIC_PATHS`.
- **Unknown body fields are rejected with 400.** Send only documented fields. `PATCH /users/me` sends only changed fields (`username: null` removes the username).
- **Sign-out** (`useSignOut`) clears local tokens first, then calls `/auth/logout` and ignores any failure (logout is idempotent).
- **Google flow:** `redirectToGoogle()` (`lib/googleOAuth.js`) uses the implicit `id_token` flow. It adds a `nonce` (Google requires it) and a `state` saved in sessionStorage. `GoogleCallbackPage` checks `state`, removes the token from the URL hash, then calls `POST /auth/google`. Failures redirect to `/auth` with `location.state.error`.
- **Password login** only works after the user sets a password in Settings. Sign-up is Google-only.

## Streams and VODs

- **Going live happens outside the app.** The app never starts or ends a stream. When OBS connects with the user's stream key, MediaMTX's webhooks make the API start the live session; when OBS disconnects, the session ends and is saved as a VOD. The app learns about both from WebSocket events (below), not polling.
- **Real-time events (no polling):** `api/events.js` keeps one shared WebSocket to `env.wsUrl` (`ws://host:port/ws`, not under `/v1`; defaults to the API origin). It reconnects with backoff. `LiveEventsBridge` (mounted once in `App.jsx`) feeds every event into the query cache via `applyServerEvent()` in `features/streams/liveEvents.js`:
  - `stream.started` adds the stream to the lists, sets the detail entry, and sets "mine" if it's the user's own. Offline channel pages re-check, because events carry `userId`, not `username`.
  - `stream.ended` removes it, marks the detail entry stale (the refetch gets a 404, which leads to the VOD), sets the channel to offline and refreshes VOD lists.
  - `stream.viewers` updates every count.
  - Events missed while disconnected aren't replayed, so a reconnect invalidates all `['streams']` queries. When adding a new live query, update this file so it stays current.
- **Live streams** (`api/streams.js`, `features/streams`) exist only while live. A stream that has ended returns `404` from `GET /streams/:id` and becomes a **VOD with the same id** (`api/vods.js`, `features/vods`). `StreamPage` relies on this: a 404 triggers a VOD lookup and a redirect to `/vods/:id`. Its 30-second refetch is also how viewers find out a stream ended.
- **Paginated lists** return `{items, total, page, limit}`. Use `useInfiniteQuery` with `nextPageParam`/`flattenPages` from `lib/pagination.js`.
- **`GET /streams/me` is the stream settings, not the live stream.** It returns `title`, `streamKey` and `publishUrl`, or 404 before a key has ever been generated; `getSettings()` turns that 404 into `null`. `PATCH /streams/me { title }` sets the title for upcoming broadcasts and also renames the current one if live; it returns 404 until a key exists. `POST /streams/me/key` generates or replaces the key; the old key stops working for new broadcasts, and a broadcast already running continues. **OBS's "Stream Key" is `encoderStreamKey` (`<id>?key=<streamKey>`), not the raw `streamKey`.** The key UI (`StreamKeyCard`) is on `/dashboard/settings`; `/dashboard` has the live status and the stream title. There is no "my live stream" endpoint, so `useMyLiveStream()` scans `GET /streams` (100 per page) for the current user's id.
- **The API has no public user lookup yet.** Streams and VODs only carry `userId`, so `streamerName()` shows the current user's own name and "Streamer" for everyone else.
- **Playback:** `VideoPlayer` (molecule, `components/molecules/VideoPlayer/`) has fully custom controls; never turn native `controls` back on. It loads `hls.js` lazily as its own chunk and falls back to native HLS on iOS Safari.
  - **Live:** the seek bar covers the DVR window, and dragging to the end returns to live. The LIVE indicator is red at the live edge, and grey and clickable ("Go to live") when the viewer is behind. The window's start comes from the hls.js playlist (first fragment), not `video.seekable`, which can start at 0 even after the server deleted those segments (seeking there silently fails).
  - **Recordings:** the seek bar covers the whole video and shows the buffered range and time.
  - Changing `src` swaps the source in place, so fullscreen and volume survive a quality change. Don't remount the player with `key` for that.
  - A failing live manifest means the encoder isn't sending video yet, so the player retries every 5 seconds and shows a waiting state.
  - `LivePlayer` maps `stream.url` ("Source") and `stream.renditions` to the quality menu. The default is 720p, and the viewer's choice, volume and mute are remembered (`lib/preferences.js`).
- **Chat** (`api/chat.js`, `features/chat`, `ChatPanel` organism): every live stream has a chat, stored under the stream id, which becomes the VOD id, so `ChatPanel` with `live={false}` on `/vods/:id` is the replay. It's docked beside the player on `/streams/:id`, `/w/:username`, `/vods/:id`, and on `/dashboard` while live.
  - Reading is public: `GET /streams/:id/chat` returns the newest messages oldest first, and `before` pages back. `useChatHistory` is an infinite query whose `pages[0]` is the newest page; helpers are in `features/chat/keys.js`.
  - New messages, deletions and slow-mode changes arrive only for chats this connection joined. `useChatRoom(streamId)` calls `joinChat()` in `api/events.js`, which is ref-counted and rejoins after a reconnect. `LiveEventsBridge` sends `chat.*` events to `applyChatEvent()` (`features/chat/chatEvents.js`). Messages are de-duplicated by id, because a sender gets its own message from both the POST and the socket.
  - Writing needs a login and a live stream. `429` (rate limit or slow mode, "wait N s") and `403` (banned) keep the typed text.
  - `GET /streams/:id/chat/me` (`useChatPermissions`) decides the controls: delete and ban when `canModerate`, and make or remove moderator only for the streamer. Nobody can act on the streamer, and moderators can't act on other moderators.
  - Slow mode is `chatSlowModeSeconds` on the stream settings (`PATCH /streams/me`, `useUpdateChatSlowMode`) and on each live stream; `chat.settings` events update both. Slow mode, moderators and bans (`/streams/me/moderators`, `/streams/me/bans`) are managed in the "Chat settings" modal (gear in the chat header, streamer only; `ChatModerationSettings embedded` inside the `Modal` molecule). Moderators can only be added by user id, so they're added from a chat message.
- **VODs:** `previewUri` and `videoUri` stay `null` until the media pipeline fills them in (nothing fills them yet). The UI shows a "processing" state and polls.
- **Backend config the frontend depends on:** the API's `CORS_ORIGINS` must include `http://localhost:8080`, or the browser blocks every request. Google's redirect URI `http://localhost:8080/auth/google` must be authorized on the OAuth client.
- **IDs in paths must be UUIDs** (the API returns 400 otherwise). Check them with `isUuid()` before querying.
- `Button` accepts `as={Link} to="…"` for navigation. Don't nest a `<Button>` inside a `<Link>`.
