import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ valid: false });

  const { key } = req.body || {};

  if (!key) {
    return res.status(400).json({ valid: false });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  try {
    const { data, error } = await supabase
      .from('premium_keys')
      .select('is_active')
      .eq('key', key)
      .single()

    if (error || !data || !data.is_active) {
      return res.status(401).json({ valid: false });
    }

    return res.status(200).json({ valid: true, plan: "basic" });

  } catch (err) {
    console.error('Validate error:', err);
    return res.status(500).json({ valid: false });
  }
}
