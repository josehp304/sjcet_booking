import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';
import { sendEmail } from '@/lib/email';

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
      `SELECT b.*, f.custodian_id, f.name as facility_name, u.email as user_email, u.name as user_name FROM bookings b
       JOIN facilities f ON b.facility_id = f.id
       JOIN users u ON b.user_id = u.id
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

    // Send email notification to user
    try {
      if (booking.user_email) {
        const formattedDate = new Date(booking.booking_date).toISOString().split('T')[0];
        if (newStatus === 'CONFIRMED') {
          await sendEmail({
            to: booking.user_email,
            subject: `Booking Confirmed: ${booking.facility_name}`,
            text: `Hello ${booking.user_name},\n\nYour booking request for ${booking.facility_name} on ${formattedDate} (${booking.session}) has been APPROVED.\n\nThank you,\nSJCET Booking System`,
          });
        } else if (newStatus === 'DENIED') {
          await sendEmail({
            to: booking.user_email,
            subject: `Booking Denied: ${booking.facility_name}`,
            text: `Hello ${booking.user_name},\n\nUnfortunately, your booking request for ${booking.facility_name} on ${formattedDate} (${booking.session}) has been DENIED.\n\nPlease contact the facility custodian or administrator for more details.\n\nThank you,\nSJCET Booking System`,
          });
        }
      }
    } catch (err) {
      console.error('Error sending email notification:', err);
    }

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
      `SELECT b.*, f.custodian_id, f.name as facility_name, u.email as user_email, u.name as user_name FROM bookings b
       JOIN facilities f ON b.facility_id = f.id
       JOIN users u ON b.user_id = u.id
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

    // Send email notification to user if cancelled by someone else
    try {
      if (booking.user_email && !isOwner) { // if cancelled by admin/custodian
        const formattedDate = new Date(booking.booking_date).toISOString().split('T')[0];
        await sendEmail({
          to: booking.user_email,
          subject: `Booking Cancelled: ${booking.facility_name}`,
          text: `Hello ${booking.user_name},\n\nYour booking for ${booking.facility_name} on ${formattedDate} (${booking.session}) has been CANCELLED by an administrator or custodian.\n\nThank you,\nSJCET Booking System`,
        });
      }
    } catch (err) {
      console.error('Error sending email notification:', err);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
