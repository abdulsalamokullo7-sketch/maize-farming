# AgriSmart Uganda — Maize farm PWA

Offline-friendly planting, finance, timeline, and backups in the browser.

## Cloud backup (optional)

1. **Configure the app:** edit **`agri-config.js`** and set `cloudBackupBaseUrl` to your API (see comments in file).
2. **Deploy the API:** see **`server/README.md`** (Cloudflare Worker + KV + optional Resend).
3. **Details:** **`docs/CLOUD_BACKUP_SERVER.md`**

## GitHub Actions

Optional Worker deploy: **Actions → Deploy Cloudflare backup worker** (requires `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` repository secrets).
