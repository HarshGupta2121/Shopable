import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Order from '@/models/Order';
import User from '@/models/User';
import crypto from 'crypto';
import { sendOrderConfirmationEmail } from '@/lib/sendEmail';

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

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            orderData // The actual MongoDB order details to save upon success
        } = await request.json();

        if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
             return NextResponse.json({ error: 'Missing payment details' }, { status: 400 });
        }

        // Verify the signature to prevent tampering
        const sign = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSign = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET?.trim() || '')
            .update(sign.toString())
            .digest("hex");

        if (razorpay_signature !== expectedSign) {
            return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
        }

        // Payment is authentic! Now save the order to the database.
        await dbConnect();

        // Create the official MongoDB order attached to the razorpay payment
        const newOrder = await Order.create({
            user: userId,
            items: orderData.items,
            subtotal: orderData.subtotal,
            total: orderData.total,
            discountAmount: orderData.discountAmount || 0,
            couponApplied: orderData.couponApplied || null,
            shippingAddress: orderData.shippingAddress,
            paymentMethod: 'razorpay',
            paymentStatus: 'Completed',
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            status: 'Processing'
        });

        // Send Confirmation Email
        try {
            const user = await User.findById(userId);
            if (user && user.email) {
                await sendOrderConfirmationEmail(user.email, user.name, newOrder);
            }
        } catch (emailError) {
            console.error("Failed to send email to Razorpay user:", emailError);
        }

        return NextResponse.json({ success: true, orderId: newOrder._id }, { status: 200 });

    } catch (error) {
        console.error("Razorpay verification error:", error);
        return NextResponse.json({ error: 'Payment verification failed: ' + error.message, stack: error.stack }, { status: 500 });
    }
}
