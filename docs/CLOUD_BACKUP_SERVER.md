# Cloud backup API — developer setup

The PWA talks to **your** HTTPS API when a base URL is set. Nothing is sent if the URL is empty.

## 1. Configure the app (prefer `agri-config.js`)

**Recommended:** edit **`agri-config.js`** in the repo root (loaded before `app.js`):

```javascript
window.AGRI_CONFIG.cloudBackupBaseUrl = "https://YOUR-WORKER.workers.dev/agri";
```

Use **no trailing slash**. The app calls:

| Action | Method | URL |
|--------|--------|-----|
| Auto-upload (online + backup email in Profile) | `POST` | `{BASE}/backup` |
| User taps “Recover using email” | `POST` | `{BASE}/recover-request` |
| Recovery link from email (opens app) | `GET` | `{BASE}/recover-complete?token=...` |

**Fallback:** you can still set `AGRI_CLOUD_BACKUP_BASE_URL` in `app.js`; **`agri-config.js` wins** if it is non-empty.

After changes, bump query strings in `index.html` (`agri-config.js?v=`, `app.js?v=`) so caches refresh.

### Recovery link flow

1. User requests recovery → `POST /recover-request` with `{ email }`.
2. Server creates a short-lived token, emails a link to **`APP_PUBLIC_URL?recoverToken=TOKEN`** (see `server/wrangler.toml`).
3. User opens the link → the app calls **`GET {BASE}/recover-complete?token=TOKEN`**, receives `{ backup }`, then runs the **same PIN check** as file restore before replacing data.

## 2. Ready-made server in this repo

See **`server/README.md`**: Cloudflare Worker + KV + optional Resend email.

- `server/worker.js` — deployable worker  
- `server/wrangler.toml` — set **KV id**, **ALLOWED_ORIGIN**, **APP_PUBLIC_URL**  
- `npx wrangler deploy` from `server/`

## 3. CORS (required)

Respond to **`OPTIONS`** with:

- `Access-Control-Allow-Origin`: exact app origin (e.g. `https://abdulsalamokullo7-sketch.github.io`)
- `Access-Control-Allow-Methods`: `GET, POST, OPTIONS`
- `Access-Control-Allow-Headers`: `Content-Type`

Repeat **`Access-Control-Allow-Origin`** on **GET** and **POST** responses.

## 4. Request bodies

### `POST …/backup`

```json
{
  "email": "farmer@example.com",
  "backup": { },
  "client": "AgriSmart-Uganda",
  "ts": 1710000000000
}
```

Return **204** or **200** on success so the client updates “last backup” time.

### `POST …/recover-request`

```json
{ "email": "farmer@example.com" }
```

### `GET …/recover-complete?token=…`

Return **200** JSON:

```json
{ "backup": { "backupVersion": 1, "farms": [ … ], … } }
```

The inner `backup` object must match the **Download backup** file shape.

## 5. Security checklist

- **HTTPS only**
- **Rate limit** all routes
- **Encrypt** stored backups if policy requires
- Add **API key** or auth on `POST /backup` for production
- GitHub Pages is static only — API must be on another host (Worker, Vercel, etc.)

## 6. Test with curl

```bash
curl -i -X OPTIONS "https://YOUR-API/agri/backup" \
  -H "Origin: https://abdulsalamokullo7-sketch.github.io" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type"
```

```bash
curl -i -X GET "https://YOUR-API/agri/recover-complete?token=TEST" \
  -H "Origin: https://abdulsalamokullo7-sketch.github.io"
```
