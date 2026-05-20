require('dotenv').config({ path: '.env.local' });
const mongoose = require('mongoose');

async function testStats() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        
        const User = mongoose.connection.collection('users');
        const Product = mongoose.connection.collection('products');
        const Order = mongoose.connection.collection('orders');
        
        const totalUsers = await User.countDocuments();
        const totalProducts = await Product.countDocuments();
        
        const orders = await Order.find({}).toArray();
        const totalOrders = orders.length;
        const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
        
        console.log({
            users: totalUsers,
            products: totalProducts,
            orders: totalOrders,
            revenue: totalRevenue
        });
        
        process.exit(0);
    } catch(err) {
        console.error("ERROR:", err);
        process.exit(1);
    }
}

testStats();
