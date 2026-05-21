import dbConnect from '@/lib/db';
import User from '@/models/User';
import Order from '@/models/Order';
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

export async function GET() {
    try {
        const admin = await verifyAdmin();
        if (!admin) {
            return NextResponse.json({ message: 'Unauthorized, admin only' }, { status: 403 });
        }

        await dbConnect();

        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        
        // Fetch all orders and products
        const orders = await Order.find({}).sort({ createdAt: 1 });
        const productsList = await Product.find({}, 'id category');
        
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);

        // 1. Sales & Orders Over Time (Last 7 Days)
        const salesOverTime = [];
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            salesOverTime.push({
                date: dateStr,
                fullDate: d.toISOString().split('T')[0],
                revenue: 0,
                orders: 0
            });
        }

        orders.forEach(order => {
            if (!order.createdAt) return;
            const orderDateStr = new Date(order.createdAt).toISOString().split('T')[0];
            const dayBucket = salesOverTime.find(d => d.fullDate === orderDateStr);
            if (dayBucket) {
                dayBucket.revenue += order.total || 0;
                dayBucket.orders += 1;
            }
        });

        // 2. Order Status Breakdown
        const orderStatusBreakdown = {
            Processing: 0,
            Shipped: 0,
            'Out for Delivery': 0,
            Delivered: 0,
            Cancelled: 0
        };
        orders.forEach(order => {
            const status = order.status || 'Processing';
            if (orderStatusBreakdown[status] !== undefined) {
                orderStatusBreakdown[status]++;
            } else {
                orderStatusBreakdown[status] = 1;
            }
        });
        const statusData = Object.keys(orderStatusBreakdown).map(key => ({
            name: key,
            value: orderStatusBreakdown[key]
        }));

        // 3. Category Sales Breakdown
        const productCategoryMap = {};
        productsList.forEach(p => {
            productCategoryMap[p.id] = p.category;
        });

        const categorySales = {};
        orders.forEach(order => {
            if (order.status === 'Cancelled') return;
            order.items.forEach(item => {
                const category = productCategoryMap[item.productId] || 'Other';
                const itemSales = (item.price || 0) * (item.quantity || 1);
                categorySales[category] = (categorySales[category] || 0) + itemSales;
            });
        });
        const categoryData = Object.keys(categorySales).map(key => ({
            name: key,
            value: categorySales[key]
        }));

        const recentOrders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 }).limit(5);

        return NextResponse.json({
            users: totalUsers,
            products: totalProducts,
            orders: totalOrders,
            revenue: totalRevenue,
            salesOverTime,
            statusData,
            categoryData,
            recentOrders
        }, { status: 200 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
