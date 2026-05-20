import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

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

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { amount } = await request.json();

        if (!amount || amount <= 0) {
            return NextResponse.json({ error: 'Invalid amount' }, { status: 400 });
        }

        const razorpay = new Razorpay({
            key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim(),
            key_secret: process.env.RAZORPAY_KEY_SECRET?.trim(),
        });

        // Razorpay accepts amount in smallest currency unit (paise for INR)
        // So ₹500 is 50000 paise.
        const options = {
            amount: Math.round(amount * 100), 
            currency: "INR",
            receipt: `rcpt_${userId}_${Date.now()}`.substring(0, 40) // receipt has max length 40
        };

        const order = await razorpay.orders.create(options);

        return NextResponse.json({ 
            id: order.id, 
            currency: order.currency, 
            amount: order.amount 
        });
    } catch (error) {
        console.error("Razorpay order creation error:", error);
        return NextResponse.json({ error: error.message || 'Payment initiation failed' }, { status: 500 });
    }
}
