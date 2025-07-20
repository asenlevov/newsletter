import { NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

const historyFilePath = path.join(process.cwd(), 'history.json')

async function getHistory() {
  try {
    await fs.access(historyFilePath)
    const data = await fs.readFile(historyFilePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    return []
  }
}

export async function GET() {
  const history = await getHistory()
  return NextResponse.json(history)
}

export async function POST(request: Request) {
  const newEntry = await request.json()
  const history = await getHistory()

  // Add a timestamp and a short ID to the new entry
  newEntry.id = Date.now().toString(36) + Math.random().toString(36).substr(2)
  newEntry.timestamp = new Date().toISOString()

  history.unshift(newEntry) // Add to the beginning

  // Keep the history to a reasonable size
  const MAX_HISTORY_SIZE = 50
  if (history.length > MAX_HISTORY_SIZE) {
    history.pop()
  }

  await fs.writeFile(historyFilePath, JSON.stringify(history, null, 2))
  return NextResponse.json({ success: true, entry: newEntry })
} 