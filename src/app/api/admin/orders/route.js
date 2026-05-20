import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-but-should-be-in-env';

async function verifyAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    if (!token) return null;
    try {
        const decoded = jwt.verify(token.value, JWT_SECRET);
        if (decoded.role !== 'admin') return null;
        return decoded;
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ message: 'Unauthorized, admin only' }, { status: 403 });
        }

        await dbConnect();

        const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });

        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ message: 'Unauthorized, admin only' }, { status: 403 });
        }

        const { id, status } = await request.json();
        
        await dbConnect();
        
        const updatedOrder = await Order.findByIdAndUpdate(id, { status }, { new: true });
        
        return NextResponse.json(updatedOrder, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
