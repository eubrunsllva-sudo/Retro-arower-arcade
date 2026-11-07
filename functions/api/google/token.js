function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

function allowedHost(hostname) {
  return hostname === "retroarcade.xyz.br" ||
    hostname === "retro-arower-arcade.pages.dev" ||
    hostname.endsWith(".retro-arower-arcade.pages.dev");
}

export async function onRequestPost({ request, env }) {
  const requestUrl = new URL(request.url);
  const origin = request.headers.get("Origin") || "";
  if (!allowedHost(requestUrl.hostname) || origin !== requestUrl.origin) {
    return json({ error: "origin_not_allowed" }, 403);
  }

  // Google recommends this custom header for the GIS popup code flow as a
  // CSRF signal. The browser call is same-origin and never sends a client secret.
  if (request.headers.get("X-Requested-With") !== "XmlHttpRequest") {
    return json({ error: "invalid_request" }, 400);
  }
  if (!(request.headers.get("Content-Type") || "").toLowerCase().startsWith("application/json")) {
    return json({ error: "invalid_content_type" }, 415);
  }
  if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
    return json({ error: "google_oauth_not_configured" }, 503);
  }

  let body;
  try {
    const raw = await request.text();
    if (raw.length > 8192) return json({ error: "request_too_large" }, 413);
    body = JSON.parse(raw);
  } catch {
    return json({ error: "invalid_json" }, 400);
  }
  if (typeof body.code !== "string" || body.code.length < 10 || body.code.length > 4096) {
    return json({ error: "invalid_authorization_code" }, 400);
  }

  const form = new URLSearchParams({
    code: body.code,
    client_id: env.GOOGLE_CLIENT_ID,
    client_secret: env.GOOGLE_CLIENT_SECRET,
    redirect_uri: requestUrl.origin,
    grant_type: "authorization_code",
  });

  let googleResponse;
  try {
    googleResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
    });
  } catch {
    return json({ error: "google_unreachable" }, 502);
  }

  let token;
  try { token = await googleResponse.json(); }
  catch { return json({ error: "invalid_google_response" }, 502); }
  if (!googleResponse.ok || !token.access_token) {
    return json({ error: "google_authorization_failed", description: token.error_description || token.error || "Google recusou a autorização." }, 400);
  }

  // Keep access tokens transient: return only what this browser session needs.
  // Do not persist tokens or return refresh tokens from this endpoint.
  return json({
    access_token: token.access_token,
    expires_in: Number(token.expires_in) || 3600,
    scope: token.scope || "",
    token_type: token.token_type || "Bearer",
  });
}
