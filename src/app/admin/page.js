"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
    LayoutDashboard, Package, Users as UsersIcon, ShoppingCart, 
    DollarSign, ShoppingBag, TrendingUp, Edit, Trash2, Plus, X, Loader2,
    Download, BarChart3, Calendar, FileText, CheckCircle, Clock, XCircle
} from 'lucide-react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend, BarChart, Bar
} from 'recharts';
import { jsPDF } from 'jspdf';

export default function AdminDashboard() {
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const router = useRouter();
    const [mounted, setMounted] = useState(false);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [data, setData] = useState({ stats: null, products: [], users: [], orders: [] });
    const [loading, setLoading] = useState({ dashboard: true, products: true, users: true, orders: true });

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!authLoading && mounted) {
            if (!isAuthenticated || user?.role !== 'admin') {
                router.push('/');
            } else {
                fetchTabContent(activeTab);
            }
        }
    }, [isAuthenticated, authLoading, mounted, activeTab, user]);

    const fetchTabContent = async (tab) => {
        setLoading(prev => ({ ...prev, [tab]: true }));
        try {
            let res;
            if (tab === 'dashboard') {
                res = await fetch('/api/admin/stats');
                if (res.ok) {
                    const stats = await res.json();
                    setData(prev => ({ ...prev, stats }));
                }
            } else if (tab === 'products') {
                res = await fetch('/api/products?limit=1000');
                if (res.ok) {
                    const products = await res.json();
                    setData(prev => ({ ...prev, products }));
                }
            } else if (tab === 'users') {
                res = await fetch('/api/admin/users');
                if (res.ok) {
                    const users = await res.json();
                    setData(prev => ({ ...prev, users }));
                }
            } else if (tab === 'orders') {
                res = await fetch('/api/admin/orders');
                if (res.ok) {
                    const orders = await res.json();
                    setData(prev => ({ ...prev, orders }));
                }
            }
        } catch (error) {
            console.error(`Failed to fetch ${tab}:`, error);
        } finally {
            setLoading(prev => ({ ...prev, [tab]: false }));
        }
    };

    if (!mounted || authLoading || !user || user.role !== 'admin') {
        return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    }

    const tabs = [
        { id: 'dashboard', name: 'Overview', icon: LayoutDashboard },
        { id: 'products', name: 'Products', icon: Package },
        { id: 'orders', name: 'Orders', icon: ShoppingCart },
        { id: 'users', name: 'Customers', icon: UsersIcon },
    ];

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-background flex flex-col md:flex-row transition-colors duration-300">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white dark:bg-card border-r dark:border-border h-auto md:h-screen sticky top-0 p-4 shrink-0 transition-colors duration-300">
                <div className="mb-8 hidden md:block">
                    <h2 className="text-2xl font-bold text-primary dark:text-teal-400">Admin Panel</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Welcome, {user.name}</p>
                </div>
                <nav className="flex md:flex-col gap-2 overflow-x-auto md:overflow-visible">
                    {tabs.map(tab => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                                    isActive 
                                        ? 'bg-primary text-white dark:bg-primary dark:text-white shadow-md' 
                                        : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800'
                                }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.name}
                            </button>
                        );
                    })}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                {activeTab === 'dashboard' && <DashboardTab loading={loading.dashboard} stats={data.stats} />}
                {activeTab === 'products' && <ProductsTab loading={loading.products} products={data.products} onRefresh={() => fetchTabContent('products')} />}
                {activeTab === 'users' && <UsersTab loading={loading.users} users={data.users} />}
                {activeTab === 'orders' && <OrdersTab loading={loading.orders} orders={data.orders} onRefresh={() => fetchTabContent('orders')} />}
            </main>
        </div>
    );
}

// ---------------------- PDF REPORT GENERATORS ----------------------

const generateSalesReportPDF = (stats) => {
    const doc = new jsPDF();
    
    // Header banner
    doc.setFillColor(15, 118, 110); // Teal 700
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text("SHOPABLE STORE REPORT", 14, 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);
    
    // Summary Cards (Grid Layout)
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Key Performance Indicators (KPIs)", 14, 60);
    
    doc.setDrawColor(220, 220, 220);
    
    // Revenue Box
    doc.setFillColor(245, 247, 247);
    doc.rect(14, 66, 42, 28, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 110, 110);
    doc.text("TOTAL REVENUE", 18, 73);
    doc.setFontSize(12);
    doc.setTextColor(15, 118, 110); // Teal 700
    doc.text(`INR ${stats.revenue?.toLocaleString() || 0}`, 18, 85);
    
    // Orders Box
    doc.setFillColor(245, 247, 247);
    doc.rect(62, 66, 42, 28, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 110, 110);
    doc.text("TOTAL ORDERS", 66, 73);
    doc.setFontSize(12);
    doc.setTextColor(37, 99, 235); // Blue 600
    doc.text(`${stats.orders || 0}`, 66, 85);
    
    // Products Box
    doc.setFillColor(245, 247, 247);
    doc.rect(110, 66, 42, 28, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 110, 110);
    doc.text("TOTAL PRODUCTS", 114, 73);
    doc.setFontSize(12);
    doc.setTextColor(217, 119, 6); // Amber 600
    doc.text(`${stats.products || 0}`, 114, 85);
    
    // Users Box
    doc.setFillColor(245, 247, 247);
    doc.rect(158, 66, 42, 28, 'FD');
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 110, 110);
    doc.text("TOTAL CUSTOMERS", 162, 73);
    doc.setFontSize(12);
    doc.setTextColor(147, 51, 234); // Purple 600
    doc.text(`${stats.users || 0}`, 162, 85);

    // Sales Trend Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text("Last 7 Days Sales Trend", 14, 110);
    
    // Table headers
    doc.setFillColor(230, 235, 235);
    doc.rect(14, 116, 182, 8, 'F');
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 40, 40);
    doc.text("Date", 18, 121);
    doc.text("Revenue", 100, 121);
    doc.text("Orders", 160, 121);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 70, 70);
    let currentY = 130;
    if (stats.salesOverTime && stats.salesOverTime.length > 0) {
        stats.salesOverTime.forEach((day, index) => {
            if (index % 2 === 1) {
                doc.setFillColor(248, 250, 250);
                doc.rect(14, currentY - 4, 182, 7, 'F');
            }
            doc.text(`${day.date}`, 18, currentY);
            doc.text(`INR ${day.revenue?.toLocaleString()}`, 100, currentY);
            doc.text(`${day.orders}`, 160, currentY);
            currentY += 7;
        });
    }
    
    // Recent Activity Table
    currentY += 12;
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text("Recent Activity (Latest Orders)", 14, currentY);
    currentY += 6;
    
    doc.setFillColor(230, 235, 235);
    doc.rect(14, currentY, 182, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(30, 40, 40);
    doc.text("Order ID", 18, currentY + 5);
    doc.text("Customer", 80, currentY + 5);
    doc.text("Amount", 140, currentY + 5);
    doc.text("Status", 170, currentY + 5);
    
    currentY += 13;
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 70, 70);
    if (stats.recentOrders && stats.recentOrders.length > 0) {
        stats.recentOrders.forEach((o, index) => {
            if (index % 2 === 1) {
                doc.setFillColor(248, 250, 250);
                doc.rect(14, currentY - 4, 182, 7, 'F');
            }
            doc.setFontSize(7.5);
            doc.setFont('courier', 'normal');
            doc.text(`${o._id}`, 18, currentY);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);
            doc.text(`${o.user?.name || 'Guest'}`, 80, currentY);
            doc.text(`INR ${o.total?.toLocaleString()}`, 140, currentY);
            doc.text(`${o.status}`, 170, currentY);
            currentY += 7;
        });
    } else {
        doc.text("No orders found.", 18, currentY);
    }
    
    doc.save(`Shopable_Sales_Report_${new Date().toISOString().split('T')[0]}.pdf`);
};

const generateOrderInvoicePDF = (order) => {
    const doc = new jsPDF();
    
    // Header Banner
    doc.setFillColor(15, 118, 110); // Teal 700
    doc.rect(0, 0, 210, 45, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.text("SHOPABLE INVOICE", 14, 25);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("Thank you for shopping with us!", 14, 34);
    
    // Invoice Metadata (Top Right)
    doc.setFont('helvetica', 'bold');
    doc.text(`Order ID: #${order._id.slice(-6).toUpperCase()}`, 140, 20);
    doc.setFont('helvetica', 'normal');
    doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString()}`, 140, 27);
    doc.text(`Status: ${order.status || 'Processing'}`, 140, 34);
    
    // Billing & Shipping Info
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text("Shipping Address", 14, 60);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const addr = order.shippingAddress || {};
    doc.text(`${addr.name || 'N/A'}`, 14, 67);
    doc.text(`${addr.street || ''}`, 14, 73);
    doc.text(`${addr.city || ''} - ${addr.pincode || ''}`, 14, 79);
    doc.text(`Phone: ${addr.phone || 'N/A'}`, 14, 85);
    
    // Payment info
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("Payment Information", 120, 60);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`Method: ${order.paymentMethod?.toUpperCase() || 'COD'}`, 120, 67);
    doc.text(`Status: ${order.paymentStatus || 'Pending'}`, 120, 73);

    // Items table
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text("Items Summary", 14, 105);
    
    // Table headers
    doc.setFillColor(230, 235, 235);
    doc.rect(14, 111, 182, 8, 'F');
    doc.setFontSize(9);
    doc.setTextColor(30, 40, 40);
    doc.text("Item Name", 18, 116);
    doc.text("Qty", 120, 116);
    doc.text("Price", 145, 116);
    doc.text("Total", 175, 116);
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 70, 70);
    let currentY = 126;
    
    if (order.items && order.items.length > 0) {
        order.items.forEach((item, index) => {
            if (index % 2 === 1) {
                doc.setFillColor(248, 250, 250);
                doc.rect(14, currentY - 4, 182, 7, 'F');
            }
            let itemName = item.name;
            if (itemName.length > 50) itemName = itemName.substring(0, 47) + '...';
            
            doc.text(itemName, 18, currentY);
            doc.text(`${item.quantity}`, 120, currentY);
            doc.text(`₹${item.price}`, 145, currentY);
            doc.text(`₹${item.price * item.quantity}`, 175, currentY);
            currentY += 7;
        });
    }
    
    // Horizontal Line separator
    doc.setDrawColor(220, 225, 225);
    doc.line(14, currentY + 3, 196, currentY + 3);
    
    currentY += 12;
    
    // Calculations
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text("Subtotal:", 130, currentY);
    doc.text(`₹${(order.subtotal || order.total).toLocaleString()}`, 170, currentY);
    
    if (order.discountAmount > 0) {
        currentY += 6;
        doc.setTextColor(15, 118, 110);
        doc.text(`Discount (${order.couponApplied || 'Coupon'}):`, 130, currentY);
        doc.text(`- ₹${order.discountAmount.toLocaleString()}`, 170, currentY);
        doc.setTextColor(60, 70, 70);
    }
    
    currentY += 8;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 118, 110); // Teal 700
    doc.text("Total Paid:", 130, currentY);
    doc.text(`₹${order.total?.toLocaleString()}`, 170, currentY);
    
    // Save invoice
    doc.save(`Invoice_${order._id.slice(-6).toUpperCase()}.pdf`);
};

// ---------------------- TAB COMPONENTS ----------------------

function DashboardTab({ loading, stats }) {
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    const PIE_COLORS = ['#f59e0b', '#3b82f6', '#6366f1', '#10b981', '#ef4444'];

    return (
        <div className="space-y-8 animate-in fade-in duration-300">
            {/* Header with Download Report */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400">Live statistics and sales analytics</p>
                </div>
                <button
                    onClick={() => stats && generateSalesReportPDF(stats)}
                    disabled={!stats}
                    className="btn btn-primary flex items-center gap-2 shadow-md self-start md:self-auto disabled:opacity-50"
                >
                    <Download className="w-4 h-4" /> Download Sales Report
                </button>
            </div>
            
            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                <StatCard icon={DollarSign} title="Total Revenue" value={`₹${stats?.revenue?.toLocaleString() || 0}`} color="bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400" />
                <StatCard icon={ShoppingBag} title="Total Orders" value={stats?.orders || 0} color="bg-blue-100 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400" />
                <StatCard icon={Package} title="Total Products" value={stats?.products || 0} color="bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400" />
                <StatCard icon={UsersIcon} title="Total Users" value={stats?.users || 0} color="bg-purple-100 text-purple-600 dark:bg-purple-950/30 dark:text-purple-400" />
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Revenue Trend AreaChart */}
                <div className="lg:col-span-2 bg-white dark:bg-card p-6 rounded-xl border border-gray-100 dark:border-border shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-primary" /> Sales Trend (Last 7 Days)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={stats?.salesOverTime || []} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0f766e" stopOpacity={0.3}/>
                                        <stop offset="95%" stopColor="#0f766e" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-slate-800" />
                                <XAxis dataKey="date" className="text-xs fill-gray-500 dark:fill-gray-400" axisLine={false} tickLine={false} />
                                <YAxis className="text-xs fill-gray-500 dark:fill-gray-400" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                                <Tooltip 
                                    contentStyle={{ 
                                        backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                                        border: 'none', 
                                        borderRadius: '8px',
                                        color: '#fff'
                                    }}
                                    formatter={(value, name) => [name === 'revenue' ? `₹${value}` : value, name === 'revenue' ? 'Revenue' : 'Orders']}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#0f766e" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" name="revenue" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Order Status PieChart */}
                <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-100 dark:border-border shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5 text-primary" /> Order Statuses
                    </h3>
                    <div className="h-[240px] w-full flex-1 relative">
                        {stats?.statusData && stats.statusData.some(d => d.value > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={stats.statusData.filter(d => d.value > 0)}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={4}
                                        dataKey="value"
                                    >
                                        {stats.statusData.filter(d => d.value > 0).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                                            border: 'none', 
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">No active orders</div>
                        )}
                    </div>
                    {/* Pie Legend custom */}
                    <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                        {stats?.statusData && stats.statusData.map((item, idx) => (
                            <div key={item.name} className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                                <span className="truncate">{item.name} ({item.value})</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Category Sales Breakdown BarChart */}
                <div className="bg-white dark:bg-card p-6 rounded-xl border border-gray-100 dark:border-border shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-6 flex items-center gap-2">
                        <Package className="w-5 h-5 text-primary" /> Sales by Category
                    </h3>
                    <div className="h-[250px] w-full">
                        {stats?.categoryData && stats.categoryData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={stats.categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100 dark:stroke-slate-800" />
                                    <XAxis dataKey="name" className="text-xs fill-gray-500 dark:fill-gray-400" axisLine={false} tickLine={false} />
                                    <YAxis className="text-xs fill-gray-500 dark:fill-gray-400" axisLine={false} tickLine={false} tickFormatter={(val) => `₹${val}`} />
                                    <Tooltip 
                                        contentStyle={{ 
                                            backgroundColor: 'rgba(15, 23, 42, 0.9)', 
                                            border: 'none', 
                                            borderRadius: '8px',
                                            color: '#fff'
                                        }}
                                        formatter={(value) => [`₹${value}`, 'Sales']}
                                    />
                                    <Bar dataKey="value" fill="#0f766e" radius={[4, 4, 0, 0]} barSize={35} />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">No category sales data</div>
                        )}
                    </div>
                </div>

                {/* Recent Orders table */}
                <div className="lg:col-span-2 bg-white dark:bg-card p-6 rounded-xl border border-gray-100 dark:border-border shadow-sm overflow-hidden flex flex-col">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-slate-100 mb-4 flex items-center gap-2">
                        <FileText className="w-5 h-5 text-primary" /> Recent Orders
                    </h3>
                    <div className="flex-1 overflow-x-auto min-h-[250px]">
                        <table className="w-full text-left text-sm whitespace-nowrap">
                            <thead>
                                <tr className="border-b dark:border-slate-800 text-gray-500 dark:text-gray-400 font-semibold">
                                    <th className="pb-3 font-semibold">Customer</th>
                                    <th className="pb-3 font-semibold">Amount</th>
                                    <th className="pb-3 font-semibold">Status</th>
                                    <th className="pb-3 font-semibold">Invoice</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {stats?.recentOrders && stats.recentOrders.length > 0 ? (
                                    stats.recentOrders.map(o => (
                                        <tr key={o._id} className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20">
                                            <td className="py-3 font-medium text-gray-900 dark:text-gray-100">
                                                {o.user?.name || 'Guest'}
                                                <div className="text-xs font-normal text-gray-400">{o.user?.email || ''}</div>
                                            </td>
                                            <td className="py-3 text-green-600 dark:text-green-400 font-bold">₹{o.total?.toLocaleString()}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                                    o.status === 'Delivered' ? 'bg-green-100 text-green-700 dark:bg-green-950/30 dark:text-green-400' :
                                                    o.status === 'Cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400' :
                                                    'bg-amber-100 text-amber-700 dark:bg-amber-950/30 dark:text-amber-400'
                                                }`}>
                                                    {o.status || 'Processing'}
                                                </span>
                                            </td>
                                            <td className="py-3">
                                                <button
                                                    onClick={() => generateOrderInvoicePDF(o)}
                                                    className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-primary"
                                                    title="Download Invoice"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="py-8 text-center text-gray-400 dark:text-gray-500">No recent orders.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ icon: Icon, title, value, color }) {
    return (
        <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-100 dark:border-border flex items-center gap-4 transition-colors">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 ${color.split(' ')[0]}`}>
                <Icon className={`w-7 h-7 ${color.split(' ')[1]}`} />
            </div>
            <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{value}</h3>
            </div>
        </div>
    );
}

function ProductsTab({ loading, products, onRefresh }) {
    const [isEditing, setIsEditing] = useState(false);
    const [currentProduct, setCurrentProduct] = useState(null);

    const handleSave = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const productData = Object.fromEntries(formData.entries());
        // Simple type conversions
        productData.price = Number(productData.price);
        productData.originalPrice = Number(productData.originalPrice);
        productData.rating = Number(productData.rating);
        productData.reviews = Number(productData.reviews);
        
        try {
            const method = productData._id ? 'PUT' : 'POST';
            const url = productData._id ? `/api/products/${productData._id}` : '/api/products';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData)
            });
            if (res.ok) {
                setIsEditing(false);
                onRefresh();
            } else {
                alert('Failed to save product');
            }
        } catch (err) {
            alert('Error saving product');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this product?')) return;
        try {
            const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
            if (res.ok) onRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && !products.length) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    if (isEditing) {
        return (
            <div className="bg-white dark:bg-card p-6 rounded-xl shadow-sm border border-gray-100 dark:border-border transition-colors">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-slate-100">{currentProduct ? 'Edit Product' : 'Add New Product'}</h2>
                    <button onClick={() => setIsEditing(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <form onSubmit={handleSave} className="space-y-4">
                    {currentProduct && <input type="hidden" name="_id" value={currentProduct._id} />}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Name</label>
                            <input required name="name" defaultValue={currentProduct?.name} className="w-full border dark:border-gray-700 bg-transparent rounded-md p-2 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Category</label>
                            <input required name="category" defaultValue={currentProduct?.category} className="w-full border dark:border-gray-700 bg-transparent rounded-md p-2 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Price (₹)</label>
                            <input required type="number" name="price" defaultValue={currentProduct?.price} className="w-full border dark:border-gray-700 bg-transparent rounded-md p-2 dark:text-white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Original Price (₹)</label>
                            <input required type="number" name="originalPrice" defaultValue={currentProduct?.originalPrice} className="w-full border dark:border-gray-700 bg-transparent rounded-md p-2 dark:text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Image URL</label>
                            <input required name="image" defaultValue={currentProduct?.image || '/shoes/sh1.jpeg'} className="w-full border dark:border-gray-700 bg-transparent rounded-md p-2 dark:text-white" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium mb-1 dark:text-gray-300">Description</label>
                            <textarea name="description" defaultValue={currentProduct?.description} className="w-full border dark:border-gray-700 bg-transparent rounded-md p-2 dark:text-white h-24" />
                        </div>
                    </div>
                    <button type="submit" className="btn btn-primary w-full md:w-auto">Save Product</button>
                </form>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100">Products Inventory</h1>
                    <p className="text-gray-500 dark:text-gray-400">Manage your catalog</p>
                </div>
                <button onClick={() => { setCurrentProduct(null); setIsEditing(true); }} className="btn btn-primary flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add Product
                </button>
            </div>

            <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl shadow-sm overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Image</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Price</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {products.map(p => (
                                <tr key={p._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                                    <td className="p-4"><img src={p.image} className="w-10 h-10 rounded object-cover border dark:border-gray-700" alt="" /></td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{p.name}</td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{p.category}</td>
                                    <td className="p-4 text-gray-900 dark:text-gray-100">₹{p.price}</td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => { setCurrentProduct(p); setIsEditing(true); }} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-md transition-colors"><Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDelete(p._id)} className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-md ml-2 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function UsersTab({ loading, users }) {
    if (loading && !users.length) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Registered Users</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">List of all customers and admins</p>

            <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl shadow-sm overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Name</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Email</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Role</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Joined Date</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {users.map(u => (
                                <tr key={u._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold">
                                            {u.image ? <img src={u.image} className="w-full h-full rounded-full" /> : u.name?.charAt(0)}
                                        </div>
                                        {u.name}
                                    </td>
                                    <td className="p-4 text-gray-600 dark:text-gray-400">{u.email}</td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}`}>
                                            {u.role || 'user'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(u.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function OrdersTab({ loading, orders, onRefresh }) {
    const handleStatusUpdate = async (id, status) => {
        try {
            const res = await fetch('/api/admin/orders', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });
            if (res.ok) onRefresh();
        } catch (err) {
            console.error(err);
        }
    };

    if (loading && !orders.length) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

    const statuses = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Order Management</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-6">Track and fulfill customer orders</p>

            <div className="bg-white dark:bg-card border border-gray-100 dark:border-border rounded-xl shadow-sm overflow-hidden transition-colors">
                <div className="overflow-x-auto">
                    <table className="w-full whitespace-nowrap text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-slate-800/50">
                            <tr>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Order ID</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Customer</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Amount</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Date</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300">Status</th>
                                <th className="p-4 font-semibold text-gray-600 dark:text-gray-300 text-center">Invoice</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {orders.length === 0 && (
                                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No orders placed yet.</td></tr>
                            )}
                            {orders.map(o => (
                                <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                                    <td className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">{o._id}</td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{o.user?.name || 'Unknown'} <br/><span className="text-xs font-normal text-gray-500">{o.user?.email || ''}</span></td>
                                    <td className="p-4 text-green-600 dark:text-green-400 font-bold">₹{o.total}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4">
                                        <select 
                                            value={o.status || 'Processing'} 
                                            onChange={(e) => handleStatusUpdate(o._id, e.target.value)}
                                            className="border dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 rounded-md p-1 px-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                        >
                                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </td>
                                    <td className="p-4 text-center">
                                        <button
                                            onClick={() => generateOrderInvoicePDF(o)}
                                            className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-primary inline-flex items-center justify-center"
                                            title="Download Invoice"
                                        >
                                            <Download className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
