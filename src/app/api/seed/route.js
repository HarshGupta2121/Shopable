import dbConnect from '@/lib/db';
import Product from '@/models/Product';
import { products } from '@/data/products';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await dbConnect();

        // Clear existing products
        await Product.deleteMany({});

        // Insert new products
        await Product.insertMany(products);

        return NextResponse.json({ message: 'Database seeded successfully', count: products.length }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
