const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
const cors = require('cors')

dotenv.config()

const app = express()
app.use(cors())

const PORT = process.env.PORT || 3000

const AIRTABLE_URL = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/${process.env.AIRTABLE_TABLE}`

app.get('/api/billing', async (req, res) => {
    try {
        const headers = {
            Authorization: `Bearer ${process.env.AIRTABLE_API_KEY}`,
        }

        let records = []
        let offset = null

        do {
            const response = await axios.get(AIRTABLE_URL, {
                headers,
                params: offset ? { offset } : {},
            })
            records.push(...response.data.records)
            offset = response.data.offset
        } while (offset)

        // Υπολογισμός billing per user
        const users = {}

        records.forEach((rec) => {
            const { fields } = rec
            const user = fields['Session ID'] || 'Unknown'
            const duration = parseFloat(fields['Duration (s)']) || 0
            let rawCost = fields['Total Cost (USD)']
            if (typeof rawCost === 'number') {
                rawCost = rawCost.toString()
            } else if (typeof rawCost !== 'string') {
                rawCost = ''
            }
            const cost = parseFloat(rawCost.replace('$', '')) || 0


            if (!users[user]) {
                users[user] = {
                    name: user,
                    sessions: 0,
                    minutes: 0,
                    total: 0,
                }
            }

            users[user].sessions += 1
            users[user].minutes += duration / 60
            users[user].total += cost
        })

        res.json(Object.values(users))
    } catch (err) {
        console.error(err)
        res.status(500).json({ error: 'Failed to fetch Airtable data' })
    }
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
