import dbConnect from '@/lib/db';
import Product from '@/models/Product';
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

export async function GET(request, { params }) {
    try {
        await dbConnect();
        const { id } = await params;

        // The id from URL is a string. Our custom product 'id' field is numeric.
        // We will fallback to _id if it's not a number.
        let product;
        if (!isNaN(id)) {
             product = await Product.findOne({ id: parseInt(id) });
        }
        if (!product) {
             product = await Product.findById(id);
        }

        if (!product) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

        await dbConnect();
        const { id } = await params;
        const body = await request.json();

        // if id is numeric, findOneAndUpdate by id, otherwise _id
        let product;
        if (!isNaN(id)) {
            product = await Product.findOneAndUpdate({ id: parseInt(id) }, body, { new: true });
        }
        if (!product) {
            product = await Product.findByIdAndUpdate(id, body, { new: true });
        }

        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json(product, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });

        await dbConnect();
        const { id } = await params;

        let product;
        if (!isNaN(id)) {
            product = await Product.findOneAndDelete({ id: parseInt(id) });
        }
        if (!product) {
            product = await Product.findByIdAndDelete(id);
        }

        if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json({ message: 'Product deleted' }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
