export default function handler(req, res) {
  const { token } = req.query;

  if (!token) {
    return res.status(400).send("No token provided.");
  }

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
        <p>Token received: <b>${token}</b></p>
        <p>This confirms:</p>
        <ul>
          <li>Generate → request-access works</li>
          <li>Redirect works</li>
          <li>Server page loads</li>
        </ul>
      </body>
    </html>
  `);
}
