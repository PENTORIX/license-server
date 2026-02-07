import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { deviceHardwareId } = req.body || {}

  if (!deviceHardwareId) {
    return res.status(400).json({ error: 'Device hardware ID required' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  try {
    // 1. Hanapin record ng device
    let { data: limitData, error } = await supabase
      .from('free_generate_limits')
      .select('generate_count, last_used')
      .eq('device_hardware_id', deviceHardwareId)
      .single()

    let count = 0;
    let lastUsed = new Date(0); // far past if no record

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
      throw error
    }

    if (limitData) {
      count = limitData.generate_count
      lastUsed = new Date(limitData.last_used)
    }

    // 2. Check cooldown (24 hours)
    const now = new Date()
    const hoursSinceLastUsed = (now - lastUsed) / (1000 * 60 * 60)

    if (count >= 5 && hoursSinceLastUsed < 24) {
      const remaining = Math.ceil(24 - hoursSinceLastUsed)
      return res.status(403).json({ 
        error: `Free limit reached for this device. Wait ${remaining} hour(s) to reset.` 
      })
    }

    // 3. Reset count if cooldown done
    if (count >= 5) {
      count = 0
    }

    // 4. Fetch random active cookie
    const { data: cookieData, error: cookieError } = await supabase
      .from('free_cookies')
      .select('cookie_string')
      .eq('is_active', true)
      .order('random()')
      .limit(1)
      .single()

    if (cookieError || !cookieData) {
      return res.status(404).json({ error: 'No active free cookies available' })
    }

    // 5. Update or insert limit record
    if (limitData) {
      await supabase
        .from('free_generate_limits')
        .update({ 
          generate_count: count + 1, 
          last_used: now.toISOString() 
        })
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

    return res.status(200).json({ cookieString: cookieData.cookie_string })

  } catch (err) {
    console.error('Fetch free cookie error:', err.message)
    return res.status(500).json({ error: 'Server error' })
  }
}
