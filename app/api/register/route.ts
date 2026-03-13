import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import bcrypt from 'bcryptjs';

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

    return NextResponse.json({ message: 'Registration submitted. Awaiting admin approval.' }, { status: 201 });
  } catch (error: any) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'An account with this email already exists.' }, { status: 409 });
    }
    console.error('Registration error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
