import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ valid: false });

  const { key, deviceHardwareId } = req.body || {};

  if (!key) {
    return res.status(400).json({ valid: false, message: 'No key provided' });
  }

  if (!deviceHardwareId) {
    return res.status(400).json({ valid: false, message: 'Device hardware ID missing' });
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  try {
    // 1. Hanapin kung may existing binding na sa key na 'to
    const { data: existing, error: checkError } = await supabase
      .from('premium_key_bindings')  // bagong table para sa bindings
      .select('*')
      .eq('premium_key', key)
      .maybeSingle()

    if (checkError) throw checkError

    if (existing) {
      // May binding na — check kung same device ba
      if (existing.device_hardware_id === deviceHardwareId) {
        return res.status(200).json({ valid: true, message: 'Key already unlocked on this device' })
      } else {
        return res.status(403).json({ 
          valid: false,
          message: 'This premium key is already locked to a different device. Cannot unlock on another device.'
        })
      }
    }

    // 2. Walang binding pa — check muna kung valid key ba sa premium_keys table
    const { data: keyData, error: keyError } = await supabase
      .from('premium_keys')
      .select('is_active')
      .eq('key', key)
      .single()

    if (keyError || !keyData || !keyData.is_active) {
      return res.status(401).json({ valid: false, message: 'Invalid or inactive premium key' })
    }

    // 3. Valid key at walang binding pa → mag-bind sa device na 'to
    const { error: insertError } = await supabase
      .from('premium_key_bindings')
      .insert({
        premium_key: key,
        device_hardware_id: deviceHardwareId,
        extension_id: req.headers['x-extension-id'] || 'unknown',
        created_at: new Date().toISOString()
      })

    if (insertError) throw insertError

    return res.status(200).json({ valid: true, message: 'Premium key unlocked on this device' })

  } catch (err) {
    console.error('Validate error:', err)
    return res.status(500).json({ valid: false, message: 'Server error' })
  }
}
