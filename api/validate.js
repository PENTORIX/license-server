export default function handler(req, res) {
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ valid: false });
  }

  const { key } = req.body || {};

  const VALID_KEYS = [
    "NETFLIX-A1B2-1234",
    "NETFLIX-Z9X8-7777"
  ];

  if (!key) {
    return res.status(400).json({ valid: false });
  }

  if (VALID_KEYS.includes(key)) {
    return res.status(200).json({ valid: true, plan: "basic" });
  }

  return res.status(401).json({ valid: false });
}
