import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { deviceHardwareId } = req.body || {}

  if (!deviceHardwareId) {
    return res.status(400).json({ error: 'Device hardware ID required for limit tracking' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  try {
    // 1. Get or create limit record
    let { data: limitData, error: limitError } = await supabase
      .from('free_generate_limits')
      .select('generate_count, last_used')
      .eq('device_hardware_id', deviceHardwareId)
      .single()

    let count = 0;
    let lastUsed = new Date(0);

    if (limitError && limitError.code !== 'PGRST116') throw limitError

    if (limitData) {
      count = limitData.generate_count
      lastUsed = new Date(limitData.last_used)
    }

    // 2. Check cooldown
    const now = new Date()
    const hoursSince = (now - lastUsed) / (1000 * 60 * 60)

    if (count >= 5 && hoursSince < 24) {
      const remainingHours = Math.ceil(24 - hoursSince)
      return res.status(403).json({ 
        error: `Free limit reached for this device. Reset in ${remainingHours} hour(s).`,
        remainingHours
      })
    }

    // 3. Reset if cooldown done
    if (count >= 5) count = 0

    // 4. Get random cookie
    const { count: total } = await supabase
      .from('free_cookies')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (total === 0) return res.status(404).json({ error: 'No active free cookies available' })

    const offset = Math.floor(Math.random() * total)

    const { data: cookie, error: cookieError } = await supabase
      .from('free_cookies')
      .select('cookie_string')
      .eq('is_active', true)
      .range(offset, offset)
      .single()

    if (cookieError || !cookie) return res.status(404).json({ error: 'No active free cookies found' })

    // 5. Update limit
    if (limitData) {
      await supabase
        .from('free_generate_limits')
        .update({ generate_count: count + 1, last_used: now.toISOString() })
        .eq('device_hardware_id', deviceHardwareId)
    } else {
      await supabase
        .from('free_generate_limits')
        .insert({
          device_hardware_id: deviceHardwareId,
          generate_count: 1,
          last_used: now.toISOString()
        })
    }

    return res.status(200).json({ cookieString: cookie.cookie_string })

  } catch (err) {
    console.error('Fetch free error:', err.message)
    return res.status(500).json({ error: 'Server error' })
  }
}
