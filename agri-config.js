/**
 * Optional: set your cloud backup API base URL here (no trailing slash).
 * Example: "https://agri-backup.your-subdomain.workers.dev/agri"
 *
 * Leave "" to disable cloud upload/recover (file backup still works).
 * You can also set AGRI_CLOUD_BACKUP_BASE_URL in app.js — agri-config.js wins if non-empty.
 */
window.AGRI_CONFIG = window.AGRI_CONFIG || {};
window.AGRI_CONFIG.cloudBackupBaseUrl = "";
