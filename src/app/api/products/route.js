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

export async function GET(request) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('cat');
        const query = searchParams.get('q');
        const sort = searchParams.get('sort');
        const limit = searchParams.get('limit');
        
        // New Advanced Filters
        const minPrice = searchParams.get('minPrice');
        const maxPrice = searchParams.get('maxPrice');
        const filterColor = searchParams.get('color');

        let dbQuery = {};

        // Filter by Category
        if (category) {
            dbQuery.category = { $regex: new RegExp(category, 'i') };
        }

        // Search query
        if (query) {
            dbQuery.$or = [
                { name: { $regex: new RegExp(query, 'i') } },
                { description: { $regex: new RegExp(query, 'i') } },
                { category: { $regex: new RegExp(query, 'i') } },
            ];
        }

        // Price Filter
        if (minPrice || maxPrice) {
            dbQuery.price = {};
            if (minPrice) dbQuery.price.$gte = Number(minPrice);
            if (maxPrice) dbQuery.price.$lte = Number(maxPrice);
        }

        // Color Filter
        if (filterColor) {
            dbQuery.colors = { $regex: new RegExp(`^${filterColor}$`, 'i') };
        }

        let productsQuery = Product.find(dbQuery);

        // Sorting
        if (sort) {
            if (sort === 'price_asc') productsQuery = productsQuery.sort({ price: 1 });
            if (sort === 'price_desc') productsQuery = productsQuery.sort({ price: -1 });
            if (sort === 'newest') productsQuery = productsQuery.sort({ id: -1 });
            // trendings/bestsellers usually need order data, using price for now as proxy or just id
            if (sort === 'trending') productsQuery = productsQuery.sort({ id: 1 });
        }

        // Limit
        if (limit) {
            productsQuery = productsQuery.limit(parseInt(limit));
        }

        const products = await productsQuery.exec();

        return NextResponse.json(products, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const admin = await verifyAdmin();
        if (!admin) return NextResponse.json({ message: 'Unauthorized, admin only' }, { status: 403 });

        await dbConnect();
        const body = await request.json();

        // Autogenerate numerical id if not provided, just as a fallback 
        if (!body.id) {
             const maxProduct = await Product.findOne().sort('-id');
             body.id = maxProduct && maxProduct.id ? maxProduct.id + 1 : 1;
        }

        const newProduct = await Product.create(body);

        return NextResponse.json(newProduct, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
