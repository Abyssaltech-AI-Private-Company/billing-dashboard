const express = require('express')
const axios = require('axios')
const dotenv = require('dotenv')
const cors = require('cors')
dotenv.config()

const app = express()
app.use(cors())

const PORT = process.env.PORT || 3000

const baseId = process.env.AIRTABLE_BASE_ID
const apiKey = process.env.AIRTABLE_API_KEY
const TABLE_CUSTOMERS = process.env.AIRTABLE_TABLE_CUSTOMERS
const TABLE_SESSIONS = process.env.AIRTABLE_TABLE_SESSIONS
const TABLE_AGENT_LOGS = process.env.AIRTABLE_TABLE_AGENT_LOGS

const AXIOS = axios.create({
    baseURL: `https://api.airtable.com/v0/${encodeURIComponent(baseId)}/`,
    headers: {
        Authorization: `Bearer ${apiKey}`,
    },
})

async function fetchAll(table, params = {}) {
    const records = []
    let offset
    do {
        const resp = await AXIOS.get(encodeURIComponent(table), {
            params: offset ? { ...params, offset } : params,
        })
        records.push(...resp.data.records)
        offset = resp.data.offset
    } while (offset)
    return records
}

// Utility: robust money parser
function parseMoney(v) {
    if (typeof v === 'number') return v
    const s = String(v ?? '').replace(/\$/g, '').replace(/,/g, '').trim()
    const n = parseFloat(s)
    return Number.isFinite(n) ? n : 0
}

// Utility: robust seconds->minutes
const toMinutes = (sec) => (Number.isFinite(sec) ? sec / 60 : 0)

// --------- API ---------

// 1) List customers (id + name) for dropdown
app.get('/api/customers', async (req, res) => {
    try {
        const customers = await fetchAll(TABLE_CUSTOMERS)
        const out = customers.map((r) => ({
            id: r.id,
            name: r.fields?.Name ?? 'Unknown',
            email: r.fields?.Email ?? '',
            trunkId: r.fields?.['Trunk ID'] ?? '',
        }))
        // Sort by name asc
        out.sort((a, b) => a.name.localeCompare(b.name, 'en'))
        res.json(out)
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Failed to fetch customers' })
    }
})

// 2) Sessions, optionally filtered by customerId or customerName
//    Returns both sessions[] and summary{}
app.get('/api/sessions', async (req, res) => {
    try {
        const { customerId, customerName } = req.query

        // fetch customers & build maps
        const customers = await fetchAll(TABLE_CUSTOMERS)
        const idToName = new Map(customers.map((r) => [r.id, r.fields?.Name ?? 'Unknown']))
        const nameToId = new Map(customers.map((r) => [(r.fields?.Name ?? 'Unknown'), r.id]))

        // fetch sessions
        const sessions = await fetchAll(TABLE_SESSIONS)

        // Normalize + optional filter
        const rows = []
        for (const r of sessions) {
            const f = r.fields || {}

            // Airtable linked field "Customer" could be array of recordIds or a string (depending on view/config)
            let custId = ''
            let custName = ''
            const rawCustomer = f['Customer']
            if (Array.isArray(rawCustomer) && rawCustomer.length) {
                custId = rawCustomer[0]
                custName = idToName.get(custId) || 'Unknown'
            } else if (typeof rawCustomer === 'string') {
                custName = rawCustomer
                custId = nameToId.get(custName) || ''
            }

            // Filter logic
            if (customerId && custId !== customerId) continue
            if (customerName && custName !== customerName) continue

            const durationSec = Number(f['Duration (s)']) || Number(f['Calculated Duration (s)']) || 0
            const totalCost = parseMoney(f['Total Cost (USD)'])
            const minutes = toMinutes(durationSec)

            rows.push({
                id: r.id,
                sessionId: f['Session ID'] || '',
                customerId: custId,
                customerName: custName || 'Unknown',
                startTime: f['Start Time'] || '',
                endTime: f['End Time'] || '',
                durationSec,
                minutes,
                totalCost,
                avgCostPerMin: minutes > 0 ? totalCost / minutes : 0,
                // Optional extra Airtable fields you have:
                totalAgentLogCost: parseMoney(f['Total Agent Log Cost (USD)']),
                avgTokensPerLog: Number(f['Average Tokens per Log']) || 0,
                summary: f['Session Summary'] || '',
                sentiment: f['Customer Feedback Sentiment'] || '',
            })
        }

        // Compute summary
        const totalSessions = rows.length
        const totalMinutes = rows.reduce((acc, r) => acc + r.minutes, 0)
        const totalCost = rows.reduce((acc, r) => acc + r.totalCost, 0)
        const avgCostPerMin = totalMinutes > 0 ? totalCost / totalMinutes : 0

        res.json({
            sessions: rows.sort((a, b) => (a.startTime || '').localeCompare(b.startTime || '')),
            summary: {
                totalSessions,
                totalMinutes,
                totalCost,
                avgCostPerMin,
            },
        })
    } catch (e) {
        console.error(e)
        res.status(500).json({ error: 'Failed to fetch sessions' })
    }
})

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
})
