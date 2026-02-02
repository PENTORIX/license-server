import { kv } from "@vercel/kv";

export default async function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("No token provided.");
  }

  // Get token from Redis
  const data = await kv.get(`access:${token}`);

  if (!data) {
    return res.status(404).send("Invalid or expired access.");
  }

  // One-time use
  await kv.del(`access:${token}`);

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Access Granted</title>
        <style>
          body { font-family: sans-serif; padding: 24px; }
          .ok { color: green; font-weight: bold; }
        </style>
      </head>
      <body>
        <h2 class="ok">✅ Access Granted</h2>
        <p>License: <b>${data.license}</b></p>
        <p>This access is:</p>
        <ul>
          <li>Server-controlled</li>
          <li>Token-based</li>
          <li>One-time use</li>
          <li>Auto-expiring (Redis TTL)</li>
        </ul>
      </body>
    </html>
  `);
}
