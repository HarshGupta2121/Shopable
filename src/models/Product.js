import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true,
    },
    name: {
        type: String,
        required: [true, 'Please provide a name for this product.'],
        maxlength: [100, 'Name cannot be more than 100 characters'],
    },
    price: {
        type: Number,
        required: [true, 'Please provide a price for this product.'],
    },
    currency: {
        type: String,
        default: '₹',
    },
    category: {
        type: String,
        required: [true, 'Please provide a category for this product.'],
    },
    image: {
        type: String,
        required: [true, 'Please provide an image URL for this product.'],
    },
    description: {
        type: String,
    },
    sizes: {
        type: [String],
    },
    colors: {
        type: [String],
    },
    isFlashDeal: {
        type: Boolean,
        default: false,
    },
    flashDealEndTime: {
        type: String,
    },
});

export default mongoose.models.Product || mongoose.model('Product', ProductSchema);
