/* eslint-disable @next/next/no-img-element */
"use client";

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, CreditCard, ShoppingBag, Package, Truck, CheckCircle2, AlertCircle, Loader2, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import { useVoice } from '@/context/VoiceContext';

export default function OrderDetailsPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const { speak } = useVoice();
    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${id}`);
                if (!res.ok) {
                    if (res.status === 404) throw new Error("Order not found");
                    if (res.status === 403) throw new Error("Access denied");
                    throw new Error("Failed to load order");
                }
                const data = await res.json();
                setOrder(data);
                speak(`Showing details for order ${id.slice(-4)}`);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchOrder();
    }, [id, speak]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
                <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                <h1 className="text-xl font-bold text-gray-800 mb-2">Error Loading Order</h1>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link href="/account" className="btn btn-primary">Back to Account</Link>
            </div>
        );
    }

    if (!order) return null;

    const steps = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
    const currentStepIndex = steps.indexOf(order.status) !== -1 ? steps.indexOf(order.status) : 0;
    const isCancelled = order.status === 'Cancelled';

    const handleDownloadInvoice = () => {
        try {
            const doc = new jsPDF();
            
            // Header
            doc.setFontSize(22);
            doc.text('INVOICE', 20, 20);
            
            doc.setFontSize(12);
            doc.text(`Order ID: ${order._id}`, 20, 30);
            doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 20, 36);
            
            // Company Info
            doc.setFontSize(10);
            doc.text('My Dreem Store', 140, 20);
            doc.text('info@mydreem.com', 140, 26);
            
            // Billing / Shipping
            doc.setFontSize(14);
            doc.text('Bill To:', 20, 50);
            doc.setFontSize(11);
            doc.text(order.shippingAddress.name, 20, 56);
            doc.text(order.shippingAddress.street, 20, 62);
            doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.pincode}`, 20, 68);
            doc.text(`Phone: ${order.shippingAddress.phone}`, 20, 74);
            
            // Items Table Header
            let y = 90;
            doc.setFillColor(240, 240, 240);
            doc.rect(20, y-6, 170, 8, 'F');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('Item', 22, y);
            doc.text('Qty', 130, y);
            doc.text('Price', 150, y);
            doc.text('Total', 170, y);
            
            doc.setFont('helvetica', 'normal');
            y += 10;
            
            // Items
            order.items.forEach(item => {
                const name = item.name.length > 40 ? item.name.substring(0, 40) + '...' : item.name;
                doc.text(name, 22, y);
                doc.text(item.quantity.toString(), 132, y);
                doc.text(item.price.toString(), 152, y);
                doc.text((item.price * item.quantity).toString(), 172, y);
                y += 8;
            });
            
            // Totals
            y += 10;
            doc.line(130, y-4, 190, y-4);
            
            // Subtotal
            if (order.subtotal) {
                doc.text('Subtotal:', 140, y);
                doc.text(order.subtotal.toString(), 172, y);
                y += 6;
            }
            
            // Discount
            if (order.discountAmount > 0) {
                doc.text(`Discount (${order.couponApplied || ''}):`, 140, y);
                doc.text(`-${order.discountAmount.toString()}`, 172, y);
                y += 6;
            }
            
            // Final Total
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('Total (INR):', 140, y);
            doc.text(order.total.toString(), 172, y);
            
            // Footer
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.text('Thank you for your business!', 105, 280, null, null, 'center');
            
            doc.save(`Invoice_${order._id.slice(-6).toUpperCase()}.pdf`);
            speak("Invoice downloaded.");
        } catch (error) {
            console.error("PDF generation failed", error);
            speak("Failed to generate invoice.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/account" className="p-2 hover:bg-white rounded-full transition-colors">
                            <ArrowLeft className="w-5 h-5 text-gray-600" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Order Details</h1>
                            <p className="text-sm text-muted-foreground">ID: #{order._id}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleDownloadInvoice}
                        className="btn btn-outline flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Download Invoice
                    </button>
                </div>

                {/* Status Card */}
                <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="font-bold text-lg flex items-center gap-2">
                            <Package className="w-5 h-5 text-primary" />
                            Order Status
                        </h2>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-700' :
                                order.status === 'Cancelled' ? 'bg-red-100 text-red-700' :
                                    'bg-blue-100 text-blue-700'
                            }`}>
                            {order.status}
                        </span>
                    </div>

                    {!isCancelled && (
                        <div className="relative flex justify-between">
                            <div className="absolute top-1/2 left-0 w-full h-1 bg-gray-100 -z-10 -translate-y-1/2" />
                            <div
                                className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 transition-all duration-500"
                                style={{ width: `${(currentStepIndex / (steps.length - 1)) * 100}%` }}
                            />

                            {steps.map((step, idx) => {
                                const isCompleted = idx <= currentStepIndex;
                                return (
                                    <div key={step} className="flex flex-col items-center gap-2 bg-white px-2">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isCompleted ? 'bg-primary border-primary text-white' : 'bg-white border-gray-200 text-gray-300'
                                            }`}>
                                            {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <div className="w-2 h-2 rounded-full bg-gray-200" />}
                                        </div>
                                        <span className={`text-xs font-medium ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step}</span>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Items */}
                <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                    <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                        <ShoppingBag className="w-5 h-5 text-primary" />
                        Items ({order.items.length})
                    </h2>
                    <div className="space-y-4">
                        {order.items.map((item, index) => (
                            <div key={index} className="flex gap-4 py-4 border-b last:border-0 hover:bg-gray-50/50 rounded-lg p-2 transition-colors">
                                <Link href={`/shop/${item.productId}`} className="w-16 h-16 bg-gray-100 rounded-md border flex-shrink-0">
                                    <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                                </Link>
                                <div className="flex-1">
                                    <Link href={`/shop/${item.productId}`} className="font-medium hover:text-primary transition-colors">
                                        {item.name}
                                    </Link>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        {item.selectedOptions?.size && `Size: ${item.selectedOptions.size}`}
                                        {item.selectedOptions?.color && ` • Color: ${item.selectedOptions.color}`}
                                    </p>
                                    <div className="flex justify-between items-center mt-2">
                                        <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                                        <p className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Shipping & Payment Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Shipping Address */}
                    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                        <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                            <MapPin className="w-5 h-5 text-primary" />
                            Shipping Address
                        </h2>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p className="font-bold text-gray-900">{order.shippingAddress.name}</p>
                            <p>{order.shippingAddress.street}</p>
                            <p>{order.shippingAddress.city}, {order.shippingAddress.pincode}</p>
                            <p className="mt-2 text-gray-500">Phone: {order.shippingAddress.phone}</p>
                        </div>
                    </div>

                    {/* Payment Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-border p-6">
                        <h2 className="font-bold text-lg flex items-center gap-2 mb-4">
                            <CreditCard className="w-5 h-5 text-primary" />
                            Payment Details
                        </h2>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Method</span>
                                <span className="font-medium uppercase">{order.paymentMethod}</span>
                            </div>
                            
                            {(order.subtotal || order.discountAmount > 0) && (
                                <>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium">₹{(order.subtotal || order.total).toLocaleString()}</span>
                                    </div>
                                    {order.discountAmount > 0 && (
                                        <div className="flex justify-between text-sm text-green-600">
                                            <span>Discount {order.couponApplied ? `(${order.couponApplied})` : ''}</span>
                                            <span className="font-medium">-₹{order.discountAmount.toLocaleString()}</span>
                                        </div>
                                    )}
                                </>
                            )}
                            
                            <div className="flex justify-between font-bold pt-2 border-t">
                                <span className="text-gray-900">Order Total</span>
                                <span className="text-lg text-primary">₹{order.total.toLocaleString()}</span>
                            </div>
                            <div className="flex items-center gap-2 mt-4 text-xs text-green-700 bg-green-50 p-2 rounded">
                                <CheckCircle2 className="w-4 h-4" />
                                <span>Payment Verified</span>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
