import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

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

    const user = result.rows[0];
    
    // Send email notification to user
    try {
      if (user.email) {
        await sendEmail({
          to: user.email,
          subject: 'Account Approved - SJCET Booking System',
          text: `Hello ${user.name},\n\nYour account on the SJCET Booking System has been approved by an administrator! You can now log in and start booking facilities.\n\nThank you,\nSJCET Booking System`,
        });
      }
    } catch (err) {
      console.error('Error sending email notification:', err);
    }

    return NextResponse.json(user);
  } catch (error) {
    console.error('Approve user error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
