# AgriSmart cloud backup API (Cloudflare Worker)

This folder deploys a small HTTPS API used by the PWA when `agri-config.js` has `cloudBackupBaseUrl` set.

## One-time setup

1. **Cloudflare account** — [dash.cloudflare.com](https://dash.cloudflare.com)
2. **KV namespace** — Workers → KV → Create namespace → copy the **ID**
3. Open `wrangler.toml` and paste the ID into `REPLACE_WITH_YOUR_KV_NAMESPACE_ID`
4. Edit **`ALLOWED_ORIGIN`** and **`APP_PUBLIC_URL`** to match your GitHub Pages URL (or custom domain)

## Install & deploy

```bash
cd server
npm install
npx wrangler login
npx wrangler deploy
```

After deploy, Wrangler prints your worker URL, e.g. `https://agri-smart-uganda-backup.<you>.workers.dev`

## Wire the PWA

In the repo root **`agri-config.js`** set (no trailing slash):

```javascript
window.AGRI_CONFIG.cloudBackupBaseUrl = "https://agri-smart-uganda-backup.<you>.workers.dev/agri";
```

You must route the worker so paths are under `/agri` **or** change the worker paths / config to match.  
**Default:** the worker expects URLs like:

- `https://<worker-host>/agri/backup`
- `https://<worker-host>/agri/recover-request`
- `https://<worker-host>/agri/recover-complete?token=...`

On `workers.dev`, the pathname is whatever you request — use:

```text
https://YOUR-SUBDOMAIN.workers.dev/agri/backup
```

So `cloudBackupBaseUrl` = `https://YOUR-SUBDOMAIN.workers.dev/agri`

## Email recovery (optional)

1. Sign up at [resend.com](https://resend.com), verify a sending domain (or use their test sender for dev).
2. Run:

```bash
npx wrangler secret put RESEND_API_KEY
npx wrangler secret put FROM_EMAIL
```

`FROM_EMAIL` example: `AgriSmart <backup@yourdomain.com>`

## GitHub Actions (optional)

Repo includes `.github/workflows/deploy-worker.yml`. Add repository secrets:

- `CLOUDFLARE_API_TOKEN` — Workers edit permission
- `CLOUDFLARE_ACCOUNT_ID` — from Cloudflare dashboard

Then run the workflow manually (**Actions → Deploy Cloudflare backup worker → Run workflow**).

## Security

- Add rate limiting (Cloudflare rules / Worker counters) before production scale.
- Consider an API key header checked in the Worker for `POST /backup`.
- Encrypt sensitive payloads at rest if required by policy.

See also: `docs/CLOUD_BACKUP_SERVER.md` in the repo root.
