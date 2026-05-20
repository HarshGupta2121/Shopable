"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { 
    LayoutDashboard, Package, Users as UsersIcon, ShoppingCart, 
    DollarSign, ShoppingBag, TrendingUp, Edit, Trash2, Plus, X, Loader2
} from 'lucide-react';

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

// ---------------------- TAB COMPONENTS ----------------------

function DashboardTab({ loading, stats }) {
    if (loading) return <div className="flex justify-center p-8"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
    
    return (
        <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-slate-100 mb-2">Overview</h1>
            <p className="text-gray-500 dark:text-gray-400 mb-8">Live statistics from your store</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
                <StatCard icon={DollarSign} title="Total Revenue" value={`₹${stats?.revenue || 0}`} color="bg-green-100 text-green-600" />
                <StatCard icon={ShoppingBag} title="Total Orders" value={stats?.orders || 0} color="bg-blue-100 text-blue-600" />
                <StatCard icon={Package} title="Total Products" value={stats?.products || 0} color="bg-orange-100 text-orange-600" />
                <StatCard icon={UsersIcon} title="Total Users" value={stats?.users || 0} color="bg-purple-100 text-purple-600" />
            </div>

            <div className="bg-white dark:bg-card p-8 rounded-xl shadow-sm border border-gray-100 dark:border-border text-center transition-colors">
                <h3 className="text-xl font-bold text-gray-800 dark:text-slate-200 mb-4">Welcome to your new Dashboard</h3>
                <p className="text-gray-600 dark:text-gray-400">Use the tabs on the left to manage products, view incoming orders, and manage users.</p>
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
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                            {orders.length === 0 && (
                                <tr><td colSpan="5" className="p-8 text-center text-gray-500">No orders placed yet.</td></tr>
                            )}
                            {orders.map(o => (
                                <tr key={o._id} className="hover:bg-gray-50 dark:hover:bg-slate-800/30">
                                    <td className="p-4 font-mono text-xs text-gray-500 dark:text-gray-400">{o._id}</td>
                                    <td className="p-4 font-medium text-gray-900 dark:text-gray-100">{o.user?.name || 'Unknown'} <br/><span className="text-xs font-normal text-gray-500">{o.user?.email || ''}</span></td>
                                    <td className="p-4 text-green-600 dark:text-green-400 font-bold">₹{o.total}</td>
                                    <td className="p-4 text-gray-500 dark:text-gray-400">{new Date(o.createdAt).toLocaleDateString()}</td>
                                    <td className="p-4 text-right">
                                        <select 
                                            value={o.status || 'Processing'} 
                                            onChange={(e) => handleStatusUpdate(o._id, e.target.value)}
                                            className="border dark:border-gray-700 bg-white dark:bg-slate-900 text-gray-700 dark:text-gray-200 rounded-md p-1 px-2 text-xs font-medium focus:ring-2 focus:ring-primary outline-none"
                                        >
                                            {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
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
