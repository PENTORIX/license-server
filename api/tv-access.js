import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const body = req.body || {}

  // Log para makita mo sa Vercel logs kung natanggap ba
  console.log('TV ACCESS REQUEST RECEIVED:', body)

  const { tvCode, premiumKey, extensionId, tvHardwareId } = body

  if (!tvCode || tvCode.length !== 8 || !/^\d{8}$/.test(tvCode)) {
    return res.status(400).json({ error: 'Invalid TV code format. Must be exactly 8 digits.' })
  }

  if (!premiumKey || !tvHardwareId) {
    return res.status(400).json({ error: 'Missing premium key or TV hardware ID' })
  }

  // Supabase client
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase env vars')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const supabase = createClient(supabaseUrl, supabaseKey)

  try {
    // Check existing binding for this premium key
    const { data: existing, error: checkError } = await supabase
      .from('tv_hardware_bindings')
      .select('*')
      .eq('premium_key', premiumKey)
      .maybeSingle()

    if (checkError) throw checkError

    if (existing) {
      if (existing.tv_hardware_id === tvHardwareId) {
        return res.status(200).json({ success: true, message: 'TV hardware already linked' })
      } else {
        return res.status(403).json({ 
          error: 'This premium key is already linked to a different TV hardware. Cannot link another TV.' 
        })
      }
    }

    // Insert new binding
    const { error: insertError } = await supabase
      .from('tv_hardware_bindings')
      .insert({
        premium_key: premiumKey,
        extension_id: extensionId || 'unknown',
        tv_hardware_id: tvHardwareId,
        created_at: new Date().toISOString()
      })

    if (insertError) throw insertError

    return res.status(200).json({ success: true, message: 'TV hardware linked successfully' })

  } catch (err) {
    console.error('TV ACCESS ENDPOINT ERROR:', err.message)
    return res.status(500).json({ error: 'Server error occurred' })
  }
}
