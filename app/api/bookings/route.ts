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
    // custodian query: only bookings for facilities I'm custodian of
    const forCustodian = searchParams.get('forCustodian') === 'true';

    let query = `
      SELECT b.*, f.name as facility_name, u.name as user_name, u.department,
             f.custodian_id,
             cu.name as custodian_name
      FROM bookings b
      JOIN facilities f ON b.facility_id = f.id
      JOIN users u ON b.user_id = u.id
      LEFT JOIN users cu ON f.custodian_id = cu.id
      WHERE b.status IN ('CONFIRMED', 'APPROVAL_PENDING', 'DENIED')
    `;
    const values: any[] = [];

    // If this is a custodian and they only want their pending approvals
    if (forCustodian && (session.user.role === 'CUSTODIAN' || session.user.role === 'HOD' || session.user.role === 'ADMIN')) {
      if (session.user.role !== 'ADMIN') {
        values.push(session.user.id);
        query += ` AND f.custodian_id = $${values.length}`;
      }
    }

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
      const lastDay = new Date(year, mon, 0).getDate();
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

    const { facilityId, date, session: bookingSession, purpose, phoneNumber } = await request.json();

    if (!purpose || purpose.trim() === '') {
      return NextResponse.json({ error: 'Purpose is required' }, { status: 400 });
    }

    const [reqStart, reqEnd] = bookingSession.split('-');

    // Check for conflicts (block both confirmed and pending-approval slots)
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

    // Look up the facility's custodian
    const facilityRes = await pool.query('SELECT custodian_id FROM facilities WHERE id = $1', [facilityId]);
    const hasCustodian = facilityRes.rows.length > 0 && facilityRes.rows[0].custodian_id != null;

    // ADMIN bookings are confirmed immediately.
    // If facility has a custodian, all non-admin bookings go to APPROVAL_PENDING for custodian to approve.
    // If no custodian, HOD/COORDINATOR still go to APPROVAL_PENDING (admin approves as before).
    const bookingStatus = session.user.role === 'ADMIN' ? 'CONFIRMED' : 'APPROVAL_PENDING';

    const result = await pool.query(
      'INSERT INTO bookings (facility_id, user_id, booking_date, session, purpose, status, phone_number) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [facilityId, session.user.id, date, bookingSession, purpose, bookingStatus, phoneNumber || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
