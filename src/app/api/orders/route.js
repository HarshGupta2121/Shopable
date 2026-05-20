import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import Coupon from '@/models/Coupon';
import User from '@/models/User';
import { sendOrderConfirmationEmail } from '@/lib/sendEmail';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-but-should-be-in-env';

// Helper to get authenticated user ID
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

// GET: Fetch user's orders
export async function GET() {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        await dbConnect();
        const orders = await Order.find({ user: userId }).sort({ createdAt: -1 });

        return NextResponse.json(orders, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Create a new order
export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { items, subtotal, total, discountAmount, couponApplied, shippingAddress, paymentMethod } = body;

        if (!items || !total || !shippingAddress || !paymentMethod) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        const newOrder = await Order.create({
            user: userId,
            items,
            subtotal: subtotal || total,
            total,
            discountAmount: discountAmount || 0,
            couponApplied: couponApplied || null,
            shippingAddress,
            paymentMethod,
            status: 'Processing'
        });

        // Increment coupon usage if applied
        // Increment coupon usage if applied
        if (couponApplied) {
            await Coupon.findOneAndUpdate(
                { code: couponApplied },
                { $inc: { timesUsed: 1 } }
            );
        }

        // Send Confirmation Email
        try {
            const user = await User.findById(userId);
            if (user && user.email) {
                await sendOrderConfirmationEmail(user.email, user.name, newOrder);
            }
        } catch (emailError) {
            console.error("Failed to send COD order email:", emailError);
        }

        return NextResponse.json(newOrder, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
