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

  // DELETE token (one-time use)
  await fetch(
    `${process.env.KV_REST_API_URL}/del/access:${token}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`
      }
    }
  );

  const data = JSON.parse(j.result);

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <h2>✅ Access Granted</h2>
    <p>License: ${data.license}</p>
  `);
}
