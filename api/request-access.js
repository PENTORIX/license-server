export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false });
  }

  const { license } = req.body || {};
  if (!license) {
    return res.status(400).json({ ok: false, reason: "no license" });
  }

  const VALID_KEYS = [
    "NETFLIX-A1B2-1234",
    "NETFLIX-Z9X8-7777"
  ];

  if (!VALID_KEYS.includes(license)) {
    return res.status(401).json({ ok: false, reason: "invalid license" });
  }

  const token = Math.random().toString(36).slice(2);
  const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

  global.__TOKENS__ = global.__TOKENS__ || {};
  global.__TOKENS__[token] = { expiresAt };

  return res.json({
    ok: true,
    access_url: `/access/${token}`,
    expires_in: 300
  });
}
