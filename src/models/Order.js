import mongoose from 'mongoose';

const OrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items: [
        {
            productId: { type: Number, required: true },
            name: { type: String, required: true },
            price: { type: Number, required: true },
            quantity: { type: Number, required: true },
            image: { type: String },
            selectedOptions: {
                size: String,
                color: String
            }
        }
    ],
    total: {
        type: Number,
        required: true
    },
    couponApplied: { type: String },
    discountAmount: { type: Number, default: 0 },
    subtotal: { type: Number, required: true },
    shippingAddress: {
        name: { type: String, required: true },
        street: { type: String, required: true },
        city: { type: String, required: true },
        pincode: { type: String, required: true },
        phone: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ['upi', 'card', 'cod', 'razorpay']
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Completed', 'Failed'],
        default: 'Pending'
    },
    razorpayOrderId: { type: String },
    razorpayPaymentId: { type: String },
    status: {
        type: String,
        default: 'Processing',
        enum: ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled']
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Prevent model recompilation error in dev
export default mongoose.models.Order || mongoose.model('Order', OrderSchema);
