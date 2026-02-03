export default async function handler(req, res) {
  const { token } = req.query;
  if (!token) return res.status(400).send("No token");

  // READ token from Upstash
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

  // 🔧 FIX: parse the stored JSON STRING properly
  let data;
  try {
    data = JSON.parse(j.result);
  } catch (e) {
    return res.status(500).send("Corrupted token data.");
  }

  // ONE-TIME USE: delete token
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
    <p>License: <b>${data.license}</b></p>
  `);
}
