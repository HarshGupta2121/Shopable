import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import User from '@/models/User';
import Product from '@/models/Product'; // Ensure Product model is registered

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
        if (!userId) return NextResponse.json([], { status: 200 }); // Return empty for guest

        await dbConnect();

        // Populate wishlist with product details
        const user = await User.findById(userId).populate('wishlist');

        if (!user) {
            return NextResponse.json({ message: 'User not found' }, { status: 404 });
        }

        // Filter out nulls in case referenced product was deleted
        const validWishlist = user.wishlist.filter(item => item !== null);

        return NextResponse.json(validWishlist, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { productId } = await request.json();
        if (!productId) {
            return NextResponse.json({ message: 'Product ID required' }, { status: 400 });
        }

        await dbConnect();

        // Use $addToSet to prevent duplicates
        await User.findByIdAndUpdate(userId, {
            $addToSet: { wishlist: productId }
        });

        return NextResponse.json({ message: 'Added to wishlist' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const userId = await getUserId();
        if (!userId) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const { productId } = await request.json();
        if (!productId) {
            return NextResponse.json({ message: 'Product ID required' }, { status: 400 });
        }

        await dbConnect();

        await User.findByIdAndUpdate(userId, {
            $pull: { wishlist: productId }
        });

        return NextResponse.json({ message: 'Removed from wishlist' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
