import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const { name, capacity, description } = await request.json();

        const result = await pool.query(
            'UPDATE facilities SET name = $1, capacity = $2, description = $3 WHERE id = $4 RETURNING *',
            [name, capacity, description, id]
        );

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating facility:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const session = await getSession();
        if (!session || session.user.role !== 'ADMIN') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const result = await pool.query('DELETE FROM facilities WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return NextResponse.json({ error: 'Facility not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting facility:', error);
        // Handle foreign key constraint error (if bookings are tied to this facility)
        if (error.code === '23503') {
            return NextResponse.json({ error: 'Cannot delete facility. There are bookings associated with it.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
