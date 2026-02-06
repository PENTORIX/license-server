import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { key } = req.body || {}

  if (!key) {
    return res.status(400).json({ error: 'Premium key required' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  try {
    // Validate key first (optional pero mas secure)
    const { data: keyData, error: keyError } = await supabase
      .from('premium_keys')
      .select('is_active')
      .eq('key', key)
      .single()

    if (keyError || !keyData || !keyData.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive premium key' })
    }

    // Random select ng 1 cookie mula sa premium_cookies table
    const { data, error } = await supabase
      .from('premium_cookies')
      .select('cookie_string')
      .eq('is_active', true)    // optional
      .order('random()')
      .limit(1)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'No premium cookies available' })
    }

    return res.status(200).json({ cookieString: data.cookie_string })

  } catch (err) {
    console.error('Fetch premium cookie error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
