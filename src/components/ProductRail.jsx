"use client";

import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import ProductCard from './ProductCard';
import { useRef } from 'react';

export default function ProductRail({ title, products, link, bgColor = "bg-white" }) {
    const scrollContainerRef = useRef(null);

    const scroll = (direction) => {
        if (scrollContainerRef.current) {
            const { current } = scrollContainerRef;
            const scrollAmount = direction === 'left' ? -300 : 300;
            current.scrollLeft += scrollAmount;
        }
    };

    return (
        <div className={`${bgColor} p-4 md:p-6 rounded-lg shadow-sm relative group`}>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">{title}</h2>
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors hidden md:flex"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-2 rounded-full bg-slate-100 hover:bg-slate-200 transition-colors hidden md:flex"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="w-5 h-5" />
                    </button>
                    {link && (
                        <Link href={link} className="flex items-center justify-center w-9 h-9 rounded-full bg-blue-600 text-white hover:bg-blue-700 shadow-sm ml-2">
                            <ChevronRight className="w-5 h-5" />
                        </Link>
                    )}
                </div>
            </div>

            <div
                ref={scrollContainerRef}
                className="overflow-x-auto pb-4 scrollbar-hide -mx-4 px-4 scroll-smooth snap-x snap-mandatory"
            >
                <div className="flex gap-4 w-max">
                    {products.map((product) => (
                        <div key={product.id} className="w-[200px] md:w-[240px] snap-start">
                            <ProductCard product={product} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
