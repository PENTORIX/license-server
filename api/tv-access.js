import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { tvCode, premiumKey, extensionId, tvHardwareId } = req.body

  if (!tvCode || tvCode.length !== 8 || !/^\d{8}$/.test(tvCode)) {
    return res.status(400).json({ error: 'Invalid TV code format' })
  }

  if (!premiumKey || !tvHardwareId) {
    return res.status(400).json({ error: 'Missing premium key or TV hardware ID' })
  }

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_ANON_KEY
  )

  try {
    // 1. Check kung may existing binding na sa premium_key (kahit ibang extension)
    const { data: existing, error: checkError } = await supabase
      .from('tv_hardware_bindings')
      .select('*')
      .eq('premium_key', premiumKey)
      .maybeSingle()

    if (checkError) throw checkError

    if (existing) {
      // May binding na — check kung same hardware ba
      if (existing.tv_hardware_id === tvHardwareId) {
        return res.status(200).json({ success: true, message: 'TV hardware already linked' })
      } else {
        return res.status(403).json({ 
          error: 'This premium key is already linked to a different TV hardware. Cannot link another TV.' 
        })
      }
    }

    // 2. Walang binding pa — mag-insert ng bago
    const { error: insertError } = await supabase
      .from('tv_hardware_bindings')
      .insert({
        premium_key: premiumKey,
        extension_id: extensionId || 'unknown',  // record lang, hindi ginagamit sa check
        tv_hardware_id: tvHardwareId,
        created_at: new Date().toISOString()
      })

    if (insertError) throw insertError

    return res.status(200).json({ success: true, message: 'TV hardware linked successfully' })

  } catch (err) {
    console.error(err)
    return res.status(500).json({ error: 'Server error' })
  }
}
