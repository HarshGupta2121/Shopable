"use client";

import { useState, useEffect, useCallback } from 'react';
import { useVoice } from '@/context/VoiceContext';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { Check, CreditCard, Truck, ShieldCheck, Smartphone, MapPin, ShoppingBag, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Script from 'next/script';

export default function CheckoutPage() {
    const { speak, lastCommand, lastCommandId } = useVoice();
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

    // Card Details State
    const [cardDetails, setCardDetails] = useState({
        number: '',
        name: '',
        expiry: '',
        cvv: ''
    });
    const [focusedCardField, setFocusedCardField] = useState('');

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

        if (paymentMethod === 'card') {
            if (!cardDetails.number?.trim() || !cardDetails.name?.trim() || !cardDetails.expiry?.trim() || !cardDetails.cvv?.trim()) {
                speak("Please fill in all credit card fields to continue.");
                alert("Please fill in all credit card fields to continue.");
                return;
            }
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

    const triggerCouponApplyByCode = useCallback(async (code) => {
        if (!code.trim()) return;
        setApplyingCoupon(true);
        setCouponError('');
        try {
            const res = await fetch('/api/coupons/validate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ code: code, subtotal: total })
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
    }, [total, speak]);

    const handleApplyCoupon = () => {
        triggerCouponApplyByCode(couponCode);
    };

    const handleRemoveCoupon = () => {
        setAppliedCoupon(null);
        setDiscountAmount(0);
        setCouponCode('');
    };

    const processLocalVoiceCommand = useCallback((commandText) => {
        if (!commandText) return;
        const lower = commandText.toLowerCase();

        // 1. Navigation & Stepper Commands
        if (lower.includes('next') || lower.includes('continue') || lower.includes('save & continue') || lower.includes('aage badho') || lower.includes('samne jao') || lower.includes('go to summary') || lower.includes('continue to payment')) {
            handleNext();
            return;
        }
        if (lower.includes('back') || lower.includes('go back') || lower.includes('peeche jao')) {
            handleBack();
            return;
        }
        if (lower.includes('place order') || lower.includes('order place') || lower.includes('order confirm') || lower.includes('khareedo')) {
            handlePlaceOrder();
            return;
        }

        // 2. Select Payment Methods
        if (lower.includes('razorpay') || lower.includes('select razorpay')) {
            setPaymentMethod('razorpay');
            speak("Selected Razorpay payment method.");
            return;
        }
        if (lower.includes('cash on delivery') || lower.includes('cod') || lower.includes('cash delivery')) {
            setPaymentMethod('cod');
            speak("Selected Cash on Delivery.");
            return;
        }
        if (lower.includes('use card') || lower.includes('select card') || lower.includes('credit card') || lower.includes('debit card')) {
            setPaymentMethod('card');
            speak("Selected Credit or Debit card payment method.");
            return;
        }
        if (lower.includes('use upi') || lower.includes('select upi')) {
            setPaymentMethod('upi');
            speak("Selected UPI payment method.");
            return;
        }

        // 3. Address Field Voice Filling
        // Name
        const nameMatch = lower.match(/(?:my name|set name|naam is|naam ke liye|name is|name to|name)\s*(?:is|to)?\s+(.+)/i);
        if (nameMatch && nameMatch[1]) {
            const cleanVal = nameMatch[1].trim();
            setAddress(prev => ({ ...prev, name: cleanVal }));
            speak(`Name set to ${cleanVal}`);
            return;
        }

        // Phone
        const phoneMatch = lower.match(/(?:my phone|set phone|set contact|phone number|phone is|number is|number|phone)\s*(?:is|to)?\s+(.+)/i);
        if (phoneMatch && phoneMatch[1]) {
            const cleanVal = phoneMatch[1].replace(/\s+/g, '').trim();
            setAddress(prev => ({ ...prev, phone: cleanVal }));
            speak(`Phone set to ${cleanVal}`);
            return;
        }

        // Street Address
        const streetMatch = lower.match(/(?:my address|set address|set street|street is|street to|address is|address|street)\s*(?:is|to)?\s+(.+)/i);
        if (streetMatch && streetMatch[1]) {
            const cleanVal = streetMatch[1].trim();
            setAddress(prev => ({ ...prev, street: cleanVal }));
            speak(`Street address set to ${cleanVal}`);
            return;
        }

        // City
        const cityMatch = lower.match(/(?:my city|set city|city is|city to|city)\s*(?:is|to)?\s+(.+)/i);
        if (cityMatch && cityMatch[1]) {
            const cleanVal = cityMatch[1].trim();
            setAddress(prev => ({ ...prev, city: cleanVal }));
            speak(`City set to ${cleanVal}`);
            return;
        }

        // Pincode
        const pinMatch = lower.match(/(?:my pincode|set pincode|my pin|set pin|pincode is|pin is|pincode|pin)\s*(?:is|to)?\s+(\d+)/i);
        if (pinMatch && pinMatch[1]) {
            const cleanVal = pinMatch[1].trim();
            setAddress(prev => ({ ...prev, pincode: cleanVal }));
            speak(`Pincode set to ${cleanVal}`);
            return;
        }

        // Coupon Apply
        const couponMatch = lower.match(/(?:apply coupon|use coupon|coupon code|coupon)\s*(?:is|to)?\s+(.+)/i);
        if (couponMatch && couponMatch[1]) {
            const code = couponMatch[1].replace(/\s+/g, '').toUpperCase().trim();
            setCouponCode(code);
            triggerCouponApplyByCode(code);
            return;
        }

        // 4. Card Form Voice Filling (when Card payment is active)
        if (paymentMethod === 'card') {
            // Card Number
            const cardNoMatch = lower.match(/(?:card number|set card number|number is|number)\s*(?:is|to)?\s+(.+)/i);
            if (cardNoMatch && cardNoMatch[1]) {
                const cleanVal = cardNoMatch[1].replace(/\s+/g, '').trim();
                setCardDetails(prev => ({ ...prev, number: cleanVal }));
                speak("Card number set.");
                return;
            }
            // Card Expiry
            const cardExpMatch = lower.match(/(?:expiry|card expiry|expire date|expire)\s*(?:is|to)?\s+(.+)/i);
            if (cardExpMatch && cardExpMatch[1]) {
                let val = cardExpMatch[1].replace(/\s+/g, '').replace(/[^\d/]/g, '').trim();
                if (val.length === 4 && !val.includes('/')) {
                    val = val.substring(0, 2) + '/' + val.substring(2, 4);
                }
                setCardDetails(prev => ({ ...prev, expiry: val }));
                speak("Card expiry date set.");
                return;
            }
            // CVV
            const cvvMatch = lower.match(/(?:cvv|security code)\s*(?:is|to)?\s+(\d+)/i);
            if (cvvMatch && cvvMatch[1]) {
                const cleanVal = cvvMatch[1].trim();
                setCardDetails(prev => ({ ...prev, cvv: cleanVal }));
                speak("Card CVV set.");
                return;
            }
            // Card Name
            const cardNameMatch = lower.match(/(?:card name|cardholder|card holder|name on card)\s*(?:is|to)?\s+(.+)/i);
            if (cardNameMatch && cardNameMatch[1]) {
                const cleanVal = cardNameMatch[1].trim();
                setCardDetails(prev => ({ ...prev, name: cleanVal }));
                speak(`Cardholder name set to ${cleanVal}`);
                return;
            }
        }
    }, [handleNext, handleBack, handlePlaceOrder, paymentMethod, triggerCouponApplyByCode, speak]);

    useEffect(() => {
        if (lastCommand) {
            processLocalVoiceCommand(lastCommand);
        }
    }, [lastCommandId]);

    const getSuggestionChips = () => {
        switch (currentStep) {
            case 1:
                return [
                    { label: "Set name Harsh Gupta", command: "set name Harsh Gupta" },
                    { label: "Set street Connaught Place", command: "set street Connaught Place" },
                    { label: "Set city New Delhi", command: "set city New Delhi" },
                    { label: "Set pincode 110001", command: "set pincode 110001" },
                    { label: "Set phone 9876543210", command: "set phone 9876543210" },
                    { label: "Save & Continue", command: "save & continue" }
                ];
            case 2:
                return [
                    { label: "Apply coupon WELCOME10", command: "apply coupon WELCOME10" },
                    { label: "Continue to Payment", command: "continue to payment" },
                    { label: "Go back", command: "go back" }
                ];
            case 3:
                const base = [
                    { label: "Use Razorpay", command: "use razorpay" },
                    { label: "Use Cash on Delivery", command: "use cod" },
                    { label: "Use Card", command: "use card" },
                    { label: "Use UPI", command: "use upi" },
                    { label: "Go back", command: "go back" }
                ];
                if (paymentMethod === 'card') {
                    return [
                        { label: "Card Number 4321 5678 1234 5678", command: "card number 4321 5678 1234 5678" },
                        { label: "Expiry 12/28", command: "expiry 12/28" },
                        { label: "CVV 999", command: "cvv 999" },
                        { label: "Card Name Harsh Gupta", command: "card name Harsh Gupta" },
                        { label: "Place Order", command: "place order" },
                        ...base
                    ];
                }
                return base;
            default:
                return [];
        }
    };

    const handleSuggestionClick = (command) => {
        processLocalVoiceCommand(command);
    };

    const formatCardNumber = (value) => {
        const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
        const matches = v.match(/\d{4,16}/g);
        const match = (matches && matches[0]) || '';
        const parts = [];

        for (let i = 0, len = match.length; i < len; i += 4) {
            parts.push(match.substring(i, i + 4));
        }

        if (parts.length > 0) {
            return parts.join(' ');
        } else {
            return v;
        }
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
                                    <div className="space-y-2">
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

                                        {paymentMethod === 'card' && (
                                            <div className="p-5 border border-border rounded-xl bg-gray-50/50 dark:bg-slate-900/30 space-y-6 mt-2 animate-in slide-in-from-top-4 duration-300">
                                                {/* 3D Card Visualizer Container */}
                                                <div className="flex justify-center py-4">
                                                    <div className="w-80 h-48 [perspective:1000px]">
                                                        <div 
                                                            className={`relative w-full h-full rounded-2xl shadow-xl transition-all duration-700 [transform-style:preserve-3d] ${
                                                                focusedCardField === 'cvv' ? '[transform:rotateY(180deg)]' : ''
                                                            }`}
                                                        >
                                                            {/* Front Face */}
                                                            <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-teal-800 to-cyan-900 p-6 text-white flex flex-col justify-between [backface-visibility:hidden] overflow-hidden border border-teal-700/50">
                                                                <div className="absolute -right-10 -top-10 w-32 h-32 bg-cyan-700/20 rounded-full blur-2xl" />
                                                                <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-teal-600/20 rounded-full blur-2xl" />
                                                                
                                                                <div className="flex justify-between items-start z-10">
                                                                    <div>
                                                                        <p className="text-[10px] uppercase tracking-widest text-teal-200">Shopable Card</p>
                                                                        <div className="w-10 h-8 bg-amber-400/80 rounded-md mt-2 flex items-center justify-center opacity-90 border border-amber-300/30">
                                                                            <div className="w-6 h-5 border border-amber-500/30 rounded flex flex-wrap" />
                                                                        </div>
                                                                    </div>
                                                                    <span className="font-bold italic text-lg tracking-wider text-teal-100">VISA</span>
                                                                </div>
                                                                
                                                                <div className="my-2 z-10">
                                                                    <p className="text-xl font-mono tracking-[0.2em] font-medium text-center">
                                                                        {cardDetails.number ? formatCardNumber(cardDetails.number) : '•••• •••• •••• ••••'}
                                                                    </p>
                                                                </div>
                                                                
                                                                <div className="flex justify-between items-end z-10">
                                                                    <div className="max-w-[70%]">
                                                                        <p className="text-[8px] uppercase tracking-widest text-teal-300">Cardholder Name</p>
                                                                        <p className="text-sm font-semibold truncate uppercase tracking-wider">
                                                                            {cardDetails.name || 'YOUR NAME'}
                                                                        </p>
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[8px] uppercase tracking-widest text-teal-300">Expires</p>
                                                                        <p className="text-sm font-semibold tracking-wider">
                                                                            {cardDetails.expiry || 'MM/YY'}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Back Face */}
                                                            <div className="absolute inset-0 w-full h-full rounded-2xl bg-gradient-to-br from-cyan-950 to-slate-900 text-white flex flex-col justify-between [backface-visibility:hidden] [transform:rotateY(180deg)] border border-slate-800">
                                                                <div className="w-full h-10 bg-slate-950 mt-4" />
                                                                <div className="px-6 flex flex-col gap-2">
                                                                    <p className="text-[8px] uppercase tracking-widest text-slate-400 text-right">Authorized Signature</p>
                                                                    <div className="w-full h-10 bg-slate-100 rounded flex items-center justify-end px-3">
                                                                        <span className="text-slate-800 font-mono tracking-wider pr-2 font-bold italic line-through select-none">Shopable</span>
                                                                        <span className="text-slate-900 font-mono font-bold bg-amber-100 px-2 py-0.5 rounded shadow-inner text-sm">
                                                                            {cardDetails.cvv || '•••'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                <div className="p-6 flex justify-between items-center text-[9px] text-slate-500">
                                                                    <span>Not valid without signature</span>
                                                                    <span className="font-bold italic text-slate-400">VISA</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Manual Card Fields Form */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Card Number</label>
                                                        <input
                                                            type="text"
                                                            maxLength={19}
                                                            placeholder="1234 5678 1234 5678"
                                                            value={formatCardNumber(cardDetails.number)}
                                                            onChange={(e) => {
                                                                const raw = e.target.value.replace(/\s+/g, '');
                                                                if (/^\d*$/.test(raw)) {
                                                                    setCardDetails({ ...cardDetails, number: raw });
                                                                }
                                                            }}
                                                            onFocus={() => setFocusedCardField('number')}
                                                            onBlur={() => setFocusedCardField('')}
                                                            className="w-full h-10 px-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Cardholder Name</label>
                                                        <input
                                                            type="text"
                                                            placeholder="John Doe"
                                                            value={cardDetails.name}
                                                            onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                                                            onFocus={() => setFocusedCardField('name')}
                                                            onBlur={() => setFocusedCardField('')}
                                                            className="w-full h-10 px-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">Expiry Date</label>
                                                        <input
                                                            type="text"
                                                            maxLength={5}
                                                            placeholder="MM/YY"
                                                            value={cardDetails.expiry}
                                                            onChange={(e) => {
                                                                let val = e.target.value.replace(/[^\d/]/g, '');
                                                                if (val.length === 2 && !val.includes('/') && cardDetails.expiry.length < 2) {
                                                                    val = val + '/';
                                                                }
                                                                setCardDetails({ ...cardDetails, expiry: val });
                                                            }}
                                                            onFocus={() => setFocusedCardField('expiry')}
                                                            onBlur={() => setFocusedCardField('')}
                                                            className="w-full h-10 px-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-sm font-medium">CVV</label>
                                                        <input
                                                            type="password"
                                                            maxLength={3}
                                                            placeholder="•••"
                                                            value={cardDetails.cvv}
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                if (/^\d*$/.test(val)) {
                                                                    setCardDetails({ ...cardDetails, cvv: val });
                                                                }
                                                            }}
                                                            onFocus={() => setFocusedCardField('cvv')}
                                                            onBlur={() => setFocusedCardField('')}
                                                            className="w-full h-10 px-3 border rounded-lg focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>

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

                {/* Voice Assistant Suggestion Bar */}
                <div className="mt-8 bg-teal-50/60 dark:bg-slate-900/60 backdrop-blur-md rounded-2xl border border-teal-100/50 dark:border-slate-800 p-5 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-2.5 h-2.5 bg-teal-500 rounded-full animate-pulse" />
                        <h4 className="text-sm font-bold text-teal-800 dark:text-teal-300 uppercase tracking-wider">Voice Control Helper</h4>
                    </div>
                    <p className="text-xs text-teal-600 dark:text-teal-400 mb-4">
                        You can speak these commands or click them directly to perform actions:
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {getSuggestionChips().map((chip, idx) => (
                            <button
                                key={idx}
                                onClick={() => handleSuggestionClick(chip.command)}
                                className="px-3.5 py-1.5 bg-white dark:bg-slate-800 text-teal-800 dark:text-teal-200 text-xs font-semibold rounded-full border border-teal-100 dark:border-slate-700 hover:bg-teal-50 dark:hover:bg-slate-700 hover:border-teal-200 dark:hover:border-slate-600 transition-all duration-200 flex items-center gap-1.5 shadow-sm active:scale-95 text-left"
                            >
                                <span className="text-teal-400">“</span>
                                {chip.label}
                                <span className="text-teal-400">”</span>
                            </button>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}
