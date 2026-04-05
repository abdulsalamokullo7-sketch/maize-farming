/**
 * AgriSmart Uganda — Cloudflare Worker (backup + email recovery).
 *
 * Deploy: cd server && npm install && npx wrangler deploy
 *
 * Secrets:  npx wrangler secret put RESEND_API_KEY
 * Optional: npx wrangler secret put FROM_EMAIL   (e.g. AgriSmart <backup@yourdomain.com>)
 *
 * KV: create namespace, put id in wrangler.toml under [[kv_namespaces]]
 */

function getAllowedOrigin(env) {
  return (env && env.ALLOWED_ORIGIN) || "https://abdulsalamokullo7-sketch.github.io";
}

function getAppPublicUrl(env) {
  var u = (env && env.APP_PUBLIC_URL) || "";
  return String(u).replace(/\/$/, "");
}

function corsHeaders(env) {
  return {
    "Access-Control-Allow-Origin": getAllowedOrigin(env),
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400"
  };
}

function jsonResponse(env, status, obj) {
  return new Response(JSON.stringify(obj), {
    status: status,
    headers: Object.assign({ "Content-Type": "application/json" }, corsHeaders(env))
  });
}

function normalizeEmail(e) {
  return String(e || "")
    .trim()
    .toLowerCase();
}

export default {
  async fetch(request, env) {
    var url = new URL(request.url);
    var path = url.pathname.replace(/\/$/, "") || "/";

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    var isBackup = path.endsWith("/backup");
    var isRecoverReq = path.endsWith("/recover-request");
    var isRecoverGet = path.endsWith("/recover-complete");

    if (isRecoverGet && request.method === "GET") {
      var token = url.searchParams.get("token") || url.searchParams.get("recoverToken");
      if (!token) {
        return jsonResponse(env, 400, { error: "missing_token" });
      }
      var metaRaw = await env.BACKUP_KV.get("recover:" + token);
      if (!metaRaw) {
        return jsonResponse(env, 404, { error: "invalid_or_expired_token" });
      }
      await env.BACKUP_KV.delete("recover:" + token);
      var meta;
      try {
        meta = JSON.parse(metaRaw);
      } catch (e) {
        return jsonResponse(env, 500, { error: "bad_meta" });
      }
      var email = normalizeEmail(meta.email);
      var fullRaw = await env.BACKUP_KV.get("backup:" + email);
      if (!fullRaw) {
        return jsonResponse(env, 404, { error: "no_backup" });
      }
      var full;
      try {
        full = JSON.parse(fullRaw);
      } catch (e2) {
        return jsonResponse(env, 500, { error: "bad_backup" });
      }
      if (!full.backup || typeof full.backup !== "object") {
        return jsonResponse(env, 500, { error: "bad_shape" });
      }
      return new Response(JSON.stringify({ backup: full.backup }), {
        status: 200,
        headers: Object.assign({ "Content-Type": "application/json" }, corsHeaders(env))
      });
    }

    if (!isBackup && !isRecoverReq) {
      return jsonResponse(env, 404, { error: "not_found" });
    }

    if (request.method !== "POST") {
      return jsonResponse(env, 405, { error: "method_not_allowed" });
    }

    var body;
    try {
      body = await request.json();
    } catch (e) {
      return jsonResponse(env, 400, { error: "invalid_json" });
    }

    if (isBackup) {
      var em = normalizeEmail(body.email);
      if (!em || !em.includes("@")) {
        return jsonResponse(env, 400, { error: "invalid_email" });
      }
      if (!body.backup || typeof body.backup !== "object") {
        return jsonResponse(env, 400, { error: "invalid_backup" });
      }
      var payload = JSON.stringify({
        email: em,
        backup: body.backup,
        client: body.client || "",
        ts: body.ts || Date.now(),
        storedAt: Date.now()
      });
      if (payload.length > 20 * 1024 * 1024) {
        return jsonResponse(env, 413, { error: "payload_too_large" });
      }
      await env.BACKUP_KV.put("backup:" + em, payload, {
        expirationTtl: 60 * 60 * 24 * 365
      });
      return new Response(null, { status: 204, headers: corsHeaders(env) });
    }

    if (isRecoverReq) {
      var em2 = normalizeEmail(body.email);
      if (!em2 || !em2.includes("@")) {
        return jsonResponse(env, 400, { error: "invalid_email" });
      }
      var existing = await env.BACKUP_KV.get("backup:" + em2);
      var tokenNew = crypto.randomUUID() + "-" + Date.now().toString(36);
      await env.BACKUP_KV.put(
        "recover:" + tokenNew,
        JSON.stringify({ email: em2, createdAt: Date.now() }),
        { expirationTtl: 60 * 30 }
      );

      var appUrl = getAppPublicUrl(env);
      var recoveryHref = appUrl
        ? appUrl + (appUrl.indexOf("?") >= 0 ? "&" : "?") + "recoverToken=" + encodeURIComponent(tokenNew)
        : url.origin + path.replace(/\/recover-request$/, "/recover-complete") + "?token=" + encodeURIComponent(tokenNew);

      if (env.RESEND_API_KEY && existing) {
        var fromAddr = env.FROM_EMAIL || "AgriSmart <onboarding@resend.dev>";
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: "Bearer " + env.RESEND_API_KEY,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            from: fromAddr,
            to: [em2],
            subject: "AgriSmart Uganda — recover your farm backup",
            html:
              "<p>Open this link within 30 minutes on the device where you use AgriSmart. You will be asked for your PIN before data is replaced:</p>" +
              "<p><a href=\"" +
              recoveryHref +
              "\">" +
              recoveryHref +
              "</a></p>"
          })
        }).catch(function () {});
      }

      return jsonResponse(env, 200, {
        ok: true,
        message: existing
          ? "If this email is registered, check your inbox."
          : "Request received."
      });
    }

    return jsonResponse(env, 404, { error: "not_found" });
  }
};
