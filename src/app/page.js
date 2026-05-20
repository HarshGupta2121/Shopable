/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from 'react';
import { useVoice } from '@/context/VoiceContext';
import Link from 'next/link';
import { Shirt, Monitor, Home as HomeIcon, Sparkles, Watch, Footprints, Loader2 } from 'lucide-react';
import { categories } from '@/data/products';
import VoiceHints from '@/components/VoiceHints';
import CategoryQuad from '@/components/CategoryQuad';
import ProductRail from '@/components/ProductRail';

export default function Home() {
  const { speak } = useVoice();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const heroSlides = [
    {
      id: 1,
      title: "Refined Essentials for Modern Living.",
      subtitle: "Shop Now.",
      image: "/images/modern_home_banner.png",
      link: "/shop",
      color: "bg-secondary"
    },
    {
      id: 2,
      title: "Smart Tech for a Smarter You.",
      subtitle: "Explore Tech.",
      image: "/images/smart_speaker.png",
      link: "/shop?cat=tech",
      color: "bg-blue-50 dark:bg-blue-950"
    },
    {
      id: 3,
      title: "Timeless Elegance on Your Wrist.",
      subtitle: "View Watches.",
      image: "/images/minimalist_watch.png",
      link: "/shop?cat=accessories",
      color: "bg-stone-50 dark:bg-stone-950"
    }
  ];

  useEffect(() => {
    // Speak welcome message on first load
    const timer = setTimeout(() => {
      speak("Welcome to Shopable. Refined essentials for modern living.");
    }, 1000);

    // Slider interval
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 6000);

    // Fetch Products
    const fetchProducts = async () => {
      try {
        const res = await fetch(`/api/products?limit=100&_t=${new Date().getTime()}`, { cache: 'no-store' }); // Fetch enough for home page
        if (res.ok) {
          const data = await res.json();
          setProducts(data);
        }
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
    };
  }, [speak, heroSlides.length]);

  // Filter products for different sections
  const categoryIcons = {
    Apparel: Shirt,
    Tech: Monitor,
    Home: HomeIcon,
    Beauty: Sparkles,
    Watch: Watch,
    Shoes: Footprints,
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background">
        <Loader2 className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  const flashDeals = products.filter(p => p.isFlashDeal);
  const mensWear = products.filter(p => p.category === 'Apparel' && p.name.toLowerCase().includes("men"));
  const womensWear = products.filter(p => p.category === 'Apparel' && p.name.toLowerCase().includes("women"));
  const watches = products.filter(p => p.category === 'Watch');
  const shoes = products.filter(p => p.category === 'Shoes');
  const homeDecor = products.filter(p => p.category === 'Home');
  const beauty = products.filter(p => p.category === 'Beauty');
  const tech = products.filter(p => p.category === 'Tech');

  // Helper to get 4 items for quad
  const getQuad = (list) => list.slice(0, 4);

  return (
    <div className="bg-gray-100 dark:bg-background min-h-screen transition-colors duration-300">
      <VoiceHints />

      <div className="container py-4 space-y-6">

        {/* Categories Bar */}
        <section className="bg-white dark:bg-card p-4 rounded-md shadow-sm flex items-center justify-between overflow-x-auto scrollbar-hide border dark:border-border transition-colors duration-300">
          {categories.map((cat) => {
            const Icon = categoryIcons[cat.name] || HomeIcon;
            return (
              <Link key={cat.name} href={`/shop?cat=${cat.name.toLowerCase()}`} className="flex flex-col items-center gap-2 group min-w-[80px]">
                <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-secondary/30 flex items-center justify-center text-gray-600 dark:text-gray-300 group-hover:bg-primary group-hover:text-white transition-all duration-300 shadow-sm border border-gray-100 dark:border-gray-800">
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 group-hover:text-primary">{cat.name}</span>
              </Link>
            );
          })}
        </section>

        {/* Full Width Slider + Right Side Quads if desktop */}
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Hero Slider */}
          <div className="lg:w-2/3 h-[300px] md:h-[600px] relative rounded-md overflow-hidden group shadow-sm bg-white dark:bg-card border dark:border-border transition-colors duration-300">
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id}
                className={`absolute inset-0 transition-opacity duration-1000 ease-in-out flex items-center ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'} ${slide.color}`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-black/10 to-transparent z-10" />
                <img
                  src={slide.image}
                  alt={slide.title}
                  className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal dark:opacity-80 opacity-90 transition-opacity"
                />
                <div className="absolute bottom-10 left-10 z-20 max-w-sm text-foreground bg-white/80 dark:bg-slate-900/80 p-6 backdrop-blur-sm rounded-lg shadow-sm border dark:border-border">
                  <h2 className="text-3xl font-bold mb-2 text-slate-900 dark:text-slate-100">{slide.title}</h2>
                  <Link href={slide.link} className="text-sm font-bold uppercase tracking-wide text-primary hover:underline">
                    {slide.subtitle}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Side Quads (Desktop only mostly) */}
          <div className="lg:w-1/3 flex flex-col gap-4">
            <div className="bg-white dark:bg-card p-6 rounded-md shadow-sm border dark:border-border flex-1 flex flex-col justify-center items-start transition-colors duration-300">
              <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">Winter Essentials</h3>
              <div className="grid grid-cols-2 gap-2 w-full mt-2">
                {mensWear.slice(0, 2).map(p => (
                  <img key={p.id} src={p.image} alt={p.name} className="bg-gray-50 dark:bg-slate-800/50 p-2 rounded w-full h-24 object-contain" />
                ))}
                {womensWear.slice(0, 2).map(p => (
                  <img key={p.id} src={p.image} alt={p.name} className="bg-gray-50 dark:bg-slate-800/50 p-2 rounded w-full h-24 object-contain" />
                ))}
              </div>
              <Link href="/shop?cat=apparel" className="text-primary text-sm font-medium mt-4 hover:underline">See all offers</Link>
            </div>
            <div className="bg-white dark:bg-card p-6 rounded-md shadow-sm border dark:border-border flex-1 flex flex-col justify-center items-start transition-colors duration-300">
              <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-slate-100">Bestselling Tech</h3>
              <div className="flex gap-2 w-full mt-2 overflow-hidden">
                {tech.slice(0, 3).map(p => (
                  <img key={p.id} src={p.image} alt={p.name} className="bg-gray-50 dark:bg-slate-800/50 p-2 rounded w-1/3 h-24 object-contain" />
                ))}
              </div>
              <Link href="/shop?cat=tech" className="text-primary text-sm font-medium mt-4 hover:underline">Explore Tech</Link>
            </div>
          </div>
        </div>

        {/* Row 1: Quad Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CategoryQuad title="Men's Fashion" items={getQuad(mensWear)} link="/shop?cat=apparel" />
          <CategoryQuad title="Women's Fashion" items={getQuad(womensWear)} link="/shop?cat=apparel" />
          <CategoryQuad title="Timepieces" items={getQuad(watches)} link="/shop?cat=watch" />
          <CategoryQuad title="Footwear" items={getQuad(shoes)} link="/shop?cat=shoes" />
        </div>

        {/* Row 2: Horizontal Rail - Flash Deals */}
        <ProductRail title="Flash Deals" products={flashDeals} link="/shop" bgColor="bg-white dark:bg-card border dark:border-border" />

        {/* Row 3: Quad Cards Mix */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <CategoryQuad title="Home Decor" items={getQuad(homeDecor)} link="/shop?cat=home" />
          <CategoryQuad title="Beauty Picks" items={getQuad(beauty)} link="/shop?cat=beauty" />
          <CategoryQuad title="Smart Devices" items={getQuad(tech)} link="/shop?cat=tech" />

          {/* Simple Banner Card instead of 4th quad */}
          <div className="bg-primary/10 dark:bg-primary/20 p-6 rounded-lg shadow-sm flex flex-col justify-center items-center text-center border dark:border-primary/30">
            <h3 className="text-2xl font-bold text-primary dark:text-teal-400 mb-2">Sign in for best experience</h3>
            <Link href="/signin" className="btn btn-primary w-full mt-4 shadow-md">Sign In securely</Link>
          </div>
        </div>

        {/* Row 4: Horizontal Rail - Best Sellers (Mixed) */}
        <ProductRail title="Best Sellers in Sports & Outdoors" products={[...shoes, ...mensWear]} link="/shop" bgColor="bg-white dark:bg-card border dark:border-border" />

      </div>
    </div>
  );
}
