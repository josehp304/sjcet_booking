import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(`
      SELECT f.*, u.name as custodian_name, u.department as custodian_department
      FROM facilities f
      LEFT JOIN users u ON f.custodian_id = u.id
      ORDER BY f.name ASC
    `);
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

    const { name, capacity, description, features, custodian_id } = await request.json();

    const result = await pool.query(
      'INSERT INTO facilities (name, capacity, description, features, custodian_id) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, capacity, description, features ?? [], custodian_id ?? null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating facility:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
