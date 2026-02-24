import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const facilityId = searchParams.get('facilityId');
    const date = searchParams.get('date');

    let query = `
      SELECT b.*, f.name as facility_name, u.name as user_name, u.department
      FROM bookings b
      JOIN facilities f ON b.facility_id = f.id
      JOIN users u ON b.user_id = u.id
      WHERE b.status = 'CONFIRMED'
    `;
    const values: any[] = [];

    if (facilityId) {
      values.push(facilityId);
      query += ` AND b.facility_id = $${values.length}`;
    }

    if (date) {
      values.push(date);
      query += ` AND b.booking_date = $${values.length}`;
    }

    query += ' ORDER BY b.booking_date DESC, b.session ASC';

    const result = await pool.query(query, values);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { facilityId, date, session: bookingSession } = await request.json();

    // Check for conflicts
    const conflictCheck = await pool.query(
      'SELECT id FROM bookings WHERE facility_id = $1 AND booking_date = $2 AND session = $3 AND status = $4',
      [facilityId, date, bookingSession, 'CONFIRMED']
    );

    if (conflictCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Slot already booked' }, { status: 409 });
    }

    const result = await pool.query(
      'INSERT INTO bookings (facility_id, user_id, booking_date, session) VALUES ($1, $2, $3, $4) RETURNING *',
      [facilityId, session.user.id, date, bookingSession]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
