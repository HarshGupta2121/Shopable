"use client";

import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight } from 'lucide-react';

export default function CategoryQuad({ title, items, link }) {
    // Ensure we only show max 4 items
    const displayItems = items.slice(0, 4);

    return (
        <div className="bg-white dark:bg-card p-4 rounded-lg shadow-sm h-full flex flex-col border dark:border-border transition-colors duration-300">
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-slate-100">{title}</h3>

            <div className="grid grid-cols-2 gap-4 flex-1">
                {displayItems.map((item) => (
                    <Link key={item.id} href={`/shop?q=${item.name}`} className="group cursor-pointer">
                        <div className="aspect-square bg-gray-50 dark:bg-slate-800/50 rounded-md mb-2 overflow-hidden flex items-center justify-center p-2 border border-transparent group-hover:border-gray-200 dark:group-hover:border-gray-700 transition-all">
                            {item.image ? (
                                <span className="w-full h-full block bg-transparent relative">
                                    <Image src={item.image} alt={item.name} fill className="object-contain mix-blend-multiply dark:mix-blend-normal" />
                                </span>
                            ) : (
                                <span className="text-2xl">📦</span>
                            )}
                        </div>
                        <p className="text-xs text-gray-700 dark:text-gray-300 font-medium line-clamp-1 group-hover:text-primary dark:group-hover:text-teal-400">{item.name}</p>
                        {item.discount && (
                            <p className="text-xs text-green-600 dark:text-green-400 font-bold">{item.discount}</p>
                        )}
                    </Link>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                <Link href={link || '/shop'} className="text-primary text-sm font-medium flex items-center hover:underline">
                    See all <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
            </div>
        </div>
    );
}
