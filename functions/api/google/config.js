function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" },
  });
}

export async function onRequestGet({ env }) {
  const configured = Boolean(
    env.GOOGLE_CLIENT_ID &&
    env.GOOGLE_API_KEY &&
    /^[0-9]+$/.test(env.GOOGLE_PROJECT_NUMBER || "") &&
    env.GOOGLE_CLIENT_SECRET
  );

  if (!configured) {
    return json({ configured: false });
  }

  // These are public browser identifiers, not credentials. Restrict the API key
  // to the site origin and Google Drive/Picker APIs in Google Cloud Console.
  return json({
    configured: true,
    clientId: env.GOOGLE_CLIENT_ID,
    apiKey: env.GOOGLE_API_KEY,
    projectNumber: env.GOOGLE_PROJECT_NUMBER,
  });
}
