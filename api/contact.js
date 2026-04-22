export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const data = req.body

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

      if (multiSelectFields.includes(key)) {
        const value = data[key]
        fields[fieldMap[key]] = Array.isArray(value) ? value : [value]
      } else {
        fields[fieldMap[key]] = data[key]
      }
    }

    const airtableRes = await fetch(
      `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Leads`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      }
    )

    if (!airtableRes.ok) {
      const errorText = await airtableRes.text()
      console.error(errorText)
      throw new Error('Airtable error')
    }

    return res.status(200).json({ success: true })
  } catch (err) {
    console.error(err)
    return res.status(500).json({ success: false })
  }
}
