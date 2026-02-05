import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  try {
    const { data, error } = await supabase
      .from('free_cookies')
      .select('id, cookie_string, refresh_count, max_refresh')
      .eq('is_active', true)
      .order('last_refreshed', { ascending: false, nullsFirst: true })
      .limit(1)

    if (error) throw error

    if (!data.length) return res.status(404).json({ error: 'No free cookies available' })

    const item = data[0]

    if (item.refresh_count >= item.max_refresh) {
      return res.status(403).json({ error: Free limit reached (\( {item.refresh_count}/ \){item.max_refresh}) })
    }

    await supabase
      .from('free_cookies')
      .update({
        refresh_count: item.refresh_count + 1,
        last_refreshed: new Date().toISOString()
      })
      .eq('id', item.id)

    res.status(200).json({ cookieString: item.cookie_string })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Server error' })
  }
}