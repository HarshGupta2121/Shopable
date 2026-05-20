"use client";

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useVoice } from '../context/VoiceContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useToast } from '../context/ToastContext';
import { Heart } from 'lucide-react';

const ProductCard = ({ product }) => {
    const { speak } = useVoice();
    const { addToCart } = useCart();
    const { showToast } = useToast();

    // Default to first option if available, otherwise null
    const [selectedSize, setSelectedSize] = React.useState(product.sizes ? product.sizes[0] : null);
    const [selectedColor, setSelectedColor] = React.useState(product.colors ? product.colors[0] : null);


    const { toggleWishlist, isInWishlist } = useWishlist();
    const isWishlisted = isInWishlist(product.id);

    const handleDetails = () => {
        speak(`${product.name}. Price: ₹${product.price}. ${product.description}`);
    };

    const handleAddToCart = () => {
        addToCart(product, { size: selectedSize, color: selectedColor });
        const variantText = (selectedSize ? `size ${selectedSize}, ` : '') + (selectedColor ? `color ${selectedColor}` : '');
        const message = `Added ${product.name} ${variantText} to cart.`;
        speak(message);
        showToast(message, 'success');
    };

    const handleWishlist = (e) => {
        e.preventDefault();
        e.stopPropagation();
        const added = toggleWishlist(product);
        if (added) {
            speak(`Added ${product.name} to wishlist.`);
            showToast(`Added ${product.name} to wishlist`, 'success');
        } else {
            speak(`Removed ${product.name} from wishlist.`);
            showToast(`Removed ${product.name} from wishlist`, 'info');
        }
    };

    return (
        <div className="border border-border rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow bg-card text-card-foreground group relative">
            <div className="aspect-square bg-secondary relative flex items-center justify-center overflow-hidden">
                <Link href={`/shop/${product.id}`} className="absolute inset-0 block w-full h-full">
                    <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                </Link>

                {/* Wishlist Button */}
                <button
                    onClick={handleWishlist}
                    className={`absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm transition-all duration-300 z-10 hover:scale-110 ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                    aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                >
                    <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>

                {/* Hover View Text */}
                <Link href={`/shop/${product.id}`} className="absolute inset-0 z-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/10">
                    <span className="bg-white/90 text-primary font-bold px-4 py-2 rounded-full shadow-lg transform -translate-y-2 group-hover:translate-y-0 transition-transform">View Details</span>
                </Link>
            </div>

            <div className="p-4">
                <Link href={`/shop/${product.id}`} className="hover:text-primary transition-colors">
                    <h3 className="text-xl font-bold mb-2">{product.name}</h3>
                </Link>
                <p className="text-lg font-semibold text-primary mb-2">₹{product.price}</p>
                <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{product.description}</p>

                <div className="space-y-3 mb-4">
                    {product.sizes && (
                        <div className="flex flex-wrap gap-2">
                            {product.sizes.map((size) => (
                                <button
                                    key={size}
                                    onClick={() => setSelectedSize(size)}
                                    className={`px-3 py-1 text-xs border rounded-full transition-colors ${selectedSize === size
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-secondary'
                                        }`}
                                >
                                    {size}
                                </button>
                            ))}
                        </div>
                    )}
                    {product.colors && (
                        <div className="flex flex-wrap gap-2">
                            {product.colors.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => setSelectedColor(color)}
                                    className={`px-3 py-1 text-xs border rounded-full transition-colors ${selectedColor === color
                                        ? 'bg-primary text-primary-foreground border-primary'
                                        : 'bg-background hover:bg-secondary'
                                        }`}
                                >
                                    {color}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={handleDetails}
                        className="btn btn-secondary flex-1"
                        aria-label={`Listen to details for ${product.name}`}
                    >
                        Listen
                    </button>
                    <button
                        onClick={handleAddToCart}
                        className="btn btn-primary flex-1"
                        aria-label={`Add ${product.name} to cart`}
                    >
                        Add to Cart
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;
