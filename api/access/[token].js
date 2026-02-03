export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).send("No token");

  const r = await fetch(
    `${process.env.KV_REST_API_URL}/get/access:${token}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
      }
    }
  );

  const j = await r.json();

  if (!j.result) {
    return res.status(404).send("Invalid or expired access.");
  }

  // 🔥 FIX: DOUBLE PARSE
  let stored;
  try {
    stored = JSON.parse(j.result);          // { value: "...", ex: 300 }
    stored = JSON.parse(stored.value);     // { license: "...", createdAt: ... }
  } catch {
    return res.status(500).send("Failed to parse stored token.");
  }

  // one-time use
  await fetch(
    `${process.env.KV_REST_API_URL}/del/access:${token}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
      }
    }
  );

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <h2>✅ Access Granted</h2>
    <p>License: <b>${stored.license}</b></p>
  `);
}
