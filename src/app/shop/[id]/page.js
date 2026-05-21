/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { products } from '@/data/products';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useVoice } from '@/context/VoiceContext';
import { useToast } from '@/context/ToastContext';
import { useAuth } from '@/context/AuthContext';
import { ChevronRight, Star, Truck, ShieldCheck, Heart, User as UserIcon, MessageSquare } from 'lucide-react';
import ProductRail from '@/components/ProductRail';

export default function ProductDetailsPage({ params }) {
    // Unwrap params using React.use()
    const { id } = use(params);
    const numericId = parseInt(id);
    const router = useRouter();

    // Optimistic initialization from static data
    const [product, setProduct] = useState(() => products.find(p => p.id === numericId));
    const [isLoading, setIsLoading] = useState(true);

    // Reviews State
    const [reviews, setReviews] = useState([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
    const [submittingReview, setSubmittingReview] = useState(false);

    // Hooks
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist, wishlist } = useWishlist();
    const { speak } = useVoice();
    const { showToast } = useToast();
    const { user, isAuthenticated } = useAuth();

    // State for options (Moved up to avoid ReferenceError in useEffect)
    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                // Short timeout for fast fallback
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 2000);

                const res = await fetch(`/api/products/${numericId}`, {
                    signal: controller.signal,
                    cache: 'no-store'
                });
                clearTimeout(timeoutId);

                if (!res.ok) throw new Error('Failed to fetch');
                const data = await res.json();
                setProduct(data);
            } catch (e) {
                console.warn("Fetch failed, using static data for product details", e);
            } finally {
                setIsLoading(false);
            }
        };

        const fetchReviews = async () => {
            try {
                const res = await fetch(`/api/reviews?productId=${numericId}`);
                if (res.ok) {
                    const data = await res.json();
                    setReviews(data);
                }
            } catch (error) {
                console.error("Failed to fetch reviews", error);
            } finally {
                setLoadingReviews(false);
            }
        };

        fetchProduct();
        fetchReviews();
    }, [numericId]);

    // Voice Command Listener
    useEffect(() => {
        const handleVoiceAddToCart = () => {
            if (product) {
                addToCart(product, { size: selectedSize, color: selectedColor });
                const variantText = (selectedSize ? `size ${selectedSize}, ` : '') + (selectedColor ? `color ${selectedColor}` : '');
                const message = `Added ${product.name} ${variantText} to cart.`;
                speak(message);
                showToast(message, 'success');
            }
        };

        const handleVoiceReadReviews = () => {
            if (loadingReviews) {
                speak("Still loading reviews, one moment please.");
                return;
            }
            if (reviews.length === 0) {
                speak("There are no reviews for this product yet.");
                return;
            }
            const readCount = Math.min(2, reviews.length);
            let reviewText = `This product has ${reviews.length} reviews. Here are the top ${readCount}. `;
            for(let i=0; i < readCount; i++){
                const ratingText = reviews[i].rating === 5 ? "5 stars" : `${reviews[i].rating} stars`;
                reviewText += `Review ${i+1}: ${reviews[i].userName || 'A user'} gave it ${ratingText} and said: ${reviews[i].comment}. `;
            }
            speak(reviewText);
        };

        const handleVoiceAddToWishlist = () => {
            if (product) {
                const isAlreadyInWishlist = isInWishlist(product.id);
                if (isAlreadyInWishlist) {
                    const message = `${product.name} is already in your wishlist.`;
                    speak(message);
                    showToast(message, 'info');
                } else {
                    toggleWishlist(product);
                    const message = `Added ${product.name} to wishlist.`;
                    speak(message);
                    showToast(message, 'success');
                }
            }
        };

        const handleVoiceRemoveFromWishlist = () => {
            if (product) {
                const isAlreadyInWishlist = isInWishlist(product.id);
                if (!isAlreadyInWishlist) {
                    const message = `${product.name} is not in your wishlist.`;
                    speak(message);
                    showToast(message, 'info');
                } else {
                    toggleWishlist(product);
                    const message = `Removed ${product.name} from wishlist.`;
                    speak(message);
                    showToast(message, 'info');
                }
            }
        };

        window.addEventListener('TRIGGER_ADD_TO_CART', handleVoiceAddToCart);
        window.addEventListener('TRIGGER_READ_REVIEWS', handleVoiceReadReviews);
        window.addEventListener('TRIGGER_ADD_TO_WISHLIST', handleVoiceAddToWishlist);
        window.addEventListener('TRIGGER_REMOVE_FROM_WISHLIST', handleVoiceRemoveFromWishlist);
        
        return () => {
            window.removeEventListener('TRIGGER_ADD_TO_CART', handleVoiceAddToCart);
            window.removeEventListener('TRIGGER_READ_REVIEWS', handleVoiceReadReviews);
            window.removeEventListener('TRIGGER_ADD_TO_WISHLIST', handleVoiceAddToWishlist);
            window.removeEventListener('TRIGGER_REMOVE_FROM_WISHLIST', handleVoiceRemoveFromWishlist);
        };
    }, [product, selectedSize, selectedColor, addToCart, speak, showToast, reviews, loadingReviews, isInWishlist, toggleWishlist]); 

    useEffect(() => {
        if (product) {
            if (product.sizes && !selectedSize) setSelectedSize(product.sizes[0]);
            if (product.colors && !selectedColor) setSelectedColor(product.colors[0]);
        }
    }, [product, selectedSize, selectedColor]);

    if (!product) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">Product Not Found</h1>
                <Link href="/shop" className="text-primary hover:underline">Back to Shop</Link>
            </div>
        );
    }

    const isWishlisted = isInWishlist(product.id);

    // AI Personalization & Recommendations Logic
    const relatedProducts = products.filter(p => p.id !== product.id).map(p => {
        let score = 0;
        // Base score for same category
        if (p.category === product.category) score += 3;
        
        // Base score for similar price (+/- 30%)
        if (p.price >= product.price * 0.7 && p.price <= product.price * 1.3) score += 1;
        
        // AI Personalization: Cross-reference with user's wishlist history
        if (wishlist && wishlist.length > 0) {
            const wishlistCategories = wishlist.map(w => w.category);
            // If the user has wishlisted items in this product's category, boost the score
            if (wishlistCategories.includes(p.category)) score += 2;
        }
        
        return { ...p, score };
    })
    .filter(p => p.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

    // Initial average from static, but could compute from reviews
    const averageRating = reviews.length > 0
        ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
        : "4.5"; // Fallback/Default

    const handleAddToCart = () => {
        addToCart(product, { size: selectedSize, color: selectedColor });
        const variantText = (selectedSize ? `size ${selectedSize}, ` : '') + (selectedColor ? `color ${selectedColor}` : '');
        const message = `Added ${product.name} ${variantText} to cart.`;
        speak(message);
        showToast(message, 'success');
    };

    const handleWishlist = () => {
        const added = toggleWishlist(product);
        if (added) {
            speak(`Added ${product.name} to wishlist.`);
            showToast(`Added ${product.name} to wishlist`, 'success');
        } else {
            speak(`Removed ${product.name} from wishlist.`);
            showToast(`Removed ${product.name} from wishlist`, 'info');
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!user) {
            speak("Please sign in to write a review.");
            showToast("Please sign in to write a review", 'error');
            return;
        }

        setSubmittingReview(true);
        try {
            const res = await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: numericId,
                    rating: newReview.rating,
                    comment: newReview.comment
                })
            });

            if (res.ok) {
                const savedReview = await res.json();
                setReviews([savedReview, ...reviews]);
                setNewReview({ rating: 5, comment: '' });
                speak("Review submitted successfully.");
                showToast("Review submitted!", 'success');
            } else {
                const err = await res.json();
                throw new Error(err.message || 'Failed to submit review');
            }
        } catch (error) {
            console.error(error);
            showToast(error.message, 'error');
            speak("Failed to submit review.");
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-12">
            <div className="container py-6">
                {/* Breadcrumbs */}
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
                    <Link href="/" className="hover:text-primary">Home</Link>
                    <ChevronRight className="w-4 h-4" />
                    <Link href="/shop" className="hover:text-primary">Shop</Link>
                    <ChevronRight className="w-4 h-4" />
                    <span className="font-medium text-foreground">{product.name}</span>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-border p-6 md:p-8 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                        {/* Image Section */}
                        <div className="space-y-4">
                            <div className="aspect-square bg-secondary rounded-lg overflow-hidden relative group">
                                <img
                                    src={product.image}
                                    alt={product.name}
                                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                />
                                <button
                                    onClick={handleWishlist}
                                    className={`absolute top-4 right-4 p-3 rounded-full bg-white/90 backdrop-blur-sm shadow-md hover:scale-110 transition-all ${isWishlisted ? 'text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                >
                                    <Heart className={`w-6 h-6 ${isWishlisted ? 'fill-current' : ''}`} />
                                </button>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="flex flex-col">
                            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-gray-900">{product.name}</h1>

                            <div className="flex items-center gap-4 mb-6">
                                <span className="text-2xl font-bold text-primary">₹{product.price.toLocaleString()}</span>
                                <div className="flex items-center gap-1 text-yellow-500 text-sm font-medium bg-yellow-50 px-2 py-1 rounded">
                                    <Star className="w-4 h-4 fill-current" />
                                    <span>{averageRating} ({reviews.length} reviews)</span>
                                </div>
                            </div>

                            <p className="text-gray-600 leading-relaxed mb-8 text-lg">{product.description}</p>

                            {/* Options */}
                            <div className="space-y-6 mb-8">
                                {product.sizes && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Size</label>
                                        <div className="flex flex-wrap gap-3">
                                            {product.sizes.map(size => (
                                                <button
                                                    key={size}
                                                    onClick={() => setSelectedSize(size)}
                                                    className={`w-12 h-12 rounded-lg border-2 flex items-center justify-center font-medium transition-all ${selectedSize === size
                                                        ? 'border-primary bg-primary text-white shadow-md'
                                                        : 'border-gray-200 hover:border-primary/50 text-gray-600'
                                                        }`}
                                                >
                                                    {size}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {product.colors && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Select Color</label>
                                        <div className="flex flex-wrap gap-3">
                                            {product.colors.map(color => (
                                                <button
                                                    key={color}
                                                    onClick={() => setSelectedColor(color)}
                                                    className={`px-4 py-2 rounded-lg border-2 font-medium transition-all ${selectedColor === color
                                                        ? 'border-primary bg-primary text-white shadow-md'
                                                        : 'border-gray-200 hover:border-primary/50 text-gray-600'
                                                        }`}
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Actions */}
                            <div className="mt-auto space-y-4">
                                <button
                                    onClick={handleAddToCart}
                                    className="w-full btn btn-primary text-lg py-4 rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
                                >
                                    Add to Cart - ₹{product.price.toLocaleString()}
                                </button>

                                {/* Trust Badges */}
                                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                                            <Truck className="w-5 h-5" />
                                        </div>
                                        <span>Free Delivery</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                        <div className="p-2 bg-green-50 rounded-full text-green-600">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <span>Original Product</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="bg-white rounded-xl shadow-sm border border-border p-6 md:p-8 mb-8">
                    <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                        <MessageSquare className="w-6 h-6 text-primary" />
                        Customer Reviews
                    </h2>

                    {/* Write Review */}
                    {user ? (
                        <form onSubmit={handleSubmitReview} className="mb-8 bg-gray-50 p-6 rounded-xl border border-gray-100">
                            <h3 className="font-semibold mb-4">Write a Review</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-1">Rating</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => setNewReview(prev => ({ ...prev, rating: star }))}
                                                className={`transition-transform hover:scale-110 ${star <= newReview.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                            >
                                                <Star className="w-6 h-6 fill-current" />
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-1">Comment</label>
                                    <textarea
                                        value={newReview.comment}
                                        onChange={(e) => setNewReview(prev => ({ ...prev, comment: e.target.value }))}
                                        className="w-full p-3 rounded-lg border focus:ring-2 focus:ring-primary/20 outline-none min-h-[100px]"
                                        placeholder="Share your experience with this product..."
                                        required
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={submittingReview}
                                    className="btn btn-primary px-6"
                                >
                                    {submittingReview ? 'Posting...' : 'Post Review'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        <div className="mb-8 p-6 bg-gray-50 rounded-xl text-center">
                            <p className="text-muted-foreground mb-4">Please sign in to write a review.</p>
                            <Link href="/signin" className="btn btn-outline">Sign In</Link>
                        </div>
                    )}

                    {/* Reviews List */}
                    <div className="space-y-6">
                        {loadingReviews ? (
                            <div className="text-center py-8">Loading reviews...</div>
                        ) : reviews.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">No reviews yet. Be the first to review!</div>
                        ) : (
                            reviews.map((review) => (
                                <div key={review._id} className="border-b last:border-0 pb-6 last:pb-0">
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center">
                                                <UserIcon className="w-4 h-4 text-gray-600" />
                                            </div>
                                            <span className="font-semibold">{review.userName || 'User'}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="flex text-yellow-400 mb-2">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-gray-200 fill-none'}`} />
                                        ))}
                                    </div>
                                    <p className="text-gray-600">{review.comment}</p>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Related Products */}
                {relatedProducts.length > 0 && (
                    <div className="mt-12">
                        <ProductRail title="You Might Also Like" products={relatedProducts} bgColor="bg-transparent" />
                    </div>
                )}
            </div>
        </div>
    );
}
