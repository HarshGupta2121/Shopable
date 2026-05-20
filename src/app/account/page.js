/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from 'react';
import { useVoice } from '@/context/VoiceContext';
import { useAuth } from '@/context/AuthContext';
import { useWishlist } from '@/context/WishlistContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';
import { User, Package, Heart, CreditCard, MapPin, LogOut, ChevronRight, Box, Loader2, AlertCircle, CheckCircle2, Trash2, Plus, HelpCircle, Settings, Home } from 'lucide-react';
import Link from 'next/link';

export default function AccountPage() {
    const { speak } = useVoice();
    const { logout, user } = useAuth();
    const { wishlist } = useWishlist();
    const { addToCart } = useCart();
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('profile');

    // Orders State
    const [orders, setOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    // Tracking State
    const [trackOrderId, setTrackOrderId] = useState('');
    const [trackedOrder, setTrackedOrder] = useState(null);
    const [trackingLoading, setTrackingLoading] = useState(false);
    const [trackingError, setTrackingError] = useState(null);

    // Payments State
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [loadingPayments, setLoadingPayments] = useState(false);
    const [addingCard, setAddingCard] = useState(false);
    const [newCard, setNewCard] = useState({ holderName: '', last4: '', expiry: '' });

    // Addresses State
    const [addresses, setAddresses] = useState([]);
    const [loadingAddresses, setLoadingAddresses] = useState(false);
    const [addingAddress, setAddingAddress] = useState(false);
    const [newAddress, setNewAddress] = useState({ name: '', street: '', city: '', pincode: '', phone: '', isDefault: false });

    const tabs = [
        { id: 'profile', label: 'Profile', icon: User },
        { id: 'orders', label: 'My Orders', icon: Package },
        { id: 'favorites', label: 'Favorites', icon: Heart },
        { id: 'addresses', label: 'Address Book', icon: Home },
        { id: 'payments', label: 'Payments', icon: CreditCard },
        { id: 'tracking', label: 'Order Tracking', icon: MapPin },
        { id: 'help', label: 'Help Center', icon: HelpCircle },
        { id: 'settings', label: 'Settings', icon: Settings },
    ];

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const res = await fetch('/api/orders');
                if (res.ok) {
                    const data = await res.json();
                    setOrders(data);
                }
            } catch (error) {
                console.error("Failed to fetch orders", error);
            } finally {
                setLoadingOrders(false);
            }
        };

        if (user) {
            fetchOrders();
        } else {
            setLoadingOrders(false);
        }
    }, [user]);

    // Fetch payments when tab is active
    useEffect(() => {
        if (activeTab === 'payments' && user) {
            setLoadingPayments(true);
            fetch('/api/user/payment-methods')
                .then(res => res.json())
                .then(data => setPaymentMethods(data))
                .catch(err => console.error(err))
                .finally(() => setLoadingPayments(false));
        }
    }, [activeTab, user]);

    useEffect(() => {
        if (activeTab === 'addresses' && user) {
            setLoadingAddresses(true);
            fetch('/api/user/addresses', { headers: { 'x-user-id': user.id } })
                .then(res => res.json())
                .then(data => setAddresses(Array.isArray(data) ? data : []))
                .catch(err => console.error(err))
                .finally(() => setLoadingAddresses(false));
        }
    }, [activeTab, user]);

    const handleTabChange = (tabId) => {
        setActiveTab(tabId);
        speak(`Showing ${tabId}`);
    };

    const handleLogout = () => {
        logout();
        speak("Signed out successfully.");
        router.push('/');
    };

    const handleTrackOrder = async () => {
        if (!trackOrderId.trim()) {
            setTrackingError("Please enter an Order ID");
            return;
        }

        setTrackingLoading(true);
        setTrackingError(null);
        setTrackedOrder(null);

        try {
            const res = await fetch(`/api/orders/${trackOrderId.trim()}`);

            if (!res.ok) {
                if (res.status === 404) throw new Error("Order not found. Please check the ID.");
                if (res.status === 403) throw new Error("You don't have permission to view this order.");
                throw new Error("Failed to track order");
            }

            const data = await res.json();
            setTrackedOrder(data);
            speak(`Order found. Status is ${data.status}`);
        } catch (err) {
            setTrackingError(err.message);
            speak("Could not track order.");
        } finally {
            setTrackingLoading(false);
        }
    };

    const handleAddCard = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/user/payment-methods', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newCard)
            });
            if (res.ok) {
                const updatedMethods = await res.json();
                setPaymentMethods(updatedMethods);
                setAddingCard(false);
                setNewCard({ holderName: '', last4: '', expiry: '' });
                speak("Payment method added.");
            }
        } catch (error) {
            console.error("Failed to add card", error);
        }
    };

    const handleDeleteCard = async (id) => {
        try {
            const res = await fetch('/api/user/payment-methods', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                const updatedMethods = await res.json();
                setPaymentMethods(updatedMethods);
                speak("Payment method removed.");
            }
        } catch (error) {
            console.error("Failed to delete card", error);
        }
    };

    const handleAddAddress = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/user/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                body: JSON.stringify(newAddress)
            });
            if (res.ok) {
                const updated = await res.json();
                setAddresses(updated);
                setAddingAddress(false);
                setNewAddress({ name: '', street: '', city: '', pincode: '', phone: '', isDefault: false });
                speak("Address saved to your address book.");
            }
        } catch (error) {
            console.error("Failed to add address", error);
        }
    };

    const handleDeleteAddress = async (id) => {
        try {
            const res = await fetch('/api/user/addresses', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json', 'x-user-id': user.id },
                body: JSON.stringify({ id })
            });
            if (res.ok) {
                const updated = await res.json();
                setAddresses(updated);
                speak("Address removed.");
            }
        } catch (error) {
            console.error("Failed to delete address", error);
        }
    };

    return (
        <div className="container py-8 min-h-[80vh]">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8">

                {/* Sidebar Navigation */}
                <div className="md:col-span-3 space-y-2">
                    <div className="p-4 bg-secondary/30 rounded-xl mb-6 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl font-bold">
                            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                            <h2 className="font-bold">{user?.name || 'Guest User'}</h2>
                            <p className="text-xs text-muted-foreground">{user?.email || 'guest@example.com'}</p>
                        </div>
                    </div>

                    <nav className="space-y-1">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => handleTabChange(tab.id)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                    ? 'bg-primary text-primary-foreground'
                                    : 'hover:bg-secondary text-muted-foreground'
                                    }`}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-4"
                        >
                            <LogOut className="w-4 h-4" />
                            Sign Out
                        </button>
                    </nav>
                </div>

                {/* Main Content Area */}
                <div className="md:col-span-9">
                    <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm min-h-[500px]">

                        {activeTab === 'profile' && (
                            <div className="space-y-6 animate-fadeIn animate-slideUp">
                                <h2 className="text-2xl font-bold">Personal Information</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                                        <input type="text" defaultValue={user?.name || ''} className="w-full p-2 rounded-md border bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                                        <input type="email" defaultValue={user?.email || ''} className="w-full p-2 rounded-md border bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Phone</label>
                                        <input type="tel" defaultValue={user?.phone || ''} placeholder="+91 98765 43210" className="w-full p-2 rounded-md border bg-background" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium text-muted-foreground">Location</label>
                                        <input type="text" defaultValue={user?.location || ''} placeholder="New Delhi, India" className="w-full p-2 rounded-md border bg-background" />
                                    </div>
                                </div>
                                <button className="btn btn-primary">Save Changes</button>
                            </div>
                        )}

                        {activeTab === 'orders' && (
                            <div className="space-y-6 animate-fadeIn animate-slideUp">
                                <h2 className="text-2xl font-bold">My Orders</h2>
                                {loadingOrders ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : orders.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground">
                                        <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>You haven&apos;t placed any orders yet.</p>
                                        <Link href="/shop" className="text-primary hover:underline mt-2 inline-block">Start Shopping</Link>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {orders.map((order) => (
                                            <div key={order._id} className="border rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-bold">ORD-{order._id.slice(-6).toUpperCase()}</span>
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                                            {order.status}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">
                                                        {new Date(order.createdAt).toLocaleDateString()} • {order.items.length} items
                                                    </p>
                                                    <p className="text-xs text-muted-foreground truncate max-w-xs">
                                                        {order.items.map(i => i.name).join(', ')}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-4 w-full md:w-auto justify-between">
                                                    <span className="font-bold">₹{order.total.toLocaleString()}</span>
                                                    <Link href={`/account/orders/${order._id}`} className="text-sm text-primary hover:underline" onClick={() => speak(`Viewing order details`)}>
                                                        View Details
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'favorites' && (
                            <div className="space-y-6 animate-fadeIn animate-slideUp">
                                <h2 className="text-2xl font-bold">Favorites</h2>
                                {wishlist.length === 0 ? (
                                    <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                                        <Heart className="w-12 h-12 mx-auto mb-4 opacity-20" />
                                        <p>Your wishlist is empty.</p>
                                        <Link href="/shop" className="text-primary hover:underline mt-2 inline-block font-medium">
                                            Discover Products
                                        </Link>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                        {wishlist.map((item) => (
                                            <div key={item.id} className="group border rounded-xl p-4 hover:shadow-md transition-shadow">
                                                <Link href={`/shop/${item.id}`}>
                                                    <div className="aspect-square bg-secondary/30 rounded-lg mb-3 overflow-hidden relative">
                                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    </div>
                                                </Link>
                                                <Link href={`/shop/${item.id}`} className="hover:underline">
                                                    <h3 className="font-medium truncate">{item.name}</h3>
                                                </Link>
                                                <p className="text-sm text-muted-foreground">₹{item.price.toLocaleString()}</p>
                                                <button
                                                    onClick={() => {
                                                        addToCart(item);
                                                        speak(`Added ${item.name} to cart`);
                                                    }}
                                                    className="mt-3 w-full text-xs btn btn-outline h-8 hover:bg-primary hover:text-white transition-colors"
                                                >
                                                    Add to Cart
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'addresses' && (
                            <div className="space-y-6 animate-fadeIn animate-slideUp">
                                <h2 className="text-2xl font-bold">Address Book</h2>
                                
                                {loadingAddresses ? (
                                    <div className="flex justify-center p-8">
                                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {addresses.map((addr) => (
                                            <div key={addr._id} className="border rounded-xl p-6 relative group bg-card transition-shadow hover:shadow-md">
                                                <button
                                                    onClick={() => handleDeleteAddress(addr._id)}
                                                    className="absolute top-4 right-4 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/10 hover:text-destructive rounded-full"
                                                    title="Remove Address"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                                {addr.isDefault && (
                                                    <span className="absolute top-4 right-14 text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">Default</span>
                                                )}
                                                <div className="space-y-1 pr-14">
                                                    <h3 className="font-bold">{addr.name}</h3>
                                                    <p className="text-sm text-muted-foreground">{addr.street}</p>
                                                    <p className="text-sm text-muted-foreground">{addr.city}, {addr.pincode}</p>
                                                    <p className="text-sm text-muted-foreground pt-2 flex items-center gap-2">
                                                        <span className="w-4 h-4 rounded-full bg-secondary flex items-center justify-center">📞</span>
                                                        {addr.phone}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}

                                        {!addingAddress ? (
                                            <button
                                                onClick={() => setAddingAddress(true)}
                                                className="border rounded-xl p-6 flex items-center justify-center border-dashed cursor-pointer hover:bg-secondary/50 transition-colors min-h-[220px]"
                                            >
                                                <div className="text-center">
                                                    <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2 text-primary">
                                                        <Plus className="w-6 h-6" />
                                                    </div>
                                                    <p className="text-sm font-medium">Add New Address</p>
                                                </div>
                                            </button>
                                        ) : (
                                            <div className="border rounded-xl p-6 bg-secondary/10">
                                                <h3 className="font-bold mb-4 flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-primary" />
                                                    Add New Address
                                                </h3>
                                                <form onSubmit={handleAddAddress} className="space-y-4">
                                                    <div>
                                                        <input
                                                            className="w-full p-2.5 rounded-lg border text-sm"
                                                            placeholder="Full Name"
                                                            value={newAddress.name}
                                                            onChange={e => setNewAddress({ ...newAddress, name: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            className="w-full p-2.5 rounded-lg border text-sm"
                                                            placeholder="Street Address, Apt, Suite"
                                                            value={newAddress.street}
                                                            onChange={e => setNewAddress({ ...newAddress, street: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <input
                                                            className="w-2/3 p-2.5 rounded-lg border text-sm"
                                                            placeholder="City"
                                                            value={newAddress.city}
                                                            onChange={e => setNewAddress({ ...newAddress, city: e.target.value })}
                                                            required
                                                        />
                                                        <input
                                                            className="w-1/3 p-2.5 rounded-lg border text-sm"
                                                            placeholder="PIN Code"
                                                            value={newAddress.pincode}
                                                            onChange={e => setNewAddress({ ...newAddress, pincode: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <div>
                                                        <input
                                                            className="w-full p-2.5 rounded-lg border text-sm"
                                                            placeholder="Phone Number"
                                                            value={newAddress.phone}
                                                            onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })}
                                                            required
                                                        />
                                                    </div>
                                                    <label className="flex items-center gap-2 text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            checked={newAddress.isDefault}
                                                            onChange={e => setNewAddress({ ...newAddress, isDefault: e.target.checked })}
                                                            className="rounded border-gray-300 text-primary focus:ring-primary"
                                                        />
                                                        Make this my default address
                                                    </label>
                                                    <div className="flex gap-2 pt-2">
                                                        <button type="submit" className="flex-1 btn btn-primary py-2 text-sm font-medium">Save Address</button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setAddingAddress(false)}
                                                            className="flex-1 btn btn-outline py-2 text-sm font-medium"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'payments' && (
                            <div className="space-y-6 animate-fadeIn animate-slideUp">
                                <h2 className="text-2xl font-bold">Payment Methods</h2>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {paymentMethods.map((method) => (
                                        <div key={method._id} className="border rounded-xl p-6 bg-gradient-to-br from-gray-900 to-gray-800 text-white relative overflow-hidden group">
                                            <button
                                                onClick={() => handleDeleteCard(method._id)}
                                                className="absolute top-2 right-2 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/20 rounded-full"
                                                title="Remove Card"
                                            >
                                                <Trash2 className="w-4 h-4 text-red-300" />
                                            </button>
                                            <div className="absolute top-0 right-0 p-4 opacity-20 pointer-events-none">
                                                <CreditCard className="w-24 h-24" />
                                            </div>
                                            <div className="relative z-10">
                                                <p className="text-xs opacity-70 mb-8">Debit/Credit Card</p>
                                                <p className="text-2xl font-mono mb-8">**** **** **** {method.last4}</p>
                                                <div className="flex justify-between items-end">
                                                    <div>
                                                        <p className="text-xs opacity-70">Card Holder</p>
                                                        <p className="font-medium uppercase">{method.holderName}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs opacity-70">Expires</p>
                                                        <p className="font-medium">{method.expiry}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {!addingCard ? (
                                        <button
                                            onClick={() => setAddingCard(true)}
                                            className="border rounded-xl p-6 flex items-center justify-center border-dashed cursor-pointer hover:bg-secondary/50 transition-colors min-h-[220px]"
                                        >
                                            <div className="text-center">
                                                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mx-auto mb-2">
                                                    <Plus className="w-6 h-6" />
                                                </div>
                                                <p className="text-sm font-medium">Add New Card</p>
                                            </div>
                                        </button>
                                    ) : (
                                        <div className="border rounded-xl p-6 bg-secondary/10">
                                            <h3 className="font-bold mb-4">Add Card Details</h3>
                                            <form onSubmit={handleAddCard} className="space-y-3">
                                                <input
                                                    className="w-full p-2 rounded border text-sm"
                                                    placeholder="Card Holder Name"
                                                    value={newCard.holderName}
                                                    onChange={e => setNewCard({ ...newCard, holderName: e.target.value })}
                                                    required
                                                />
                                                <div className="flex gap-2">
                                                    <input
                                                        className="w-full p-2 rounded border text-sm"
                                                        placeholder="Last 4 Digits"
                                                        maxLength={4}
                                                        value={newCard.last4}
                                                        onChange={e => setNewCard({ ...newCard, last4: e.target.value })}
                                                        required
                                                    />
                                                    <input
                                                        className="w-full p-2 rounded border text-sm"
                                                        placeholder="MM/YY"
                                                        value={newCard.expiry}
                                                        onChange={e => setNewCard({ ...newCard, expiry: e.target.value })}
                                                        required
                                                    />
                                                </div>
                                                <div className="flex gap-2 mt-2">
                                                    <button type="submit" className="flex-1 btn btn-primary text-xs py-2">Save</button>
                                                    <button
                                                        type="button"
                                                        onClick={() => setAddingCard(false)}
                                                        className="flex-1 btn btn-outline text-xs py-2"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'tracking' && (
                            <div className="space-y-6 animate-fadeIn animate-slideUp">
                                <h2 className="text-2xl font-bold">Track Order</h2>
                                <div className="flex gap-2 mb-6">
                                    <input
                                        type="text"
                                        placeholder="Enter Order ID"
                                        className="flex-1 p-2 rounded-md border bg-background"
                                        value={trackOrderId}
                                        onChange={(e) => setTrackOrderId(e.target.value)}
                                    />
                                    <button
                                        onClick={handleTrackOrder}
                                        disabled={trackingLoading}
                                        className="btn btn-primary px-6 disabled:opacity-50"
                                    >
                                        {trackingLoading ? 'Tracking...' : 'Track'}
                                    </button>
                                </div>

                                {trackingError && (
                                    <div className="p-4 bg-red-50 text-red-600 rounded-lg flex items-center gap-2">
                                        <AlertCircle className="w-5 h-5" />
                                        {trackingError}
                                    </div>
                                )}

                                {trackedOrder && (
                                    <div className="border rounded-xl p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4">
                                        <div className="flex items-center justify-between border-b pb-4">
                                            <div>
                                                <h3 className="font-bold text-lg">Order #{trackedOrder._id}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    Status: <span className="font-medium text-foreground">{trackedOrder.status}</span>
                                                </p>
                                            </div>
                                            <Box className="w-8 h-8 text-primary" />
                                        </div>

                                        <div className="relative space-y-8 pl-8 before:content-[''] before:absolute before:left-3 before:top-2 before:bottom-2 before:w-0.5 before:bg-border">
                                            {['Processing', 'Shipped', 'Out for Delivery', 'Delivered'].map((step, idx) => {
                                                const statuses = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
                                                const currentIdx = statuses.indexOf(trackedOrder.status);
                                                const isCompleted = idx <= currentIdx;
                                                const isActive = idx === currentIdx;

                                                return (
                                                    <div key={idx} className="relative">
                                                        <div className={`absolute -left-[29px] w-4 h-4 rounded-full border-2 transition-colors duration-500 ${isCompleted ? 'bg-primary border-primary' : 'bg-background border-muted'
                                                            }`} />
                                                        <h4 className={`font-medium ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>{step}</h4>
                                                        {isActive && <p className="text-xs text-primary font-medium animate-pulse">Current Status</p>}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {trackedOrder.status === 'Delivered' && (
                                            <div className="bg-green-50 p-4 rounded-lg flex items-center gap-2 text-green-700 text-sm">
                                                <CheckCircle2 className="w-5 h-5" />
                                                Your order has been delivered successfully.
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'help' && (
                            <div className="space-y-6 animate-fadeIn animate-slideUp">
                                <h2 className="text-2xl font-bold">Help Center</h2>
                                <div className="space-y-4">
                                    <div className="border rounded-xl p-6">
                                        <h3 className="font-bold text-lg mb-4">Frequently Asked Questions</h3>
                                        <div className="space-y-4">
                                            <div className="border-b border-border pb-4">
                                                <h4 className="font-medium mb-1">How do I return an item?</h4>
                                                <p className="text-sm text-muted-foreground">You can return an item within 30 days of delivery. Go to My Orders, select the order, and click "Return Item".</p>
                                            </div>
                                            <div className="border-b border-border pb-4">
                                                <h4 className="font-medium mb-1">How long does shipping take?</h4>
                                                <p className="text-sm text-muted-foreground">Standard shipping takes 3-5 business days. Expedited shipping takes 1-2 business days.</p>
                                            </div>
                                            <div>
                                                <h4 className="font-medium mb-1">How do I track my order?</h4>
                                                <p className="text-sm text-muted-foreground">You can track your order using the "Order Tracking" tab with your Order ID.</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="border rounded-xl p-6 text-center">
                                            <h3 className="font-bold mb-2">Contact Support</h3>
                                            <p className="text-sm text-muted-foreground mb-4">We&apos;re here to help you 24/7.</p>
                                            <button className="btn btn-outline w-full">Email Us</button>
                                        </div>
                                        <div className="border rounded-xl p-6 text-center">
                                            <h3 className="font-bold mb-2">Call Us</h3>
                                            <p className="text-sm text-muted-foreground mb-4">Mon-Fri, 9am - 6pm</p>
                                            <button className="btn btn-primary w-full">1800-123-4567</button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <div className="space-y-6 animate-fadeIn animate-slideUp">
                                <h2 className="text-2xl font-bold">Account Settings</h2>
                                
                                <div className="space-y-6">
                                    {/* Notifications */}
                                    <div className="border rounded-xl p-6 space-y-6">
                                        <h3 className="font-bold text-lg">Notifications</h3>
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-medium">Order Updates</p>
                                                <p className="text-sm text-muted-foreground">Receive updates about your order status</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" defaultChecked />
                                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-border pt-6">
                                            <div>
                                                <p className="font-medium">Promotions & Offers</p>
                                                <p className="text-sm text-muted-foreground">Receive emails about new products and sales</p>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input type="checkbox" className="sr-only peer" />
                                                <div className="w-11 h-6 bg-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                                            </label>
                                        </div>
                                    </div>
                                    
                                    {/* Security */}
                                    <div className="border rounded-xl p-6 space-y-6">
                                        <h3 className="font-bold text-lg">Security & Privacy</h3>
                                        <div className="space-y-6">
                                            <div className="flex justify-between items-center border-b border-border pb-6">
                                                <div>
                                                    <p className="font-medium">Change Password</p>
                                                    <p className="text-sm text-muted-foreground">Update your password to keep your account secure</p>
                                                </div>
                                                <button className="btn btn-outline text-sm">Update</button>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <p className="font-medium text-destructive">Delete Account</p>
                                                    <p className="text-sm text-muted-foreground">Permanently remove your account and data</p>
                                                </div>
                                                <button className="btn btn-outline text-destructive border-destructive hover:bg-destructive hover:text-white text-sm">Delete Account</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                    </div>
                </div>
            </div>
        </div>
    );
}
