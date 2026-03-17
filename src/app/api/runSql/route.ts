// src/app/api/runSql/route.ts
import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET() {
    let errMessage = ""
    try {
        const client = new Client({
            connectionString: process.env.DATABASE_URL
        })
        await client.connect()
        await client.query(`ALTER TABLE planner_settings ADD COLUMN IF NOT EXISTS variety_exempt_words TEXT[] DEFAULT '{}'::TEXT[];`)
        await client.end()
        return NextResponse.json({ success: true, usingURL: process.env.DATABASE_URL })
    } catch (e: any) {
        errMessage = e.message
        return NextResponse.json({ error: errMessage, usingURL: process.env.DATABASE_URL }, { status: 500 })
    }
}
