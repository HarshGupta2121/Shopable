import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db';
import Review from '@/models/Review';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-but-should-be-in-env';

async function getUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');

    if (!token) return null;

    try {
        const decoded = jwt.verify(token.value, JWT_SECRET);
        return decoded;
    } catch {
        return null;
    }
}

// GET: Fetch reviews for a product
export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const productId = searchParams.get('productId');

        if (!productId) {
            return NextResponse.json({ message: 'Product ID required' }, { status: 400 });
        }

        await dbConnect();
        // Sort by newest first
        const reviews = await Review.find({ product: productId }).sort({ createdAt: -1 });

        return NextResponse.json(reviews, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST: Add a review
export async function POST(request) {
    try {
        const userDecoded = await getUser();
        if (!userDecoded) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { productId, rating, comment } = body;

        if (!productId || !rating || !comment) {
            return NextResponse.json({ message: 'Missing required fields' }, { status: 400 });
        }

        await dbConnect();

        // Optional: Check if user bought the product? (Skipping for now to keep simple)

        try {
            const newReview = await Review.create({
                user: userDecoded.userId,
                userName: userDecoded.name,
                product: productId,
                rating,
                comment
            });
            return NextResponse.json(newReview, { status: 201 });
        } catch (error) {
            if (error.code === 11000) {
                return NextResponse.json({ message: 'You have already reviewed this product' }, { status: 400 });
            }
            throw error;
        }

    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
