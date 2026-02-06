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
    // Debug: total active cookies
    const { count, error: countError } = await supabase
      .from('free_cookies')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    console.log('Total active free cookies:', count)

    if (countError) throw countError

    if (count === 0) {
      return res.status(404).json({ error: 'No active free cookies available' })
    }

    // Random pick ng 1 active cookie
    const { data, error } = await supabase
      .from('free_cookies')
      .select('cookie_string')
      .eq('is_active', true)
      .order('random()')
      .limit(1)
      .single()

    if (error || !data) {
      console.log('Free cookie query error:', error)
      return res.status(404).json({ error: 'No active free cookies' })
    }

    console.log('Selected free cookie:', data.cookie_string.substring(0, 50) + '...')

    return res.status(200).json({ cookieString: data.cookie_string })

  } catch (err) {
    console.error('Fetch free cookie error:', err.message)
    return res.status(500).json({ error: 'Server error: ' + err.message })
  }
}
