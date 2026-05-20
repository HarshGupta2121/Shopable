import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-but-should-be-in-env';

async function getUserId() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    if (!token) return null;

    try {
        const decoded = jwt.verify(token.value, JWT_SECRET);
        return decoded.userId;
    } catch {
        return null;
    }
}

export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        await dbConnect();
        const user = await User.findById(userId).select('savedPaymentMethods');

        return NextResponse.json(user.savedPaymentMethods || [], { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { last4, holderName, expiry } = body; // Simplified for demo

        await dbConnect();

        const newMethod = {
            type: 'card',
            last4: last4 || '4242',
            holderName: holderName || 'JOHN DOE',
            expiry: expiry || '12/30'
        };

        const user = await User.findByIdAndUpdate(
            userId,
            { $push: { savedPaymentMethods: newMethod } },
            { new: true }
        );

        return NextResponse.json(user.savedPaymentMethods, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const userId = await getUserId();
        if (!userId) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

        const { id } = await request.json();

        await dbConnect();

        const user = await User.findByIdAndUpdate(
            userId,
            { $pull: { savedPaymentMethods: { _id: id } } },
            { new: true }
        );

        return NextResponse.json(user.savedPaymentMethods, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
