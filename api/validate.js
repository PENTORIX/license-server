import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { key, deviceHardwareId } = req.body || {}

  if (!key) {
    return res.status(400).json({ error: 'Premium key required' })
  }

  // Optional: kung gusto mo i-require talaga 'yung device ID
  if (!deviceHardwareId) {
    return res.status(400).json({ error: 'Device hardware ID required' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  try {
    // Validate key
    const { data: keyData, error: keyError } = await supabase
      .from('premium_keys')
      .select('is_active')
      .eq('key', key)
      .single()

    if (keyError || !keyData || !keyData.is_active) {
      return res.status(401).json({ error: 'Invalid or inactive premium key' })
    }

    // Save device binding (para ma-check next time sa ibang device)
    await supabase
      .from('premium_key_bindings')
      .upsert({
        key,
        device_hardware_id: deviceHardwareId,
        last_used: new Date().toISOString()
      })

    return res.status(200).json({ valid: true })

  } catch (err) {
    console.error('Validate error:', err.message)
    return res.status(500).json({ error: 'Server error' })
  }
}
