export default function handler(req, res) {
  const { token } = req.query;

  const store = global.__TOKENS__ || {};
  const record = store[token];

  if (!record) {
    return res.status(404).send("Invalid or expired access.");
  }

  if (Date.now() > record.expiresAt) {
    delete store[token];
    return res.status(410).send("Access expired.");
  }

  delete store[token];

  res.setHeader("Content-Type", "text/html");
  res.send(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8"/>
        <title>Access Granted</title>
      </head>
      <body style="font-family:sans-serif;padding:24px">
        <h2>✅ Access Granted</h2>
        <p>This page is served by the server.</p>
        <p>No cookies. No login. Token-based access.</p>
      </body>
    </html>
  `);
}
