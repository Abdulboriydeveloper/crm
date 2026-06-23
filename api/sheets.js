// Vercel Serverless Function — Google Apps Script proxy
// CORS va redirect muammolarini server tomonida hal qiladi

const APPS_SCRIPT_URL = process.env.APPS_SCRIPT_URL

export default async function handler(req, res) {
  // CORS headerlar
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (!APPS_SCRIPT_URL) {
    return res.status(500).json({ status: 'error', message: 'APPS_SCRIPT_URL sozlanmagan' })
  }

  try {
    const { action, phone, stage, name, date } = req.method === 'POST'
      ? req.body
      : req.query

    // Apps Script ga server tomonidan so'rov — redirect muammosi yo'q
    const params = new URLSearchParams({ action: action || 'list', t: Date.now() })
    if (phone) params.set('phone', phone)
    if (stage) params.set('stage', stage)
    if (name) params.set('name', name)
    if (date) params.set('date', date)

    const gsRes = await fetch(`${APPS_SCRIPT_URL}?${params}`, {
      method: 'GET',
      redirect: 'follow', // Server da redirect ishlaydi (CORS yo'q)
      headers: { 'User-Agent': 'Vercel/NargizaCRM' }
    })

    const text = await gsRes.text()

    // JSON parse
    try {
      const data = JSON.parse(text)
      return res.status(200).json(data)
    } catch {
      // HTML keldi — Apps Script muammosi
      console.error('Apps Script HTML response:', text.slice(0, 200))
      return res.status(502).json({
        status: 'error',
        message: 'Apps Script HTML qaytardi. Deploy sozlamalarini tekshiring: Execute as: Me, Access: Anyone'
      })
    }
  } catch (err) {
    return res.status(500).json({ status: 'error', message: err.message })
  }
}
