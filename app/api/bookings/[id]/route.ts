import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

// PATCH: Approve (status -> CONFIRMED) or Deny (status -> DENIED)
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const action = body.action ?? 'approve'; // 'approve' or 'deny'

    // Look up the booking to check facility custodian
    const bookingRes = await pool.query(
      `SELECT b.*, f.custodian_id FROM bookings b
       JOIN facilities f ON b.facility_id = f.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingRes.rows[0];

    // Authorization: ADMIN can approve/deny anything.
    // Custodian (CUSTODIAN or HOD with custodian_id) can approve/deny their facility's bookings.
    const isAdmin = session.user.role === 'ADMIN';
    const isCustodian =
      (session.user.role === 'CUSTODIAN' || session.user.role === 'HOD') &&
      booking.custodian_id === session.user.id;

    if (!isAdmin && !isCustodian) {
      return NextResponse.json({ error: 'Unauthorized: Only the facility custodian or admin can approve/deny bookings' }, { status: 403 });
    }

    if (booking.status !== 'APPROVAL_PENDING') {
      return NextResponse.json({ error: 'Booking is not pending approval' }, { status: 400 });
    }

    const newStatus = action === 'deny' ? 'DENIED' : 'CONFIRMED';

    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      [newStatus, id]
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Look up booking + facility custodian
    const bookingRes = await pool.query(
      `SELECT b.*, f.custodian_id FROM bookings b
       JOIN facilities f ON b.facility_id = f.id
       WHERE b.id = $1`,
      [id]
    );

    if (bookingRes.rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const booking = bookingRes.rows[0];

    const isAdmin = session.user.role === 'ADMIN';
    const isCustodian =
      (session.user.role === 'CUSTODIAN' || session.user.role === 'HOD') &&
      booking.custodian_id === session.user.id;
    const isOwner = booking.user_id === session.user.id;

    if (!isAdmin && !isCustodian && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const result = await pool.query(
      'UPDATE bookings SET status = $1 WHERE id = $2 RETURNING *',
      ['CANCELLED', id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
