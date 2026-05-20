"use client";

import { useState, useEffect } from 'react';
import { useVoice } from '@/context/VoiceContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Check, CreditCard, Truck, ShieldCheck, Smartphone, MapPin, ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function CheckoutPage() {
    const { speak } = useVoice();
    const { cart, total, clearCart } = useCart();
    const { user, isAuthenticated } = useAuth();
    const router = useRouter();

    // Steps: 1 = Address, 2 = Order Summary, 3 = Payment, 4 = Success
    const [currentStep, setCurrentStep] = useState(1);

    // Address State
    const [savedAddresses, setSavedAddresses] = useState([]);
    const [selectedAddressId, setSelectedAddressId] = useState('new');
    const [address, setAddress] = useState({
        name: user?.name || '',
        street: '',
        city: '',
        pincode: '',
        phone: ''
    });

    // Coupon State
    const [couponCode, setCouponCode] = useState('');
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [discountAmount, setDiscountAmount] = useState(0);
    const [couponError, setCouponError] = useState('');
    const [applyingCoupon, setApplyingCoupon] = useState(false);

    // Payment State
    const [paymentMethod, setPaymentMethod] = useState('razorpay');
    const [isOrderPlaced, setIsOrderPlaced] = useState(false);
    const [orderId, setOrderId] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);

    useEffect(() => {
        if (isAuthenticated && user) {
            fetch('/api/user/addresses', { headers: { 'x-user-id': user.id } })
                .then(res => res.json())
                .then(data => {
                    if (Array.isArray(data) && data.length > 0) {
                        setSavedAddresses(data);
                        const defaultAddr = data.find(a => a.isDefault) || data[0];
                        setSelectedAddressId(defaultAddr._id);
                        setAddress({
                            name: defaultAddr.name,
                            street: defaultAddr.street,
                            city: defaultAddr.city,
                            pincode: defaultAddr.pincode,
                            phone: defaultAddr.phone
                        });
                    }
                })
                .catch(err => console.error(err));
        }
    }, [isAuthenticated, user]);

    const steps = [
        { id: 1, label: "Address", icon: MapPin },
        { id: 2, label: "Summary", icon: ShoppingBag },
        { id: 3, label: "Payment", icon: CreditCard },
    ];

    const handleNext = () => {
        if (currentStep === 1) {
            if (!address.name?.trim() || !address.street?.trim() || !address.city?.trim() || !address.pincode?.trim() || !address.phone?.trim()) {
                speak("Please fill in all address fields to continue.");
                alert("Please fill in all address fields to continue.");
                return;
            }
        }

        if (currentStep < 3) {
            setCurrentStep(curr => curr + 1);
            if (currentStep === 1) speak("Address confirmed. Review your order.");
            if (currentStep === 2) speak("Order reviewed. Choose payment method.");
        }
    };

    const handleBack = () => {
        if (currentStep > 1) setCurrentStep(curr => curr - 1);
    };

    const handlePlaceOrder = async () => {
        if (!user) {
            speak("Please sign in to place your order.");
            router.push('/signin?redirect=/checkout');
            return;
        }

        setIsProcessing(true);
        speak("Processing your order. Please wait.");

        try {
            const orderData = {
                items: cart.map(item => ({
                    productId: item.id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                    selectedOptions: item.selectedOptions
                })),
                subtotal: total,
                discountAmount: discountAmount,
                couponApplied: appliedCoupon,
                total: finalTotal,
                shippingAddress: address,
                paymentMethod: paymentMethod
            };

            if (paymentMethod === 'razorpay') {
                const razorpayOrderRes = await fetch('/api/orders/create-razorpay-order', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ amount: finalTotal })
                });

                if (!razorpayOrderRes.ok) throw new Error('Failed to initiate secure payment');
                const razorpayOrderData = await razorpayOrderRes.json();

                const options = {
                    key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim(), 
                    amount: razorpayOrderData.amount, 
                    currency: razorpayOrderData.currency,
                    name: "Shopable E-commerce",
                    description: "Order Checkout",
                    order_id: razorpayOrderData.id,
                    handler: async function (response) {
                        try {
                            speak("Payment successful. Verifying your transaction.");
                            const verifyRes = await fetch('/api/orders/verify-payment', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    orderData: orderData
                                })
                            });

                            if (verifyRes.ok) {
                                const finalOrder = await verifyRes.json();
                                setOrderId(finalOrder.orderId);
                                setIsOrderPlaced(true);
                                setCurrentStep(4);
                                clearCart();
                                speak("Order successfully placed! Thank you.");
                            } else {
                                const errorData = await verifyRes.json();
                                throw new Error(errorData.error || 'Payment verification failed');
                            }
                        } catch (err) {
                            speak("Payment verification failed. Please contact support.");
                            alert(err.message || "Payment verification failed.");
                        } finally {
                            setIsProcessing(false);
                        }
                    },
                    prefill: {
                        name: address.name,
                        email: user?.email,
                        contact: address.phone
                    },
                    theme: {
                        color: "#0f766e" // Teal 700
                    }
                };

                const rzp = new window.Razorpay(options);
                rzp.on('payment.failed', function (response){
                    setIsProcessing(false);
                    speak("Payment failed. Please try again.");
                    alert(response.error.description);
                });
                rzp.open();
                return; // Return early, don't execute finally block yet since payment is async window
            } else {
                const res = await fetch('/api/orders', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(orderData)
                });

                if (res.ok) {
                    const data = await res.json();
                    setOrderId(data._id);
                    setIsOrderPlaced(true);
                    setCurrentStep(4);
                    clearCart();
                    speak("Order placed successfully! Thank you for shopping.");
                } else {
                    throw new Error('Failed to place order');
                }
            }
        } catch (error) {
            console.error(error);
            speak("Sorry, there was an issue placing your order.");
            alert("Failed to place order. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    if (cart.length === 0 && !isOrderPlaced) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="bg-white p-6 rounded-full inline-block shadow-sm">
                        <ShoppingBag className="w-12 h-12 text-gray-300" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800">Your cart is empty</h2>
                    <p className="text-gray-500">Add items to proceed to checkout.</p>
                    <Link href="/shop" className="btn btn-primary inline-block">Start Shopping</Link>
                </div>
            </div>
        );
    }

    if (isOrderPlaced) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 animate-in fade-in duration-500">
                <div className="bg-white p-8 rounded-2xl shadow-lg max-w-md w-full text-center space-y-6 border border-border">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                        <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Order Confirmed!</h1>
                        <p className="text-gray-600">Thank you for your purchase. Your order ID is <span className="font-mono font-bold text-gray-900">#{orderId ? orderId.slice(-6).toUpperCase() : 'ORD-1234'}</span></p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl text-left text-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Amount Paid</span>
                            <span className="font-bold">₹{finalTotal.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Payment Method</span>
                            <span className="font-bold uppercase">{paymentMethod}</span>
                        </div>
                    </div>
                    <Link href="/shop" className="btn btn-primary w-full block">Continue Shopping</Link>
                </div>
            </div>
        );
    }

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setApplyingCoupon(true);
        setCouponError('');
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: couponCode, subtotal: total })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to apply coupon');
            
            setAppliedCoupon(data.code);
            setDiscountAmount(data.discountAmount);
            speak(`Coupon applied. You saved ${data.discountAmount} rupees.`);
        } catch (error) {
            setCouponError(error.message);
            speak("Invalid coupon code.");
        } finally {
            setApplyingCoupon(false);
        }
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponCode('');
    };

    const finalTotal = total - discountAmount;

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
            <div className="max-w-4xl mx-auto">

                {/* Stepper Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between relative px-4 md:px-12">
                        {/* Progress Line */}
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-200 -z-10" />
                        <div
                            className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 -z-10"
                            style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                        />

                        {steps.map((step) => {
                            const isActive = currentStep >= step.id;
                            const isCurrent = currentStep === step.id;
                            const Icon = step.icon;

                            return (
                                <div key={step.id} className="flex flex-col items-center gap-2 bg-gray-50 px-2">
                                    <div
                                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${isActive ? 'bg-primary text-white scale-110 shadow-lg' : 'bg-gray-200 text-gray-400'
                                            } ${isCurrent ? 'ring-4 ring-primary/20' : ''}`}
                                    >
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-xs font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-gray-400'}`}>
                                        {step.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    {/* Main Content Area */}
                    <div className="md:col-span-8 space-y-6">

                        {/* Step 1: Address */}
                        {currentStep === 1 && (
                            <div className="bg-white rounded-xl shadow-sm border border-border p-6 animate-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <MapPin className="text-primary w-5 h-5" />
                                    Shipping Address
                                </h2>
                                
                                {savedAddresses.length > 0 && (
                                    <div className="mb-6 space-y-2">
                                        <label className="text-sm font-medium">Saved Addresses</label>
                                        <select
                                            className="w-full p-2 border rounded-lg bg-gray-50 bg-white focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none cursor-pointer"
                                            value={selectedAddressId}
                                            onChange={e => {
                                                const id = e.target.value;
                                                setSelectedAddressId(id);
                                                if (id !== 'new') {
                                                    const addr = savedAddresses.find(a => a._id === id);
                                                    if (addr) {
                                                        setAddress({
                                                            name: addr.name,
                                                            street: addr.street,
                                                            city: addr.city,
                                                            pincode: addr.pincode,
                                                            phone: addr.phone
                                                        });
                                                    }
                                                } else {
                                                    setAddress({ name: user?.name || '', street: '', city: '', pincode: '', phone: '' });
                                                }
                                            }}
                                        >
                                            <option value="new">+ Add New Address</option>
                                            {savedAddresses.map(sa => (
                                                <option key={sa._id} value={sa._id}>
                                                    {sa.name} - {sa.street}, {sa.city} {sa.isDefault ? '(Default)' : ''}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Full Name</label>
                                        <input
                                            type="text"
                                            value={address.name}
                                            onChange={(e) => setAddress({ ...address, name: e.target.value })}
                                            className="w-full h-10 px-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Phone Number</label>
                                        <input
                                            type="text"
                                            value={address.phone}
                                            onChange={(e) => setAddress({ ...address, phone: e.target.value })}
                                            className="w-full h-10 px-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="text-sm font-medium">Street Address</label>
                                        <input
                                            type="text"
                                            value={address.street}
                                            onChange={(e) => setAddress({ ...address, street: e.target.value })}
                                            className="w-full h-10 px-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">City</label>
                                        <input
                                            type="text"
                                            value={address.city}
                                            onChange={(e) => setAddress({ ...address, city: e.target.value })}
                                            className="w-full h-10 px-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Pincode</label>
                                        <input
                                            type="text"
                                            value={address.pincode}
                                            onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                                            className="w-full h-10 px-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                        />
                                    </div>
                                </div>
                                <div className="mt-8 flex justify-end">
                                    <button onClick={handleNext} className="btn btn-primary px-8">Save & Continue</button>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Summary */}
                        {currentStep === 2 && (
                            <div className="bg-white rounded-xl shadow-sm border border-border p-6 animate-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <ShoppingBag className="text-primary w-5 h-5" />
                                    Order Summary
                                </h2>
                                <div className="space-y-4 mb-8">
                                    {cart.map((item) => (
                                        <div key={item.cartItemId} className="flex gap-4 p-4 border rounded-lg bg-gray-50/50">
                                            <div className="w-20 h-20 bg-white rounded-md border flex-shrink-0">
                                                <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold">{item.name}</h3>
                                                <p className="text-sm text-muted-foreground">{item.selectedOptions?.size && `Size: ${item.selectedOptions.size}`} {item.selectedOptions?.color && `• Color: ${item.selectedOptions.color}`}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                                    <span className="font-bold text-primary">₹{(item.price * item.quantity).toLocaleString()}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between pt-4 border-t">
                                    <button onClick={handleBack} className="text-gray-500 font-medium hover:text-gray-900">Back</button>
                                    <button onClick={handleNext} className="btn btn-primary px-8">Continue to Payment</button>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Payment */}
                        {currentStep === 3 && (
                            <div className="bg-white rounded-xl shadow-sm border border-border p-6 animate-in slide-in-from-right-4 duration-300">
                                <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
                                    <CreditCard className="text-primary w-5 h-5" />
                                    Select Payment Method
                                </h2>

                                <div className="space-y-3 mb-8">
                                    {/* Razorpay Secure Gateway */}
                                    <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'razorpay' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}>
                                        <div className="flex items-center gap-4">
                                            <input type="radio" name="payment" className="w-5 h-5 accent-primary" checked={paymentMethod === 'razorpay'} onChange={() => setPaymentMethod('razorpay')} />
                                            <div className="p-2 bg-white rounded-full border shadow-sm flex items-center justify-center">
                                                <ShieldCheck className="w-5 h-5 text-teal-600" />
                                            </div>
                                            <div className="flex-1">
                                                <span className="font-semibold block text-teal-800">Razorpay (Recommended)</span>
                                                <span className="text-xs text-muted-foreground">Securely pay via UPI, Credit/Debit cards, NetBanking</span>
                                            </div>
                                            <div className="text-xs font-bold text-teal-700 bg-teal-100 px-2 py-1 rounded">FAST</div>
                                        </div>
                                    </label>

                                    {/* UPI */}
                                    <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}>
                                        <div className="flex items-center gap-4">
                                            <input type="radio" name="payment" className="w-5 h-5 accent-primary" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                                            <div className="p-2 bg-white rounded-full border shadow-sm"><Smartphone className="w-5 h-5 text-purple-600" /></div>
                                            <div className="flex-1">
                                                <span className="font-semibold block">UPI</span>
                                                <span className="text-xs text-muted-foreground">Google Pay, PhonePe, Paytm</span>
                                            </div>
                                        </div>
                                    </label>

                                    {/* Card */}
                                    <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}>
                                        <div className="flex items-center gap-4">
                                            <input type="radio" name="payment" className="w-5 h-5 accent-primary" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                                            <div className="p-2 bg-white rounded-full border shadow-sm"><CreditCard className="w-5 h-5 text-blue-600" /></div>
                                            <div className="flex-1">
                                                <span className="font-semibold block">Credit / Debit Card</span>
                                                <span className="text-xs text-muted-foreground">Visa, Mastercard, RuPay</span>
                                            </div>
                                        </div>
                                    </label>

                                    {/* COD */}
                                    <label className={`block p-4 border rounded-xl cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:border-primary/50'}`}>
                                        <div className="flex items-center gap-4">
                                            <input type="radio" name="payment" className="w-5 h-5 accent-primary" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                                            <div className="p-2 bg-white rounded-full border shadow-sm"><Truck className="w-5 h-5 text-green-600" /></div>
                                            <div className="flex-1">
                                                <span className="font-semibold block">Cash on Delivery</span>
                                                <span className="text-xs text-muted-foreground">Pay when your order arrives</span>
                                            </div>
                                        </div>
                                    </label>
                                </div>

                                <div className="flex justify-between pt-4 border-t">
                                    <button onClick={handleBack} disabled={isProcessing} className="text-gray-500 font-medium hover:text-gray-900 disabled:opacity-50">Back</button>
                                    <button
                                        onClick={handlePlaceOrder}
                                        disabled={isProcessing}
                                        className="btn btn-primary px-8 py-3 text-lg shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all flex items-center gap-2"
                                    >
                                        {isProcessing && <Loader2 className="w-5 h-5 animate-spin" />}
                                        {isProcessing ? 'Processing...' : `Place Order - ₹${finalTotal.toLocaleString()}`}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Price Summary Sticky */}
                    <div className="md:col-span-4">
                        <div className="bg-white rounded-xl shadow-sm border border-border p-6 sticky top-24">
                            
                            {/* Coupon Code Section */}
                            <div className="mb-6 pb-6 border-b">
                                <h3 className="font-bold text-gray-800 mb-4">Have a Coupon?</h3>
                                {!appliedCoupon ? (
                                    <div className="space-y-2">
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                placeholder="Enter code"
                                                className="flex-1 p-2 border rounded-lg outline-none focus:border-primary uppercase"
                                                value={couponCode}
                                                onChange={e => setCouponCode(e.target.value.toUpperCase())}
                                            />
                                            <button 
                                                onClick={handleApplyCoupon}
                                                disabled={applyingCoupon || !couponCode.trim()}
                                                className="btn btn-outline px-4 disabled:opacity-50"
                                            >
                                                {applyingCoupon ? '...' : 'Apply'}
                                            </button>
                                        </div>
                                        {couponError && <p className="text-xs text-red-500">{couponError}</p>}
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                                        <div className="flex items-center gap-2 text-green-700">
                                            <ShieldCheck className="w-4 h-4" />
                                            <span className="font-medium text-sm">Code <span className="font-bold uppercase">{appliedCoupon}</span> applied</span>
                                        </div>
                                        <button onClick={handleRemoveCoupon} className="text-xs text-red-500 hover:underline">Remove</button>
                                    </div>
                                )}
                            </div>

                            <h3 className="font-bold text-gray-800 mb-4 pb-2 border-b">Price Details</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between text-gray-600">
                                    <span>Subtotal ({cart.length} items)</span>
                                    <span>₹{total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-gray-600">
                                    <span>Delivery Charges</span>
                                    <span className="text-green-600 font-medium">FREE</span>
                                </div>
                                {discountAmount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                        <span>Discount</span>
                                        <span>-₹{discountAmount.toLocaleString()}</span>
                                    </div>
                                )}
                                <div className="border-t border-dashed my-2 pt-3 flex justify-between font-bold text-lg text-gray-900">
                                    <span>Total Amount</span>
                                    <span>₹{finalTotal.toLocaleString()}</span>
                                </div>
                            </div>

                            <div className="mt-6 bg-green-50 p-3 rounded-lg flex items-start gap-2 text-xs text-green-700">
                                <ShieldCheck className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                <p>Safe and Secure Payments. 100% Authentic products.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
