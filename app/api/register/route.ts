import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';
import { sendEmail } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const { name, email, phone, position, password } = await request.json();

    if (!name || !email || !password || !position) {
      return NextResponse.json({ error: 'Name, email, position and password are required.' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters.' }, { status: 400 });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      `INSERT INTO users
         (name, email, password_hash, role, phone_number, position, is_active, registration_status)
       VALUES ($1, $2, $3, 'COORDINATOR', $4, $5, FALSE, 'PENDING')`,
      [name, email, passwordHash, phone || null, position]
    );

    // Notify admins about the new registration
    try {
      const adminRes = await pool.query("SELECT email FROM users WHERE role = 'ADMIN'");
      const adminEmails = adminRes.rows.map((row: any) => row.email).filter(Boolean);
      
      if (adminEmails.length > 0) {
        await sendEmail({
          to: adminEmails.join(','),
          subject: 'New User Registration - SJCET Booking System',
          text: `A new user has registered and is awaiting approval.\n\nName: ${name}\nEmail: ${email}\nPosition: ${position}\nPhone: ${phone || 'N/A'}\n\nPlease log in to the admin dashboard to approve or reject this request.`,
        });
      }
    } catch (err) {
      console.error('Error sending registration notification:', err);
    }

    return NextResponse.json({ message: 'Registration submitted. Awaiting admin approval.' }, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
