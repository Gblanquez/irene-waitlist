export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const data = req.body
    const tableId = 'tblW4wnuXLbNlTxv4'
    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${tableId}`

    const fieldMap = {
      name: 'name',
      role: 'role',
      email: 'email',
      budget: 'budget',
      outcome: 'outcome',
      frustration: 'frustration',
      information: 'information'
    }

    const multiSelectFields = ['outcome', 'frustration']
    const fields = {}

    for (const key in data) {
      if (!fieldMap[key]) continue

      const value = data[key]
      if (value === '' || value == null) continue

      if (multiSelectFields.includes(key)) {
        fields[fieldMap[key]] = Array.isArray(value) ? value.filter(Boolean) : [value]
      } else {
        fields[fieldMap[key]] = value
      }
    }

    const airtableRes = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ fields })
    })

    if (!airtableRes.ok) {
      const errorText = await airtableRes.text()
      console.error(errorText)
      return res.status(500).json({
        success: false,
        message: errorText,
        airtableUrl,
        tableId
      })
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false, message: err.message })
  }
}
