export default async function handler(req, res) {
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
  const ttl = 300; // 5 minutes

  // SAVE TOKEN TO UPSTASH (REAL STORAGE)
  await fetch(`${process.env.KV_REST_API_URL}/set/access:${token}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.KV_REST_API_TOKEN}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      value: JSON.stringify({ license }),
      ex: ttl
    })
  });

  return res.json({
    ok: true,
    access_url: `/api/access/${token}`,
    expires_in: ttl
  });
}
