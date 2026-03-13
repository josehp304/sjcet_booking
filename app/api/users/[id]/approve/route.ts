import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PATCH(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getSession();
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(
      `UPDATE users
       SET is_active = TRUE, registration_status = 'APPROVED'
       WHERE id = $1 AND registration_status = 'PENDING'
       RETURNING id, name, email, role, department, phone_number, position, is_active, registration_status`,
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'User not found or already processed.' }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
