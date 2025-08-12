import { NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const sql = neon(process.env.DATABASE_URL!)
    
    // Test the connection by checking if our tables exist
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('task_groups', 'tasks', 'task_completions')
      ORDER BY table_name
    `
    
    return NextResponse.json({ 
      success: true, 
      message: 'Database connection successful',
      tables: result.map(row => row.table_name)
    })
  } catch (error) {
    console.error('Database connection failed:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Database connection failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      }, 
      { status: 500 }
    )
  }
}
