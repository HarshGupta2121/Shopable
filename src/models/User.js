import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a name.'],
    },
    email: {
        type: String,
        required: [true, 'Please provide an email.'],
        unique: true,
    },
    password: {
        type: String,
        // Not required if using OAuth, but required for credentials login
        // In a real app, this should be hashed.
    },
    image: {
        type: String,
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }],
    savedPaymentMethods: [{
        type: { type: String, default: 'card' },
        last4: String,
        holderName: String,
        expiry: String
    }],
    addresses: [{
        name: String,
        street: String,
        city: String,
        pincode: String,
        phone: String,
        isDefault: { type: Boolean, default: false }
    }]
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
