import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Coupon from '@/models/Coupon';

export async function POST(request) {
    try {
        const body = await request.json();
        const { code, subtotal } = body;

        if (!code || subtotal === undefined) {
            return NextResponse.json({ error: 'Code and subtotal are required' }, { status: 400 });
        }

        if (!mongoose.connections[0].readyState) {
            await mongoose.connect(process.env.MONGODB_URI);
        }

        const coupon = await Coupon.findOne({ code: code.toUpperCase() });

        if (!coupon) {
            return NextResponse.json({ error: 'Invalid coupon code' }, { status: 404 });
        }

        if (!coupon.isActive) {
            return NextResponse.json({ error: 'Coupon is no longer active' }, { status: 400 });
        }

        const now = new Date();
        if (now < coupon.validFrom) {
            return NextResponse.json({ error: 'Coupon is not yet valid' }, { status: 400 });
        }
        
        if (now > coupon.validUntil) {
            return NextResponse.json({ error: 'Coupon has expired' }, { status: 400 });
        }

        if (coupon.usageLimit !== null && coupon.timesUsed >= coupon.usageLimit) {
            return NextResponse.json({ error: 'Coupon usage limit reached' }, { status: 400 });
        }

        if (subtotal < coupon.minOrderAmount) {
            return NextResponse.json({ 
                error: `Minimum order amount of ₹${coupon.minOrderAmount} required` 
            }, { status: 400 });
        }

        // Calculate discount
        let discountAmount = 0;
        
        if (coupon.discountType === 'fixed') {
            discountAmount = coupon.discountValue;
        } else if (coupon.discountType === 'percentage') {
            discountAmount = (subtotal * coupon.discountValue) / 100;
            
            if (coupon.maxDiscount !== null && discountAmount > coupon.maxDiscount) {
                discountAmount = coupon.maxDiscount;
            }
        }

        // Prevent discount from making total negative
        if (discountAmount > subtotal) {
            discountAmount = subtotal;
        }

        return NextResponse.json({
            success: true,
            code: coupon.code,
            discountAmount,
            finalTotal: subtotal - discountAmount
        });

    } catch (error) {
        console.error('Error validating coupon:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
