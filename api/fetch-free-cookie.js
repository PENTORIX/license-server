import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  try {
    // Random select ng 1 cookie mula sa free_cookies table
    const { data, error } = await supabase
      .from('free_cookies')
      .select('cookie_string')  // kunin lang 'yung cookie string column
      .eq('is_active', true)    // optional: kung may active flag
      .order('random()')        // PostgreSQL random order
      .limit(1)
      .single()

    if (error || !data) {
      return res.status(404).json({ error: 'No free cookies available' })
    }

    return res.status(200).json({ cookieString: data.cookie_string })

  } catch (err) {
    console.error('Fetch free cookie error:', err)
    return res.status(500).json({ error: 'Server error' })
  }
}
