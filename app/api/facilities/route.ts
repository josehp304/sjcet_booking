import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query('SELECT * FROM facilities ORDER BY name ASC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching facilities:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, capacity, description, features } = await request.json();

    const result = await pool.query(
      'INSERT INTO facilities (name, capacity, description, features) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, capacity, description, features ?? []]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating facility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
