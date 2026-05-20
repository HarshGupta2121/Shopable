import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-but-should-be-in-env';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token');

        if (!token) {
            return NextResponse.json(
                { message: 'Not authenticated' },
                { status: 401 }
            );
        }

        try {
            const decoded = jwt.verify(token.value, JWT_SECRET);

            // Optionally verify user still exists in DB
            // await dbConnect();
            // const user = await User.findById(decoded.userId);
            // if (!user) return NextResponse.json({ message: 'User not found' }, { status: 401 });

            return NextResponse.json(
                { user: { id: decoded.userId, name: decoded.name, email: decoded.email, role: decoded.role || 'user' } },
                { status: 200 }
            );
        } catch (e) {
            return NextResponse.json(
                { message: 'Invalid token' },
                { status: 401 }
            );
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
