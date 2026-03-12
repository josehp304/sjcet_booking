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
    const month = searchParams.get('month'); // Expects YYYY-MM

    let query = `
      SELECT b.*, f.name as facility_name, u.name as user_name, u.department
      FROM bookings b
      JOIN facilities f ON b.facility_id = f.id
      JOIN users u ON b.user_id = u.id
      WHERE b.status IN ('CONFIRMED', 'APPROVAL_PENDING')
    `;
    const values: any[] = [];

    if (facilityId) {
      values.push(facilityId);
      query += ` AND b.facility_id = $${values.length}`;
    }

    if (date) {
      values.push(date);
      query += ` AND b.booking_date = $${values.length}`;
    } else if (month) {
      const startOfMonth = `${month}-01`;
      const [year, mon] = month.split('-').map(Number);
      const lastDay = new Date(year, mon, 0).getDate(); // day 0 of next month = last day of current month
      const endOfMonth = `${month}-${String(lastDay).padStart(2, '0')}`;
      values.push(startOfMonth, endOfMonth);
      query += ` AND b.booking_date >= $${values.length - 1} AND b.booking_date <= $${values.length}`;
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

    const { facilityId, date, session: bookingSession, purpose } = await request.json();

    if (!purpose || purpose.trim() === '') {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 });
    }

    const [reqStart, reqEnd] = bookingSession.split('-');

    // Check for conflicts (block both confirmed and pending-approval slots)
    // We check if existing start < new end AND existing end > new start
    const conflictCheck = await pool.query(
      `SELECT id FROM bookings 
       WHERE facility_id = $1 
         AND booking_date = $2 
         AND status IN ('CONFIRMED', 'APPROVAL_PENDING')
         AND split_part(session, '-', 1) < $4
         AND split_part(session, '-', 2) > $3`,
      [facilityId, date, reqStart, reqEnd]
    );

    if (conflictCheck.rows.length > 0) {
      return NextResponse.json({ error: 'Slot already booked or overlaps with an existing booking' }, { status: 409 });
    }

    // HOD and COORDINATOR bookings require admin approval; ADMIN bookings are confirmed immediately
    const bookingStatus = ['HOD', 'COORDINATOR'].includes(session.user.role) ? 'APPROVAL_PENDING' : 'CONFIRMED';

    const result = await pool.query(
      'INSERT INTO bookings (facility_id, user_id, booking_date, session, purpose, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [facilityId, session.user.id, date, bookingSession, purpose, bookingStatus]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
