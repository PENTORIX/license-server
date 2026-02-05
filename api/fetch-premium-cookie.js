import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*') // Allow CORS from extension origin
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  // Handle preflight OPTIONS request (important for CORS)
  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  try {
    const { data, error } = await supabase
      .from('premium_cookies')
      .select('cookie_string')
      .eq('is_active', true)
      .limit(1)

    if (error) throw error

    if (!data.length) {
      return res.status(404).json({ error: 'No premium cookies available' })
    }

    res.status(200).json({ cookieString: data[0].cookie_string })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}
