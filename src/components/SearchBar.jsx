"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, Loader2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function SearchBar() {
    const router = useRouter();
    const [query, setQuery] = useState('');
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef(null);

    // Close suggestions when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setShowSuggestions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    useEffect(() => {
        const fetchSuggestions = async () => {
            if (query.trim().length > 1) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/products?q=${encodeURIComponent(query)}&limit=5`);
                    if (res.ok) {
                        const data = await res.json();
                        setSuggestions(data);
                        setShowSuggestions(true);
                    }
                } catch (error) {
                    console.error("Failed to fetch suggestions:", error);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setSuggestions([]);
                setShowSuggestions(false);
            }
        };

        const timeoutId = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeoutId);
    }, [query]);

    const handleSearch = (e) => {
        setQuery(e.target.value);
    };

    const handleSubmit = (e) => {
        if (e.key === 'Enter') {
            router.push(`/shop?q=${encodeURIComponent(query)}`);
            setShowSuggestions(false);
        }
    };

    const clearSearch = () => {
        setQuery('');
        setSuggestions([]);
        setShowSuggestions(false);
    };

    return (
        <div ref={wrapperRef} className="hidden md:flex flex-1 max-w-md mx-auto relative z-50">
            <div className="relative w-full">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    placeholder="Search for products..."
                    value={query}
                    onChange={handleSearch}
                    onKeyDown={handleSubmit}
                    onFocus={() => { if (suggestions.length > 0) setShowSuggestions(true); }}
                    className="w-full h-10 pl-10 pr-10 rounded-lg bg-secondary/50 border border-transparent focus:bg-background focus:border-primary/20 focus:ring-4 focus:ring-primary/10 outline-none text-sm transition-all shadow-sm"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {isLoading ? (
                        <Loader2 className="w-4 h-4 text-muted-foreground animate-spin" />
                    ) : query && (
                        <button onClick={clearSearch} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-card rounded-xl shadow-xl border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    <div className="p-2">
                        <h4 className="text-xs font-semibold text-muted-foreground px-3 py-2 uppercase tracking-wider">Top Results</h4>
                        <ul>
                            {suggestions.map((product) => (
                                <li key={product._id || product.id}>
                                    <Link
                                        href={`/shop/${product.id}`}
                                        onClick={() => setShowSuggestions(false)}
                                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary transition-colors group"
                                    >
                                            <div className="w-10 h-10 rounded bg-white p-1 border border-border flex-shrink-0 relative">
                                                <Image src={product.image} alt={product.name} fill className="object-contain" />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">{product.name}</p>
                                                <p className="text-xs text-muted-foreground">{product.category}</p>
                                            </div>
                                            <div className="text-sm font-bold text-primary">₹{product.price}</div>
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                            <button
                                onClick={() => {
                                    router.push(`/shop?q=${encodeURIComponent(query)}`);
                                    setShowSuggestions(false);
                                }}
                                className="w-full text-center text-xs font-medium text-primary hover:underline py-2 mt-2 border-t border-border"
                            >
                                View all results for &quot;{query}&quot;
                            </button>
                    </div>
                </div>
            )}
        </div>
    );
}
