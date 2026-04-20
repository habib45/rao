import { useState, useEffect, useCallback, createContext, useContext, useMemo } from "react";

// ─── i18n ───────────────────────────────────────────────────────────────────
const translations = {
  en: {
    nav: { categories: "Categories", deals: "Deals", search: "Search products...", cart: "Cart", home: "Home", admin: "Admin" },
    hero: { title: "Discover curated products", subtitle: "Hand-picked selections with the best prices on Amazon", cta: "Explore deals" },
    sections: { categories: "Shop by category", featured: "Featured products", trending: "Trending now", viewAll: "View all" },
    product: { buyOnAmazon: "Buy on Amazon", addToCart: "Add to cart", inStock: "In stock", outOfStock: "Out of stock", reviews: "reviews", features: "Features", description: "Description", priceHistory: "Price history", priceUpdated: "Price updated", hoursAgo: "hours ago", off: "off", brand: "Brand", rating: "Rating", removeFromCart: "Remove" },
    cart: { title: "Your cart", items: "items", empty: "Your cart is empty", emptyDesc: "Add some products to get started", subtotal: "Subtotal", checkout: "Checkout on Amazon", checkoutNote: "Each item opens on Amazon.com", continueShopping: "Continue shopping", total: "Estimated total" },
    filters: { category: "Category", price: "Price range", rating: "Rating", all: "All", andUp: "& up", sort: "Sort by", popular: "Most popular", priceLow: "Price: low to high", priceHigh: "Price: high to low", ratingSort: "Highest rated", products: "products", clearAll: "Clear all", results: "Results for", filters: "Filters", applyFilters: "Show results" },
    footer: { disclosure: "As an Amazon Associate, we earn from qualifying purchases.", rights: "All rights reserved." },
    errors: { notFound: "Product not found", goBack: "Go back home" },
    admin: { title: "Admin Dashboard", overview: "Overview", totalProducts: "Total products", activeProducts: "Active", featuredProducts: "Featured", totalClicks: "Total clicks", avgRating: "Avg. rating", estRevenue: "Est. revenue", productMgmt: "Product management", analytics: "Click analytics", translations: "Translation status", product: "Product", category: "Category", price: "Price", rating: "Rating", status: "Status", actions: "Actions", clicks: "Clicks", convRate: "Conv. rate", active: "Active", inactive: "Inactive", featured: "Featured", priceFreshness: "Price freshness", lastSync: "Last sync", hoursAgo: "hours ago", complete: "Complete", incomplete: "Incomplete", locale: "Locale", coverage: "Coverage" },
  },
  "bn-BD": {
    nav: { categories: "ক্যাটাগরি", deals: "ডিল", search: "পণ্য খুঁজুন...", cart: "কার্ট", home: "হোম", admin: "অ্যাডমিন" },
    hero: { title: "সেরা পণ্য আবিষ্কার করুন", subtitle: "Amazon-এ সেরা দামে বাছাই করা পণ্য", cta: "ডিল দেখুন" },
    sections: { categories: "ক্যাটাগরি অনুযায়ী কিনুন", featured: "বৈশিষ্ট্যযুক্ত পণ্য", trending: "ট্রেন্ডিং", viewAll: "সব দেখুন" },
    product: { buyOnAmazon: "Amazon-এ কিনুন", addToCart: "কার্টে যোগ করুন", inStock: "স্টকে আছে", outOfStock: "স্টকে নেই", reviews: "রিভিউ", features: "বৈশিষ্ট্য", description: "বিবরণ", priceHistory: "দামের ইতিহাস", priceUpdated: "দাম আপডেট", hoursAgo: "ঘণ্টা আগে", off: "ছাড়", brand: "ব্র্যান্ড", rating: "রেটিং", removeFromCart: "সরান" },
    cart: { title: "আপনার কার্ট", items: "আইটেম", empty: "আপনার কার্ট খালি", emptyDesc: "কিছু পণ্য যোগ করুন", subtotal: "সাবটোটাল", checkout: "Amazon-এ চেকআউট", checkoutNote: "প্রতিটি আইটেম Amazon.com-এ খুলবে", continueShopping: "কেনাকাটা চালিয়ে যান", total: "আনুমানিক মোট" },
    filters: { category: "ক্যাটাগরি", price: "মূল্য সীমা", rating: "রেটিং", all: "সব", andUp: "ও উপরে", sort: "সাজান", popular: "সবচেয়ে জনপ্রিয়", priceLow: "দাম: কম থেকে বেশি", priceHigh: "দাম: বেশি থেকে কম", ratingSort: "সর্বোচ্চ রেটেড", products: "পণ্য", clearAll: "সব মুছুন", results: "ফলাফল", filters: "ফিল্টার", applyFilters: "ফলাফল দেখান" },
    footer: { disclosure: "একটি Amazon অ্যাসোসিয়েট হিসেবে, আমরা যোগ্য ক্রয় থেকে আয় করি।", rights: "সর্বস্বত্ব সংরক্ষিত।" },
    errors: { notFound: "পণ্য পাওয়া যায়নি", goBack: "হোমে ফিরে যান" },
    admin: { title: "অ্যাডমিন ড্যাশবোর্ড", overview: "ওভারভিউ", totalProducts: "মোট পণ্য", activeProducts: "সক্রিয়", featuredProducts: "বৈশিষ্ট্যযুক্ত", totalClicks: "মোট ক্লিক", avgRating: "গড় রেটিং", estRevenue: "আনু. রাজস্ব", productMgmt: "পণ্য ব্যবস্থাপনা", analytics: "ক্লিক বিশ্লেষণ", translations: "অনুবাদ স্থিতি", product: "পণ্য", category: "ক্যাটাগরি", price: "দাম", rating: "রেটিং", status: "স্থিতি", actions: "অ্যাকশন", clicks: "ক্লিক", convRate: "কনভ. হার", active: "সক্রিয়", inactive: "নিষ্ক্রিয়", featured: "বৈশিষ্ট্যযুক্ত", priceFreshness: "দাম ফ্রেশনেস", lastSync: "শেষ সিঙ্ক", hoursAgo: "ঘণ্টা আগে", complete: "সম্পূর্ণ", incomplete: "অসম্পূর্ণ", locale: "ভাষা", coverage: "কভারেজ" },
  },
  sv: {
    nav: { categories: "Kategorier", deals: "Erbjudanden", search: "Sök produkter...", cart: "Varukorg", home: "Hem", admin: "Admin" },
    hero: { title: "Upptäck utvalda produkter", subtitle: "Handplockade produkter till bästa priser på Amazon", cta: "Utforska erbjudanden" },
    sections: { categories: "Handla per kategori", featured: "Utvalda produkter", trending: "Trendigt nu", viewAll: "Visa alla" },
    product: { buyOnAmazon: "Köp på Amazon", addToCart: "Lägg i varukorgen", inStock: "I lager", outOfStock: "Slut i lager", reviews: "recensioner", features: "Funktioner", description: "Beskrivning", priceHistory: "Prishistorik", priceUpdated: "Pris uppdaterat", hoursAgo: "timmar sedan", off: "rabatt", brand: "Varumärke", rating: "Betyg", removeFromCart: "Ta bort" },
    cart: { title: "Din varukorg", items: "artiklar", empty: "Din varukorg är tom", emptyDesc: "Lägg till produkter för att komma igång", subtotal: "Delsumma", checkout: "Köp på Amazon", checkoutNote: "Varje artikel öppnas på Amazon.com", continueShopping: "Fortsätt handla", total: "Uppskattat totalt" },
    filters: { category: "Kategori", price: "Prisintervall", rating: "Betyg", all: "Alla", andUp: "& upp", sort: "Sortera efter", popular: "Mest populära", priceLow: "Pris: lågt till högt", priceHigh: "Pris: högt till lågt", ratingSort: "Högst betyg", products: "produkter", clearAll: "Rensa allt", results: "Resultat för", filters: "Filter", applyFilters: "Visa resultat" },
    footer: { disclosure: "Som Amazon-associate tjänar vi på kvalificerade köp.", rights: "Alla rättigheter förbehållna." },
    errors: { notFound: "Produkten hittades inte", goBack: "Gå tillbaka hem" },
    admin: { title: "Adminpanel", overview: "Översikt", totalProducts: "Totalt produkter", activeProducts: "Aktiva", featuredProducts: "Utvalda", totalClicks: "Totala klick", avgRating: "Snittbetyg", estRevenue: "Uppsk. intäkt", productMgmt: "Produkthantering", analytics: "Klickanalys", translations: "Översättningsstatus", product: "Produkt", category: "Kategori", price: "Pris", rating: "Betyg", status: "Status", actions: "Åtgärder", clicks: "Klick", convRate: "Konv. kvot", active: "Aktiv", inactive: "Inaktiv", featured: "Utvald", priceFreshness: "Prisfärskhet", lastSync: "Senaste synk", hoursAgo: "timmar sedan", complete: "Komplett", incomplete: "Ofullständig", locale: "Språk", coverage: "Täckning" },
  },
};

// ─── Product Data ───────────────────────────────────────────────────────────
const categories = [
  { id: "electronics", name: { en: "Electronics", "bn-BD": "ইলেকট্রনিক্স", sv: "Elektronik" }, icon: "⚡", color: "#4338ca" },
  { id: "home", name: { en: "Home & Kitchen", "bn-BD": "হোম ও কিচেন", sv: "Hem & Kök" }, icon: "🏠", color: "#0f766e" },
  { id: "fashion", name: { en: "Fashion", "bn-BD": "ফ্যাশন", sv: "Mode" }, icon: "👔", color: "#9333ea" },
  { id: "books", name: { en: "Books", "bn-BD": "বই", sv: "Böcker" }, icon: "📚", color: "#c2410c" },
  { id: "sports", name: { en: "Sports", "bn-BD": "স্পোর্টস", sv: "Sport" }, icon: "⚽", color: "#15803d" },
  { id: "beauty", name: { en: "Beauty", "bn-BD": "সৌন্দর্য", sv: "Skönhet" }, icon: "✨", color: "#be185d" },
];

const products = [
  { id: "1", asin: "B0BX3N6ZH2", slug: "sony-wh-1000xm5", category: "electronics", name: { en: "Sony WH-1000XM5 Wireless Headphones", "bn-BD": "Sony WH-1000XM5 ওয়্যারলেস হেডফোন", sv: "Sony WH-1000XM5 trådlösa hörlurar" }, description: { en: "Industry-leading noise cancellation with Auto NC Optimizer. Crystal clear hands-free calling with 4 beamforming microphones.", "bn-BD": "অটো NC অপটিমাইজার সহ নয়েজ ক্যান্সেলেশন। 4টি বীমফর্মিং মাইক্রোফোন সহ হ্যান্ডস-ফ্রি কলিং।", sv: "Branschledande brusreducering med Auto NC Optimizer. Kristallklara handsfree-samtal." }, features: ["Auto NC Optimizer", "30-hour battery", "Multipoint connection", "Speak-to-Chat", "Quick charge"], price: 29800, originalPrice: 39999, currency: "USD", rating: 4.8, reviewCount: 12456, brand: "Sony", availability: "in_stock", isFeatured: true, isActive: true, images: ["https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop", "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop"], clickCount: 1243, convRate: 3.2 },
  { id: "2", asin: "B0BDHWDR12", slug: "kindle-paperwhite", category: "electronics", name: { en: "Kindle Paperwhite 11th Gen", "bn-BD": "Kindle Paperwhite ১১তম জেন", sv: "Kindle Paperwhite 11:e gen" }, description: { en: "The thinnest, lightest Kindle Paperwhite yet with 300 ppi glare-free display.", "bn-BD": "সবচেয়ে পাতলা, হালকা Kindle Paperwhite। 300 ppi গ্লেয়ার-ফ্রি ডিসপ্লে সহ।", sv: "Den tunnaste Kindle Paperwhite med 300 ppi bländfri skärm." }, features: ["300 ppi display", "Adjustable warm light", "10-week battery", "IPX8 waterproof", "16GB storage"], price: 13999, originalPrice: 15999, currency: "USD", rating: 4.7, reviewCount: 8923, brand: "Amazon", availability: "in_stock", isFeatured: true, isActive: true, images: ["https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&h=600&fit=crop"], clickCount: 987, convRate: 4.1 },
  { id: "3", asin: "B09B8V1LZ3", slug: "echo-dot-5th-gen", category: "electronics", name: { en: "Echo Dot 5th Generation", "bn-BD": "Echo Dot ৫ম জেনারেশন", sv: "Echo Dot 5:e generationen" }, description: { en: "Best sounding Echo Dot with vibrant sound and Alexa.", "bn-BD": "সেরা সাউন্ডিং Echo Dot। Alexa সহ।", sv: "Bäst klingande Echo Dot med Alexa." }, features: ["Improved audio", "Built-in Alexa", "Smart home hub", "eero mesh support"], price: 4999, originalPrice: 5999, currency: "USD", rating: 4.6, reviewCount: 34521, brand: "Amazon", availability: "in_stock", isFeatured: true, isActive: true, images: ["https://images.unsplash.com/photo-1543512214-318c7553f230?w=600&h=600&fit=crop"], clickCount: 2341, convRate: 5.7 },
  { id: "4", asin: "B0D1XD1ZV3", slug: "airpods-pro-2", category: "electronics", name: { en: "Apple AirPods Pro 2nd Gen", "bn-BD": "Apple AirPods Pro ২য় জেন", sv: "Apple AirPods Pro 2:a gen" }, description: { en: "2x more Active Noise Cancellation and Adaptive Transparency.", "bn-BD": "2x বেশি Active Noise Cancellation।", sv: "2x mer aktiv brusreducering." }, features: ["Active Noise Cancellation", "Adaptive Transparency", "Spatial Audio", "USB-C"], price: 19900, originalPrice: 24900, currency: "USD", rating: 4.7, reviewCount: 19234, brand: "Apple", availability: "in_stock", isFeatured: true, isActive: true, images: ["https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=600&h=600&fit=crop"], clickCount: 1876, convRate: 3.8 },
  { id: "5", asin: "B0CG5KNM5Z", slug: "instant-pot-duo", category: "home", name: { en: "Instant Pot Duo 7-in-1", "bn-BD": "Instant Pot Duo 7-in-1", sv: "Instant Pot Duo 7-i-1" }, description: { en: "7 appliances in 1: pressure cooker, slow cooker, rice cooker, steamer.", "bn-BD": "১টিতে ৭টি যন্ত্র: প্রেশার কুকার, স্লো কুকার।", sv: "7 apparater i 1: tryckkokare, slow cooker." }, features: ["7-in-1", "13 programs", "Stainless steel", "Dishwasher safe"], price: 8995, originalPrice: 9999, currency: "USD", rating: 3.8, reviewCount: 45678, brand: "Instant Pot", availability: "in_stock", isFeatured: false, isActive: true, images: ["https://images.unsplash.com/photo-1585515320310-259814833e62?w=600&h=600&fit=crop"], clickCount: 654, convRate: 2.1 },
  { id: "6", asin: "B0BTN3M4K3", slug: "north-face-thermoball", category: "fashion", name: { en: "North Face ThermoBall Eco Jacket", "bn-BD": "North Face ThermoBall Eco জ্যাকেট", sv: "North Face ThermoBall Eco jacka" }, description: { en: "Lightweight, packable synthetic insulation. Recycled materials.", "bn-BD": "হালকা, প্যাকেবল সিন্থেটিক ইনসুলেশন।", sv: "Lätt, packbar syntetisk isolering." }, features: ["ThermoBall Eco", "Recycled materials", "Packable", "Water resistant"], price: 17000, originalPrice: 23000, currency: "USD", rating: 4.1, reviewCount: 3456, brand: "The North Face", availability: "in_stock", isFeatured: true, isActive: true, images: ["https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600&h=600&fit=crop"], clickCount: 432, convRate: 1.9 },
  { id: "7", asin: "B0CFWZ6G17", slug: "atomic-habits", category: "books", name: { en: "Atomic Habits by James Clear", "bn-BD": "Atomic Habits - জেমস ক্লিয়ার", sv: "Atomic Habits av James Clear" }, description: { en: "A proven framework for improving every day. Tiny changes, remarkable results.", "bn-BD": "প্রতিদিন উন্নতির জন্য একটি প্রমাণিত কাঠামো।", sv: "Ett beprövat ramverk för daglig förbättring." }, features: ["NYT Bestseller", "Practical strategies", "Science-backed", "320 pages"], price: 1199, originalPrice: 2700, currency: "USD", rating: 4.9, reviewCount: 98765, brand: "James Clear", availability: "in_stock", isFeatured: true, isActive: true, images: ["https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=600&h=600&fit=crop"], clickCount: 3210, convRate: 6.4 },
  { id: "8", asin: "B0BSHF7WHW", slug: "samsung-galaxy-buds", category: "electronics", name: { en: "Samsung Galaxy Buds FE", "bn-BD": "Samsung Galaxy Buds FE", sv: "Samsung Galaxy Buds FE" }, description: { en: "ANC. Powerful sound with deep bass. Comfortable design.", "bn-BD": "ANC। গভীর বেস সহ শক্তিশালী সাউন্ড।", sv: "ANC. Kraftfullt ljud med djup bas." }, features: ["ANC", "6-hour battery", "IPX2", "Touch controls"], price: 6999, originalPrice: 9999, currency: "USD", rating: 3.5, reviewCount: 7890, brand: "Samsung", availability: "in_stock", isFeatured: false, isActive: true, images: ["https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=600&h=600&fit=crop"], clickCount: 321, convRate: 1.4 },
  { id: "9", asin: "B0D5R7PN4K", slug: "yoga-mat-premium", category: "sports", name: { en: "Manduka PRO Yoga Mat 6mm", "bn-BD": "Manduka PRO যোগা ম্যাট", sv: "Manduka PRO yogamatta 6mm" }, description: { en: "Dense cushioning for joint protection. Lifetime guarantee.", "bn-BD": "জয়েন্ট সুরক্ষার জন্য ঘন কুশনিং।", sv: "Tät stoppning för ledskydd." }, features: ["6mm thickness", "Closed-cell surface", "Lifetime guarantee", "Non-toxic"], price: 12000, originalPrice: 14000, currency: "USD", rating: 4.8, reviewCount: 5432, brand: "Manduka", availability: "in_stock", isFeatured: false, isActive: true, images: ["https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=600&h=600&fit=crop"], clickCount: 198, convRate: 2.5 },
  { id: "10", asin: "B0CG5TZ1X4", slug: "dyson-airwrap", category: "beauty", name: { en: "Dyson Airwrap Multi-Styler", "bn-BD": "Dyson Airwrap মাল্টি-স্টাইলার", sv: "Dyson Airwrap multistyler" }, description: { en: "Coanda airflow technology for multiple hair types.", "bn-BD": "একাধিক ধরনের চুলের জন্য Coanda এয়ারফ্লো।", sv: "Coanda-luftflödesteknik för flera hårtyper." }, features: ["Coanda technology", "Multiple attachments", "No extreme heat", "All hair types"], price: 59999, originalPrice: 59999, currency: "USD", rating: 3.2, reviewCount: 6789, brand: "Dyson", availability: "in_stock", isFeatured: true, isActive: true, images: ["https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=600&h=600&fit=crop"], clickCount: 876, convRate: 1.2 },
  { id: "11", asin: "B0BTMQYK23", slug: "ninja-blender-pro", category: "home", name: { en: "Ninja Professional Plus Blender", "bn-BD": "Ninja Professional Plus ব্লেন্ডার", sv: "Ninja Professional Plus mixer" }, description: { en: "1400 peak watts for ice crushing and blending.", "bn-BD": "বরফ ক্রাশিংয়ের জন্য 1400 পিক ওয়াট।", sv: "1400 peak watt för iskrossning." }, features: ["1400 peak watts", "Auto-iQ", "72oz pitcher", "BPA-free"], price: 7999, originalPrice: 10999, currency: "USD", rating: 4.0, reviewCount: 12345, brand: "Ninja", availability: "in_stock", isFeatured: false, isActive: true, images: ["https://images.unsplash.com/photo-1570222094114-d054a817e56b?w=600&h=600&fit=crop"], clickCount: 543, convRate: 2.8 },
  { id: "12", asin: "B0CX23V2ZK", slug: "fire-tv-stick-4k", category: "electronics", name: { en: "Fire TV Stick 4K Max", "bn-BD": "Fire TV Stick 4K Max", sv: "Fire TV Stick 4K Max" }, description: { en: "Most powerful 4K streaming stick with Wi-Fi 6E.", "bn-BD": "Wi-Fi 6E সহ সবচেয়ে শক্তিশালী 4K স্ট্রিমিং স্টিক।", sv: "Mest kraftfulla 4K-streamingstick med Wi-Fi 6E." }, features: ["4K Ultra HD", "Wi-Fi 6E", "Dolby Vision & Atmos", "Alexa Voice Remote"], price: 3499, originalPrice: 5999, currency: "USD", rating: 3.9, reviewCount: 23456, brand: "Amazon", availability: "in_stock", isFeatured: false, isActive: false, images: ["https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=600&h=600&fit=crop"], clickCount: 1567, convRate: 4.3 },
];

// ─── Helpers ────────────────────────────────────────────────────────────────
const t = (map, locale) => map?.[locale] ?? map?.en ?? "";
const formatPrice = (cents, currency = "USD", locale = "en") => new Intl.NumberFormat(locale === "bn-BD" ? "bn" : locale, { style: "currency", currency, numberingSystem: "latn" }).format(cents / 100);
const discount = (price, original) => original > price ? Math.round((1 - price / original) * 100) : 0;

// ─── Cart Context ───────────────────────────────────────────────────────────
const CartContext = createContext(null);
function CartProvider({ children }) {
  const [items, setItems] = useState(() => { try { return JSON.parse(localStorage.getItem("aff_cart")) || []; } catch { return []; } });
  useEffect(() => { localStorage.setItem("aff_cart", JSON.stringify(items)); }, [items]);
  const addItem = useCallback(p => setItems(prev => { const ex = prev.find(i => i.id === p.id); return ex ? prev.map(i => i.id === p.id ? { ...i, qty: Math.min(i.qty + 1, 99) } : i) : [...prev, { ...p, qty: 1 }]; }), []);
  const removeItem = useCallback(id => setItems(prev => prev.filter(i => i.id !== id)), []);
  const updateQty = useCallback((id, q) => { if (q <= 0) return setItems(p => p.filter(i => i.id !== id)); setItems(p => p.map(i => i.id === id ? { ...i, qty: Math.min(q, 99) } : i)); }, []);
  const clearCart = useCallback(() => setItems([]), []);
  const totalItems = items.reduce((s, i) => s + i.qty, 0);
  const totalPrice = items.reduce((s, i) => s + i.price * i.qty, 0);
  return <CartContext.Provider value={{ items, addItem, removeItem, updateQty, clearCart, totalItems, totalPrice }}>{children}</CartContext.Provider>;
}
const useCart = () => useContext(CartContext);

// ─── Icons ──────────────────────────────────────────────────────────────────
const I = ({ d, size = 20, color = "currentColor", sw = 2, fill = "none" }) => <svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">{d}</svg>;
const SearchIcon = (p) => <I {...p} d={<><circle cx={11} cy={11} r={8}/><path d="m21 21-4.3-4.3"/></>} />;
const XIcon = (p) => <I {...p} d={<path d="M18 6L6 18M6 6l12 12"/>} />;
const BagIcon = (p) => <I {...p} d={<><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1={3} y1={6} x2={21} y2={6}/><path d="M16 10a4 4 0 01-8 0"/></>} />;
const MenuIcon = (p) => <I {...p} d={<><line x1={3} y1={6} x2={21} y2={6}/><line x1={3} y1={12} x2={21} y2={12}/><line x1={3} y1={18} x2={21} y2={18}/></>} />;
const FilterIcon = (p) => <I {...p} d={<path d="M4 21v-7m0-4V3m8 18v-9m0-4V3m8 18v-5m0-4V3M1 14h6M9 8h6M17 16h6"/>} />;
const CheckIcon = (p) => <I {...p} d={<path d="M20 6L9 17l-5-5"/>} />;

// ─── Stars ──────────────────────────────────────────────────────────────────
const Stars = ({ rating, size = 14 }) => <span style={{ display: "inline-flex", gap: 1 }}>{[1,2,3,4,5].map(i => <svg key={i} width={size} height={size} viewBox="0 0 20 20" fill={i <= Math.round(rating) ? "#f59e0b" : "#e5e7eb"}><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>)}</span>;

// ─── Product Card ───────────────────────────────────────────────────────────
function ProductCard({ product, locale, onClick }) {
  const { addItem } = useCart();
  const disc = discount(product.price, product.originalPrice);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [hovered, setHovered] = useState(false);
  return (
    <div onClick={() => onClick(product)} onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}
      style={{ background: "#fff", borderRadius: 16, overflow: "hidden", cursor: "pointer", transition: "all .3s cubic-bezier(.4,0,.2,1)", transform: hovered ? "translateY(-4px)" : "none", boxShadow: hovered ? "0 20px 40px rgba(0,0,0,.08)" : "0 1px 3px rgba(0,0,0,.04)", border: "1px solid #f1f5f9", position: "relative" }}>
      {disc > 0 && <span style={{ position: "absolute", top: 10, left: 10, background: "#fbbf24", color: "#78350f", fontSize: 11, fontWeight: 600, padding: "2px 8px", borderRadius: 20, zIndex: 2 }}>-{disc}%</span>}
      <div style={{ aspectRatio: "1", background: "#f8fafc", overflow: "hidden", position: "relative" }}>
        <img src={product.images[0]} alt={t(product.name, locale)} loading="lazy" onLoad={() => setImgLoaded(true)} style={{ width: "100%", height: "100%", objectFit: "cover", opacity: imgLoaded ? 1 : 0, transition: "all .5s", transform: hovered ? "scale(1.05)" : "scale(1)" }} />
        {!imgLoaded && <div style={{ position: "absolute", inset: 0, background: "#f1f5f9", animation: "pulse 1.5s infinite" }} />}
      </div>
      <div style={{ padding: "12px 12px 14px" }}>
        <p style={{ fontSize: 10, color: "#94a3b8", fontWeight: 500, margin: "0 0 3px", textTransform: "uppercase", letterSpacing: ".05em" }}>{product.brand}</p>
        <h3 className="card-title">{t(product.name, locale)}</h3>
        <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "0 0 8px" }}><Stars rating={product.rating} size={11} /><span style={{ fontSize: 11, color: "#94a3b8" }}>{product.rating}</span></div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div><span className="card-price">{formatPrice(product.price, product.currency, locale)}</span>{disc > 0 && <span style={{ fontSize: 11, color: "#cbd5e1", textDecoration: "line-through", marginLeft: 4 }}>{formatPrice(product.originalPrice, product.currency, locale)}</span>}</div>
          <button onClick={e => { e.stopPropagation(); addItem(product); }} className="card-cart-btn" aria-label="Add to cart"><BagIcon size={15} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── Header ─────────────────────────────────────────────────────────────────
function Header({ locale, setLocale, onNavigate, currentPage }) {
  const { totalItems } = useCart();
  const str = translations[locale].nav;
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  useEffect(() => { const h = () => setScrolled(window.scrollY > 10); window.addEventListener("scroll", h, { passive: true }); return () => window.removeEventListener("scroll", h); }, []);
  useEffect(() => setMenuOpen(false), [currentPage]);
  const handleSearch = e => { e.preventDefault(); if (searchQuery.trim()) { onNavigate("search", { query: searchQuery.trim() }); setSearchOpen(false); setSearchQuery(""); setMenuOpen(false); } };
  const ll = { en: "EN", "bn-BD": "বাং", sv: "SV" };
  const navItems = [{ l: str.home, p: "home" }, { l: str.categories, p: "products" }, { l: str.deals, p: "products" }, { l: str.admin, p: "admin" }];

  return (
    <>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: scrolled ? "rgba(255,255,255,.92)" : "rgba(255,255,255,.98)", backdropFilter: "blur(20px)", borderBottom: `1px solid ${scrolled ? "#e2e8f0" : "transparent"}`, transition: "all .3s" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px", display: "flex", alignItems: "center", height: 58, gap: 10 }}>
          <button className="mobile-only" onClick={() => setMenuOpen(!menuOpen)} style={{ width: 40, height: 40, border: "none", background: "none", cursor: "pointer", display: "none", alignItems: "center", justifyContent: "center", color: "#64748b", padding: 0 }}>{menuOpen ? <XIcon /> : <MenuIcon />}</button>
          <button onClick={() => onNavigate("home")} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 7, padding: 0, flexShrink: 0 }}>
            <div style={{ width: 28, height: 28, borderRadius: 8, background: "linear-gradient(135deg, #4338ca, #6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 14, fontWeight: 700 }}>A</div>
            <span className="logo-text">AffiliStore</span>
          </button>
          <nav className="desktop-nav">{navItems.map(n => <button key={n.l} onClick={() => onNavigate(n.p)} style={{ background: "none", border: "none", cursor: "pointer", padding: "6px 12px", borderRadius: 8, fontSize: 14, fontWeight: 500, color: currentPage === n.p ? "#4338ca" : "#64748b" }}>{n.l}</button>)}</nav>
          <div style={{ flex: 1 }} />
          {searchOpen ? (
            <div style={{ position: "absolute", left: 0, right: 0, top: 0, height: 58, background: "#fff", display: "flex", alignItems: "center", padding: "0 16px", gap: 10, zIndex: 10 }}>
              <SearchIcon color="#94a3b8" /><input autoFocus value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && handleSearch(e)} placeholder={str.search} style={{ flex: 1, border: "none", outline: "none", fontSize: 16, fontFamily: "inherit", color: "#1e293b", background: "transparent" }} />
              <button onClick={() => { setSearchOpen(false); setSearchQuery(""); }} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#94a3b8" }}><XIcon /></button>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <button onClick={() => setSearchOpen(true)} className="icon-btn" aria-label="Search"><SearchIcon /></button>
              <select value={locale} onChange={e => setLocale(e.target.value)} className="locale-select">{Object.entries(ll).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
              <button onClick={() => onNavigate("cart")} className="icon-btn" style={{ position: "relative" }}><BagIcon />{totalItems > 0 && <span className="cart-badge">{totalItems}</span>}</button>
            </div>
          )}
        </div>
      </header>
      {menuOpen && <div className="mobile-menu-overlay" onClick={() => setMenuOpen(false)}><div className="mobile-menu" onClick={e => e.stopPropagation()}>
        <nav style={{ display: "flex", flexDirection: "column", gap: 2, padding: "12px 8px" }}>{navItems.map(n => <button key={n.l} onClick={() => { onNavigate(n.p); setMenuOpen(false); }} style={{ background: currentPage === n.p ? "#eef2ff" : "none", border: "none", cursor: "pointer", padding: "14px 16px", borderRadius: 12, fontSize: 16, fontWeight: 500, color: currentPage === n.p ? "#4338ca" : "#475569", textAlign: "left", fontFamily: "inherit" }}>{n.l}</button>)}</nav>
        <div style={{ borderTop: "1px solid #f1f5f9", padding: "12px 16px", display: "flex", gap: 8 }}>{Object.entries(ll).map(([k, v]) => <button key={k} onClick={() => { setLocale(k); setMenuOpen(false); }} style={{ flex: 1, padding: 10, borderRadius: 10, border: locale === k ? "2px solid #4338ca" : "1px solid #e2e8f0", background: locale === k ? "#eef2ff" : "#fff", color: locale === k ? "#4338ca" : "#64748b", fontWeight: 600, fontSize: 14, cursor: "pointer" }}>{v}</button>)}</div>
      </div></div>}
    </>
  );
}

// ─── Hero ───────────────────────────────────────────────────────────────────
function Hero({ locale, onNavigate }) {
  const s = translations[locale].hero;
  return (
    <section className="hero-section" style={{ position: "relative", overflow: "hidden", background: "linear-gradient(135deg, #312e81 0%, #4338ca 40%, #6366f1 100%)" }}>
      <div style={{ position: "absolute", inset: 0, opacity: .06 }}>{[...Array(5)].map((_, i) => <div key={i} style={{ position: "absolute", borderRadius: "50%", border: "1px solid #fff", width: 180 + i * 110, height: 180 + i * 110, top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />)}</div>
      <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center", position: "relative", zIndex: 1 }}>
        <h1 className="hero-title">{s.title}</h1><p className="hero-subtitle">{s.subtitle}</p>
        <button onClick={() => onNavigate("products")} className="hero-cta">{s.cta} →</button>
      </div>
    </section>
  );
}

// ─── Homepage ───────────────────────────────────────────────────────────────
function HomePage({ locale, onNavigate }) {
  const s = translations[locale].sections;
  return (
    <div>
      <Hero locale={locale} onNavigate={onNavigate} />
      <section style={{ maxWidth: 1280, margin: "0 auto" }} className="section-pad">
        <h2 className="section-heading" style={{ marginBottom: 16 }}>{s.categories}</h2>
        <div className="cat-grid">{categories.map(c => <button key={c.id} onClick={() => onNavigate("products", { category: c.id })} className="cat-card"><span style={{ fontSize: 24 }}>{c.icon}</span><span style={{ fontSize: 13, fontWeight: 600, color: "#475569" }}>{t(c.name, locale)}</span></button>)}</div>
      </section>
      <section style={{ maxWidth: 1280, margin: "0 auto" }} className="section-pad">
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}><h2 className="section-heading">{s.featured}</h2><button onClick={() => onNavigate("products")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 14, fontWeight: 500, color: "#4338ca" }}>{s.viewAll} →</button></div>
        <div className="product-grid">{products.filter(p => p.isFeatured).map(p => <ProductCard key={p.id} product={p} locale={locale} onClick={() => onNavigate("detail", { productId: p.id })} />)}</div>
      </section>
    </div>
  );
}

// ─── Filter Content (shared between desktop sidebar and mobile drawer) ─────
function FilterContent({ locale, filters, setFilters }) {
  const s = translations[locale].filters;
  return (
    <div>
      <div style={{ marginBottom: 22 }}>
        <h3 className="filter-heading">{s.category}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <button onClick={() => setFilters(f => ({ ...f, category: null }))} className={`filter-btn${!filters.category ? " active" : ""}`}>{s.all}</button>
          {categories.map(c => <button key={c.id} onClick={() => setFilters(f => ({ ...f, category: f.category === c.id ? null : c.id }))} className={`filter-btn${filters.category === c.id ? " active" : ""}`}><span>{c.icon}</span> {t(c.name, locale)}</button>)}
        </div>
      </div>
      <div style={{ marginBottom: 22 }}>
        <h3 className="filter-heading">{s.price}</h3>
        <input type="range" min={0} max={600} step={10} value={filters.maxPrice} onChange={e => setFilters(f => ({ ...f, maxPrice: +e.target.value }))} style={{ width: "100%", accentColor: "#4338ca" }} />
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#94a3b8", marginTop: 4 }}><span>$0</span><span>${filters.maxPrice}</span></div>
      </div>
      <div style={{ marginBottom: 22 }}>
        <h3 className="filter-heading">{s.rating}</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {[{ v: 4.5, st: 5 }, { v: 4, st: 4 }, { v: 3.5, st: 3 }].map(({ v, st }) => {
            const cnt = products.filter(p => p.rating >= v).length;
            return <button key={v} onClick={() => setFilters(f => ({ ...f, minRating: f.minRating === v ? 0 : v }))} className={`filter-btn${filters.minRating === v ? " active" : ""}`}><Stars rating={st} size={11} /><span style={{ fontSize: 12 }}>{v}+ {s.andUp}</span><span style={{ fontSize: 11, color: "#cbd5e1", marginLeft: "auto" }}>({cnt})</span></button>;
          })}
          <button onClick={() => setFilters(f => ({ ...f, minRating: 0 }))} className={`filter-btn${filters.minRating === 0 ? " active" : ""}`}><Stars rating={5} size={11} /><span style={{ fontSize: 12 }}>{s.all}</span><span style={{ fontSize: 11, color: "#cbd5e1", marginLeft: "auto" }}>({products.length})</span></button>
        </div>
      </div>
      {(filters.category || filters.minRating > 0 || filters.maxPrice < 600) && <button onClick={() => setFilters({ category: null, maxPrice: 600, minRating: 0, sort: "popular" })} className="clear-filters-btn">{s.clearAll}</button>}
    </div>
  );
}

// ─── Product Listing ────────────────────────────────────────────────────────
function ProductListingPage({ locale, onNavigate, initialCategory, searchQuery }) {
  const s = translations[locale].filters;
  const [filters, setFilters] = useState({ category: initialCategory || null, maxPrice: 600, minRating: 0, sort: "popular" });
  const [drawerOpen, setDrawerOpen] = useState(false);
  useEffect(() => { if (initialCategory) setFilters(f => ({ ...f, category: initialCategory })); }, [initialCategory]);
  let filtered = products.filter(p => {
    if (!p.isActive) return false;
    if (filters.category && p.category !== filters.category) return false;
    if (p.price / 100 > filters.maxPrice) return false;
    if (filters.minRating > 0 && p.rating < filters.minRating) return false;
    if (searchQuery) { const q = searchQuery.toLowerCase(); if (!t(p.name, locale).toLowerCase().includes(q) && !t(p.description, locale).toLowerCase().includes(q) && !p.brand.toLowerCase().includes(q)) return false; }
    return true;
  });
  if (filters.sort === "priceLow") filtered.sort((a, b) => a.price - b.price);
  else if (filters.sort === "priceHigh") filtered.sort((a, b) => b.price - a.price);
  else if (filters.sort === "rating") filtered.sort((a, b) => b.rating - a.rating);
  const aCnt = (filters.category ? 1 : 0) + (filters.minRating > 0 ? 1 : 0) + (filters.maxPrice < 600 ? 1 : 0);

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }} className="section-pad">
      {searchQuery && <div style={{ marginBottom: 16 }}><h1 className="section-heading">{s.results}: "{searchQuery}"</h1></div>}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button className="mobile-only mobile-filter-trigger" onClick={() => setDrawerOpen(true)}><FilterIcon size={15} /><span>{s.filters}</span>{aCnt > 0 && <span className="filter-count-badge">{aCnt}</span>}</button>
          <span style={{ fontSize: 14, color: "#94a3b8" }}>{filtered.length} {s.products}</span>
        </div>
        <select value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))} className="sort-select"><option value="popular">{s.popular}</option><option value="priceLow">{s.priceLow}</option><option value="priceHigh">{s.priceHigh}</option><option value="rating">{s.ratingSort}</option></select>
      </div>
      <div style={{ display: "flex", gap: 0 }}>
        <div className="desktop-filter-sidebar"><FilterContent locale={locale} filters={filters} setFilters={setFilters} /></div>
        <div style={{ flex: 1, minWidth: 0 }}>
          {filtered.length === 0 ? <div style={{ textAlign: "center", padding: "60px 16px" }}><SearchIcon size={48} color="#cbd5e1" /><p style={{ fontSize: 16, fontWeight: 500, margin: "16px 0 8px", color: "#64748b" }}>No products found</p></div>
          : <div className="product-grid">{filtered.map(p => <ProductCard key={p.id} product={p} locale={locale} onClick={() => onNavigate("detail", { productId: p.id })} />)}</div>}
        </div>
      </div>
      {drawerOpen && <div className="filter-drawer-overlay" onClick={() => setDrawerOpen(false)}><div className="filter-drawer" onClick={e => e.stopPropagation()}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid #f1f5f9" }}><h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>{s.filters}</h3><button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#94a3b8", padding: 0 }}><XIcon /></button></div>
        <div style={{ padding: 20, overflowY: "auto", flex: 1 }}><FilterContent locale={locale} filters={filters} setFilters={setFilters} /></div>
        <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9" }}><button onClick={() => setDrawerOpen(false)} className="filter-apply-btn">{s.applyFilters} ({filtered.length})</button></div>
      </div></div>}
    </div>
  );
}

// ─── Product Detail ─────────────────────────────────────────────────────────
function ProductDetailPage({ locale, productId, onNavigate }) {
  const product = products.find(p => p.id === productId);
  const { addItem } = useCart();
  const s = translations[locale].product;
  const ns = translations[locale].nav;
  const [selImg, setSelImg] = useState(0);
  const [tab, setTab] = useState("description");
  const [added, setAdded] = useState(false);
  if (!product) return <div style={{ textAlign: "center", padding: "100px 16px" }}><p style={{ fontSize: 20, fontWeight: 600, color: "#1e293b", marginBottom: 12 }}>{translations[locale].errors.notFound}</p><button onClick={() => onNavigate("home")} className="hero-cta">{translations[locale].errors.goBack}</button></div>;
  const disc = discount(product.price, product.originalPrice);
  const cat = categories.find(c => c.id === product.category);
  const doAdd = () => { addItem(product); setAdded(true); setTimeout(() => setAdded(false), 2000); };
  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }} className="section-pad">
      <nav className="breadcrumbs"><button onClick={() => onNavigate("home")}>{ns.home}</button><span>/</span>{cat && <><button onClick={() => onNavigate("products", { category: cat.id })}>{t(cat.name, locale)}</button><span>/</span></>}<span style={{ color: "#64748b" }}>{t(product.name, locale)}</span></nav>
      <div className="pdp-grid">
        <div>
          <div style={{ aspectRatio: "1", borderRadius: 16, overflow: "hidden", background: "#f8fafc", marginBottom: 10 }}><img src={product.images[selImg]} alt={t(product.name, locale)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          {product.images.length > 1 && <div style={{ display: "flex", gap: 6 }}>{product.images.map((img, i) => <button key={i} onClick={() => setSelImg(i)} style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", border: selImg === i ? "2px solid #4338ca" : "1px solid #e2e8f0", cursor: "pointer", padding: 0, background: "#f8fafc" }}><img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /></button>)}</div>}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: "#94a3b8", margin: 0, textTransform: "uppercase", letterSpacing: ".08em" }}>{product.brand}</p>
          <h1 className="pdp-name">{t(product.name, locale)}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}><Stars rating={product.rating} /><span style={{ fontWeight: 600 }}>{product.rating}</span><span style={{ fontSize: 14, color: "#94a3b8" }}>({product.reviewCount.toLocaleString()} {s.reviews})</span></div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}><span className="pdp-price">{formatPrice(product.price, product.currency, locale)}</span>{disc > 0 && <><span style={{ fontSize: 16, color: "#cbd5e1", textDecoration: "line-through" }}>{formatPrice(product.originalPrice, product.currency, locale)}</span><span style={{ background: "#fef3c7", color: "#92400e", fontSize: 12, fontWeight: 600, padding: "3px 10px", borderRadius: 20 }}>-{disc}% {s.off}</span></>}</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14, color: product.availability === "in_stock" ? "#16a34a" : "#ef4444" }}><div style={{ width: 8, height: 8, borderRadius: 4, background: product.availability === "in_stock" ? "#16a34a" : "#ef4444" }} />{product.availability === "in_stock" ? s.inStock : s.outOfStock}</div>
          <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.7, margin: "2px 0" }}>{t(product.description, locale)}</p>
          <button onClick={() => window.open(`https://www.amazon.com/dp/${product.asin}?tag=affilistore-20`, "_blank", "noopener")} className="btn-amazon">{s.buyOnAmazon} →</button>
          <button onClick={doAdd} className="btn-cart-add">{added ? "✓ Added!" : s.addToCart}</button>
          <p style={{ fontSize: 11, color: "#cbd5e1" }}>{s.priceUpdated}: 2 {s.hoursAgo}</p>
        </div>
      </div>
      <div style={{ marginTop: 36, borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
        <div style={{ display: "flex", borderBottom: "1px solid #f1f5f9", marginBottom: 16 }}>{["description", "features"].map(tb => <button key={tb} onClick={() => setTab(tb)} className={`tab-btn${tab === tb ? " active" : ""}`}>{tb === "description" ? s.description : s.features}</button>)}</div>
        {tab === "description" && <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.8, maxWidth: 720 }}>{t(product.description, locale)}</p>}
        {tab === "features" && <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 8 }}>{product.features.map((f, i) => <li key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 14, color: "#475569" }}><span style={{ width: 20, height: 20, borderRadius: 6, background: "#eef2ff", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}><CheckIcon size={12} color="#4338ca" sw={3} /></span>{f}</li>)}</ul>}
      </div>
    </div>
  );
}

// ─── Cart Page ──────────────────────────────────────────────────────────────
function CartPage({ locale, onNavigate }) {
  const { items, removeItem, updateQty, totalItems, totalPrice } = useCart();
  const cs = translations[locale].cart;
  const ps = translations[locale].product;
  if (!items.length) return <div style={{ maxWidth: 480, margin: "0 auto", padding: "80px 16px", textAlign: "center" }}><div style={{ width: 72, height: 72, borderRadius: 20, background: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px" }}><BagIcon size={32} color="#cbd5e1" /></div><h2 className="section-heading">{cs.empty}</h2><p style={{ fontSize: 15, color: "#94a3b8", margin: "8px 0 28px" }}>{cs.emptyDesc}</p><button onClick={() => onNavigate("products")} className="hero-cta">{cs.continueShopping}</button></div>;
  return (
    <div style={{ maxWidth: 960, margin: "0 auto" }} className="section-pad">
      <h1 className="section-heading" style={{ marginBottom: 20 }}>{cs.title} <span style={{ color: "#94a3b8", fontWeight: 400, fontSize: 18 }}>({totalItems} {cs.items})</span></h1>
      <div className="cart-grid">
        <div>{items.map((item, i) => <div key={item.id} className="cart-item" style={{ borderBottom: i < items.length - 1 ? "1px solid #f1f5f9" : "none" }}>
          <div onClick={() => onNavigate("detail", { productId: item.id })} className="cart-thumb"><img src={item.images[0]} alt={t(item.name, locale)} style={{ width: "100%", height: "100%", objectFit: "cover" }} /></div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 onClick={() => onNavigate("detail", { productId: item.id })} className="cart-item-name">{t(item.name, locale)}</h3>
            <p style={{ fontSize: 12, color: "#94a3b8", margin: "2px 0 10px" }}>{item.brand}</p>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <div className="qty-control"><button onClick={() => updateQty(item.id, item.qty - 1)} className="qty-btn">-</button><span style={{ width: 32, textAlign: "center", fontSize: 14, fontWeight: 600 }}>{item.qty}</span><button onClick={() => updateQty(item.id, item.qty + 1)} className="qty-btn">+</button></div>
              <button onClick={() => removeItem(item.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "#ef4444" }}>{ps.removeFromCart}</button>
              <span className="cart-item-price">{formatPrice(item.price * item.qty, item.currency, locale)}</span>
            </div>
          </div>
        </div>)}</div>
        <div><div className="cart-summary">
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 14px" }}>{cs.subtotal}</h3>
          {items.map(i => <div key={i.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 13, color: "#64748b", marginBottom: 6 }}><span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "60%" }}>{t(i.name, locale)} ×{i.qty}</span><span>{formatPrice(i.price * i.qty, i.currency, locale)}</span></div>)}
          <div style={{ borderTop: "1px solid #e2e8f0", marginTop: 12, paddingTop: 12, display: "flex", justifyContent: "space-between", fontSize: 18, fontWeight: 700 }}><span>{cs.total}</span><span style={{ color: "#4338ca" }}>{formatPrice(totalPrice, "USD", locale)}</span></div>
          <button onClick={() => items.forEach(i => window.open(`https://www.amazon.com/dp/${i.asin}?tag=affilistore-20`, "_blank", "noopener"))} className="btn-amazon" style={{ marginTop: 14 }}>{cs.checkout} →</button>
          <p style={{ fontSize: 11, color: "#94a3b8", textAlign: "center", margin: "10px 0 0" }}>{cs.checkoutNote}</p>
        </div></div>
      </div>
    </div>
  );
}

// ─── Admin Dashboard ────────────────────────────────────────────────────────
function AdminDashboard({ locale, onNavigate }) {
  const s = translations[locale].admin;
  const [adminProducts, setAdminProducts] = useState(products.map(p => ({ ...p })));
  const [tab, setTab] = useState("overview");

  const totalClicks = adminProducts.reduce((sum, p) => sum + p.clickCount, 0);
  const avgRating = (adminProducts.reduce((sum, p) => sum + p.rating, 0) / adminProducts.length).toFixed(1);
  const activeCount = adminProducts.filter(p => p.isActive).length;
  const featuredCount = adminProducts.filter(p => p.isFeatured).length;
  const estRevenue = Math.round(totalClicks * 0.034 * 28.5);

  const toggleActive = id => setAdminProducts(p => p.map(x => x.id === id ? { ...x, isActive: !x.isActive } : x));
  const toggleFeatured = id => setAdminProducts(p => p.map(x => x.id === id ? { ...x, isFeatured: !x.isFeatured } : x));

  const locales = ["en", "bn-BD", "sv"];
  const tStats = locales.map(l => { const tot = adminProducts.length; const cov = adminProducts.filter(p => p.name[l] && p.description[l]).length; return { locale: l, total: tot, covered: cov, pct: Math.round(cov / tot * 100) }; });
  const topClicked = [...adminProducts].sort((a, b) => b.clickCount - a.clickCount);

  const stats = [
    { label: s.totalProducts, value: adminProducts.length, color: "#4338ca" },
    { label: s.activeProducts, value: activeCount, color: "#16a34a" },
    { label: s.featuredProducts, value: featuredCount, color: "#d97706" },
    { label: s.totalClicks, value: totalClicks.toLocaleString(), color: "#0891b2" },
    { label: s.avgRating, value: avgRating, color: "#f59e0b" },
    { label: s.estRevenue, value: `$${estRevenue.toLocaleString()}`, color: "#16a34a" },
  ];

  const tabs = [{ id: "overview", l: s.overview }, { id: "products", l: s.productMgmt }, { id: "analytics", l: s.analytics }, { id: "translations", l: s.translations }];

  return (
    <div style={{ maxWidth: 1280, margin: "0 auto" }} className="section-pad">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <h1 className="section-heading" style={{ marginBottom: 0 }}>{s.title}</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "#94a3b8" }}><div style={{ width: 8, height: 8, borderRadius: 4, background: "#16a34a" }} />{s.lastSync}: 2 {s.hoursAgo}</div>
      </div>
      <div className="admin-tabs">{tabs.map(tb => <button key={tb.id} onClick={() => setTab(tb.id)} className={`tab-btn${tab === tb.id ? " active" : ""}`}>{tb.l}</button>)}</div>

      {tab === "overview" && <>
        <div className="stats-grid">{stats.map((st, i) => <div key={i} className="stat-card" style={{ borderLeft: `3px solid ${st.color}` }}><p style={{ fontSize: 12, color: "#94a3b8", margin: "0 0 6px", fontWeight: 500 }}>{st.label}</p><p style={{ fontSize: 26, fontWeight: 700, color: "#1e293b", margin: 0 }}>{st.value}</p></div>)}</div>
        <div className="admin-card" style={{ marginTop: 20 }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", margin: "0 0 16px" }}>{s.analytics} — Top 5</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>{topClicked.slice(0, 5).map(p => {
            const pct = Math.round(p.clickCount / topClicked[0].clickCount * 100);
            return <div key={p.id}><div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4 }}><span style={{ color: "#475569", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: "65%" }}>{t(p.name, locale)}</span><span style={{ color: "#94a3b8", flexShrink: 0 }}>{p.clickCount.toLocaleString()}</span></div><div style={{ height: 8, background: "#f1f5f9", borderRadius: 4, overflow: "hidden" }}><div style={{ height: "100%", width: `${pct}%`, background: "linear-gradient(90deg,#4338ca,#6366f1)", borderRadius: 4 }} /></div></div>;
          })}</div>
        </div>
      </>}

      {tab === "products" && <div className="admin-card" style={{ overflowX: "auto" }}>
        <table className="admin-table"><thead><tr><th style={{ textAlign: "left" }}>{s.product}</th><th>{s.category}</th><th>{s.price}</th><th>{s.rating}</th><th>{s.status}</th><th>{s.featured}</th></tr></thead>
          <tbody>{adminProducts.map(p => { const cat = categories.find(c => c.id === p.category); return <tr key={p.id}>
            <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><img src={p.images[0]} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: "cover" }} /><div style={{ minWidth: 0 }}><p style={{ fontSize: 13, fontWeight: 600, color: "#1e293b", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 180 }}>{t(p.name, locale)}</p><p style={{ fontSize: 11, color: "#94a3b8", margin: 0 }}>{p.brand}</p></div></div></td>
            <td><span className="table-badge" style={{ background: (cat?.color || "#888") + "18", color: cat?.color }}>{cat?.icon} {t(cat?.name, locale)}</span></td>
            <td style={{ fontWeight: 600, color: "#4338ca" }}>{formatPrice(p.price, p.currency, locale)}</td>
            <td><Stars rating={p.rating} size={10} /> <span style={{ fontSize: 12 }}>{p.rating}</span></td>
            <td><button onClick={() => toggleActive(p.id)} className={`toggle-btn${p.isActive ? " on" : ""}`}><div className="toggle-thumb" /></button></td>
            <td><button onClick={() => toggleFeatured(p.id)} className={`toggle-btn small${p.isFeatured ? " on" : ""}`}><div className="toggle-thumb" /></button></td>
          </tr>; })}</tbody>
        </table>
      </div>}

      {tab === "analytics" && <div className="admin-card" style={{ overflowX: "auto" }}>
        <table className="admin-table"><thead><tr><th style={{ textAlign: "left" }}>{s.product}</th><th>{s.clicks}</th><th>{s.convRate}</th><th>{s.price}</th><th>{s.rating}</th></tr></thead>
          <tbody>{topClicked.map(p => <tr key={p.id} onClick={() => onNavigate("detail", { productId: p.id })} style={{ cursor: "pointer" }}>
            <td><div style={{ display: "flex", alignItems: "center", gap: 10 }}><img src={p.images[0]} alt="" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} /><span style={{ fontSize: 13, fontWeight: 500, color: "#1e293b" }}>{t(p.name, locale)}</span></div></td>
            <td style={{ fontWeight: 600 }}>{p.clickCount.toLocaleString()}</td>
            <td><span style={{ color: p.convRate >= 3 ? "#16a34a" : "#f59e0b", fontWeight: 600 }}>{p.convRate}%</span></td>
            <td>{formatPrice(p.price, p.currency, locale)}</td>
            <td><Stars rating={p.rating} size={10} /></td>
          </tr>)}</tbody>
        </table>
      </div>}

      {tab === "translations" && <div className="admin-card">
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>{tStats.map(st => <div key={st.locale}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}><div style={{ display: "flex", alignItems: "center", gap: 8 }}><span style={{ fontSize: 14, fontWeight: 600, color: "#1e293b" }}>{st.locale}</span><span style={{ fontSize: 12, color: "#94a3b8" }}>{st.covered}/{st.total}</span></div><span style={{ fontSize: 14, fontWeight: 700, color: st.pct === 100 ? "#16a34a" : st.pct >= 80 ? "#f59e0b" : "#ef4444" }}>{st.pct}%</span></div>
          <div style={{ height: 10, background: "#f1f5f9", borderRadius: 5, overflow: "hidden" }}><div style={{ height: "100%", width: `${st.pct}%`, background: st.pct === 100 ? "#16a34a" : st.pct >= 80 ? "#f59e0b" : "#ef4444", borderRadius: 5 }} /></div>
        </div>)}</div>
        <div style={{ marginTop: 20, padding: 16, background: "#f8fafc", borderRadius: 12 }}>
          <h4 style={{ fontSize: 14, fontWeight: 600, color: "#1e293b", margin: "0 0 10px" }}>Missing translations</h4>
          {adminProducts.filter(p => !p.name["bn-BD"] || !p.description["bn-BD"] || !p.name.sv || !p.description.sv).map(p => <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #f1f5f9", fontSize: 13 }}><span style={{ color: "#475569" }}>{t(p.name, locale)}</span><div style={{ display: "flex", gap: 4 }}>{!p.name["bn-BD"] && <span style={{ background: "#fef2f2", color: "#ef4444", padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>bn-BD</span>}{!p.name.sv && <span style={{ background: "#fef2f2", color: "#ef4444", padding: "2px 6px", borderRadius: 6, fontSize: 10, fontWeight: 600 }}>sv</span>}</div></div>)}
          {adminProducts.every(p => p.name["bn-BD"] && p.name.sv) && <p style={{ fontSize: 13, color: "#16a34a", margin: 0 }}>All translations complete!</p>}
        </div>
      </div>}
    </div>
  );
}

// ─── Footer ─────────────────────────────────────────────────────────────────
function Footer({ locale }) {
  const s = translations[locale].footer;
  return (
    <footer style={{ borderTop: "1px solid #f1f5f9", background: "#fafbfc" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 16px 20px" }}>
        <div className="footer-content">
          <div style={{ maxWidth: 300 }}><div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 8 }}><div style={{ width: 24, height: 24, borderRadius: 6, background: "linear-gradient(135deg,#4338ca,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 12, fontWeight: 700 }}>A</div><span style={{ fontSize: 14, fontWeight: 700, color: "#1e293b" }}>AffiliStore</span></div><p style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.6, margin: 0 }}>{s.disclosure}</p></div>
          <div className="footer-links">{[{ t: "Product", i: ["Featured", "New Arrivals", "Best Sellers"] }, { t: "Company", i: ["About", "Privacy", "Terms"] }].map(c => <div key={c.t}><p style={{ fontSize: 11, fontWeight: 700, color: "#1e293b", margin: "0 0 8px", textTransform: "uppercase", letterSpacing: ".06em" }}>{c.t}</p><div style={{ display: "flex", flexDirection: "column", gap: 5 }}>{c.i.map(x => <span key={x} style={{ fontSize: 13, color: "#94a3b8", cursor: "pointer" }}>{x}</span>)}</div></div>)}</div>
        </div>
        <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: 16, fontSize: 12, color: "#cbd5e1", textAlign: "center" }}>© 2026 AffiliStore. {s.rights}</div>
      </div>
    </footer>
  );
}

// ─── App ────────────────────────────────────────────────────────────────────
export default function App() {
  const [locale, setLocale] = useState("en");
  const [page, setPage] = useState({ name: "home", params: {} });
  const onNavigate = useCallback((name, params = {}) => { setPage({ name, params }); window.scrollTo({ top: 0, behavior: "smooth" }); }, []);
  const isBn = locale === "bn-BD";
  return (
    <CartProvider>
      <div style={{ fontFamily: isBn ? "'Noto Sans Bengali','DM Sans',sans-serif" : "'DM Sans',sans-serif", lineHeight: isBn ? 1.7 : 1.5, minHeight: "100vh", background: "#fff", color: "#1e293b", WebkitFontSmoothing: "antialiased" }}>
        <link rel="preconnect" href="https://fonts.googleapis.com" /><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Instrument+Serif&family=Noto+Sans+Bengali:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
*,*::before,*::after{box-sizing:border-box}body{margin:0}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
::selection{background:#c7d2fe;color:#312e81}
.section-pad{padding:28px 16px 40px}
.section-heading{font-size:22px;font-weight:700;color:#1e293b;margin:0 0 4px;font-family:'Instrument Serif',serif}
.hero-section{padding:56px 16px 64px}
.hero-title{font-size:clamp(26px,5vw,46px);font-weight:700;color:#fff;margin:0 0 12px;line-height:1.15;font-family:'Instrument Serif',serif}
.hero-subtitle{font-size:clamp(14px,2vw,17px);color:rgba(255,255,255,.72);margin:0 0 26px;line-height:1.6}
.hero-cta{background:#fbbf24;color:#78350f;border:none;border-radius:12px;padding:12px 26px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 20px rgba(251,191,36,.3)}
.hero-cta:hover{transform:translateY(-2px);box-shadow:0 8px 28px rgba(251,191,36,.4)}
.logo-text{font-size:16px;font-weight:700;color:#1e293b;font-family:'Instrument Serif',serif;letter-spacing:-.02em}
.icon-btn{width:38px;height:38px;border-radius:10px;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;color:#64748b;transition:all .15s;flex-shrink:0;padding:0}
.icon-btn:hover{background:#f1f5f9}
.locale-select{appearance:none;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:5px 8px;font-size:12px;font-weight:600;color:#64748b;cursor:pointer;font-family:inherit;width:48px;text-align:center}
.cart-badge{position:absolute;top:3px;right:3px;width:16px;height:16px;border-radius:50%;background:#4338ca;color:#fff;font-size:9px;font-weight:700;display:flex;align-items:center;justify-content:center}
.desktop-nav{display:flex;gap:2px;margin-left:10px}
.card-title{font-size:13px;font-weight:600;color:#1e293b;margin:0 0 6px;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.card-price{font-size:16px;font-weight:700;color:#4338ca}
.card-cart-btn{width:32px;height:32px;border-radius:8px;border:1px solid #e2e8f0;background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;color:#4338ca;flex-shrink:0;padding:0}
.card-cart-btn:hover{background:#4338ca;color:#fff;border-color:#4338ca}
.product-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:14px}
.cat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.cat-card{background:#fff;border:1px solid #f1f5f9;border-radius:12px;padding:14px 10px;cursor:pointer;text-align:center;transition:all .25s;display:flex;flex-direction:column;align-items:center;gap:6px;font-family:inherit}
.filter-heading{font-size:12px;font-weight:700;color:#1e293b;margin:0 0 8px;text-transform:uppercase;letter-spacing:.06em}
.filter-btn{background:transparent;border:none;border-radius:8px;padding:7px 10px;font-size:13px;font-weight:400;color:#64748b;cursor:pointer;text-align:left;transition:all .12s;font-family:inherit;display:flex;align-items:center;gap:6px;width:100%}
.filter-btn.active{background:#eef2ff;color:#4338ca;font-weight:600}
.clear-filters-btn{background:none;border:1px solid #e2e8f0;border-radius:8px;padding:8px 14px;font-size:13px;color:#64748b;cursor:pointer;width:100%;font-family:inherit}
.desktop-filter-sidebar{width:210px;flex-shrink:0;padding-right:20px}
.sort-select{appearance:none;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:7px 30px 7px 12px;font-size:13px;font-weight:500;color:#64748b;cursor:pointer;font-family:inherit;background-image:url("data:image/svg+xml,%3Csvg width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E");background-repeat:no-repeat;background-position:right 10px center}
.breadcrumbs{display:flex;align-items:center;gap:6px;font-size:13px;color:#94a3b8;margin-bottom:18px;flex-wrap:wrap}
.breadcrumbs button{background:none;border:none;cursor:pointer;color:#94a3b8;font-size:13px;padding:0;font-family:inherit}
.pdp-grid{display:grid;grid-template-columns:1fr 1fr;gap:36px}
.pdp-name{font-size:clamp(20px,3vw,26px);font-weight:700;color:#1e293b;margin:0;line-height:1.3;font-family:'Instrument Serif',serif}
.pdp-price{font-size:clamp(22px,4vw,28px);font-weight:700;color:#4338ca}
.btn-amazon{background:linear-gradient(135deg,#f59e0b,#d97706);color:#fff;border:none;border-radius:14px;padding:14px 20px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;transition:all .2s;box-shadow:0 4px 16px rgba(245,158,11,.3);width:100%;text-align:center}
.btn-amazon:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(245,158,11,.4)}
.btn-cart-add{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:12px 20px;font-size:15px;font-weight:600;cursor:pointer;color:#1e293b;font-family:inherit;transition:all .15s;width:100%}
.btn-cart-add:hover{border-color:#4338ca;color:#4338ca;background:#eef2ff}
.tab-btn{background:none;border:none;border-bottom:2px solid transparent;padding:10px 14px;font-size:14px;font-weight:500;color:#94a3b8;cursor:pointer;transition:all .15s;font-family:inherit;white-space:nowrap}
.tab-btn.active{color:#4338ca;border-bottom-color:#4338ca}
.cart-grid{display:grid;grid-template-columns:1fr 300px;gap:24px}
.cart-item{display:flex;gap:12px;padding:16px 0}
.cart-thumb{width:80px;height:80px;border-radius:12px;overflow:hidden;background:#f8fafc;flex-shrink:0;cursor:pointer}
.cart-item-name{font-size:14px;font-weight:600;color:#1e293b;margin:0;cursor:pointer}
.cart-item-price{font-size:15px;font-weight:700;color:#4338ca;margin-left:auto}
.qty-control{display:flex;align-items:center;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden}
.qty-btn{width:30px;height:30px;border:none;background:#f8fafc;cursor:pointer;font-size:15px;color:#64748b;display:flex;align-items:center;justify-content:center}
.cart-summary{background:#f8fafc;border-radius:18px;padding:20px;position:sticky;top:76px}
.footer-content{display:flex;align-items:flex-start;justify-content:space-between;gap:20px}
.footer-links{display:flex;gap:40px}
.admin-tabs{display:flex;gap:0;border-bottom:1px solid #f1f5f9;margin-bottom:20px;overflow-x:auto;-webkit-overflow-scrolling:touch}
.stats-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.stat-card{background:#fff;border:1px solid #f1f5f9;border-radius:12px;padding:16px 18px}
.admin-card{background:#fff;border:1px solid #f1f5f9;border-radius:14px;padding:20px}
.admin-table{width:100%;border-collapse:collapse;font-size:13px;min-width:560px}
.admin-table th{text-align:center;padding:8px 10px;color:#94a3b8;font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:.05em;border-bottom:1px solid #f1f5f9}
.admin-table td{padding:10px;border-bottom:1px solid #f8fafc;text-align:center;vertical-align:middle}
.admin-table tr:hover{background:#fafbfc}
.table-badge{padding:3px 8px;border-radius:6px;font-size:11px;font-weight:600;white-space:nowrap}
.toggle-btn{width:38px;height:20px;border-radius:10px;border:none;background:#e2e8f0;cursor:pointer;position:relative;transition:background .2s;padding:0;display:inline-flex;align-items:center}
.toggle-btn.on{background:#4338ca}
.toggle-btn .toggle-thumb{width:14px;height:14px;border-radius:50%;background:#fff;position:absolute;left:3px;transition:left .2s;box-shadow:0 1px 2px rgba(0,0,0,.15)}
.toggle-btn.on .toggle-thumb{left:21px}
.toggle-btn.small{width:34px;height:18px}
.toggle-btn.small .toggle-thumb{width:12px;height:12px}
.toggle-btn.small.on .toggle-thumb{left:19px}
.filter-count-badge{background:#4338ca;color:#fff;font-size:10px;font-weight:700;width:18px;height:18px;border-radius:50%;display:flex;align-items:center;justify-content:center}
.filter-apply-btn{width:100%;background:#4338ca;color:#fff;border:none;border-radius:12px;padding:13px;font-size:15px;font-weight:600;cursor:pointer;font-family:inherit}
.mobile-menu-overlay{position:fixed;inset:0;top:58px;background:rgba(0,0,0,.3);z-index:90;animation:fadeIn .2s}
.mobile-menu{background:#fff;border-radius:0 0 16px 16px;box-shadow:0 20px 40px rgba(0,0,0,.1);max-height:calc(100vh - 58px);overflow-y:auto}
.filter-drawer-overlay{position:fixed;inset:0;background:rgba(0,0,0,.4);z-index:200;display:flex;align-items:flex-end}
.filter-drawer{background:#fff;border-radius:18px 18px 0 0;width:100%;max-height:85vh;display:flex;flex-direction:column;animation:slideUp .3s ease}
.mobile-only{display:none!important}
.mobile-filter-trigger{display:none!important;align-items:center;gap:6px;background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:7px 12px;font-size:13px;font-weight:500;color:#64748b;cursor:pointer;font-family:inherit}
input[type=range]{height:6px}
input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:18px;height:18px;border-radius:50%;background:#4338ca;cursor:pointer;border:3px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.2)}
@media(max-width:1024px){.desktop-filter-sidebar{width:180px}.cart-grid{grid-template-columns:1fr 260px}.stats-grid{grid-template-columns:repeat(3,1fr)}}
@media(max-width:768px){.desktop-nav{display:none!important}.desktop-filter-sidebar{display:none!important}.mobile-only{display:flex!important}.mobile-filter-trigger{display:flex!important}.pdp-grid{grid-template-columns:1fr!important;gap:20px!important}.cart-grid{grid-template-columns:1fr!important}.footer-content{flex-direction:column}.stats-grid{grid-template-columns:repeat(2,1fr)}.admin-card{padding:14px}.product-grid{grid-template-columns:repeat(2,1fr);gap:10px}.cat-grid{grid-template-columns:repeat(3,1fr)}.hero-section{padding:44px 16px 52px}.cart-thumb{width:68px;height:68px}.cart-item-price{margin-left:0}.cart-item{flex-wrap:wrap}.tab-btn{padding:8px 10px;font-size:13px}.logo-text{font-size:14px}.section-pad{padding:20px 14px 32px}}
@media(max-width:480px){.product-grid{grid-template-columns:repeat(2,1fr);gap:8px}.cat-grid{grid-template-columns:repeat(2,1fr)}.stats-grid{grid-template-columns:1fr 1fr;gap:8px}.stat-card{padding:12px 14px}.card-title{font-size:12px}.card-price{font-size:14px}.footer-links{flex-direction:column;gap:16px}.section-heading{font-size:19px}.hero-section{padding:36px 14px 44px}}
        `}</style>
        <Header locale={locale} setLocale={setLocale} onNavigate={onNavigate} currentPage={page.name} />
        <main style={{ minHeight: "calc(100vh - 140px)" }}>
          {page.name === "home" && <HomePage locale={locale} onNavigate={onNavigate} />}
          {page.name === "products" && <ProductListingPage locale={locale} onNavigate={onNavigate} initialCategory={page.params.category} searchQuery={page.params.query} />}
          {page.name === "search" && <ProductListingPage locale={locale} onNavigate={onNavigate} searchQuery={page.params.query} />}
          {page.name === "detail" && <ProductDetailPage locale={locale} productId={page.params.productId} onNavigate={onNavigate} />}
          {page.name === "cart" && <CartPage locale={locale} onNavigate={onNavigate} />}
          {page.name === "admin" && <AdminDashboard locale={locale} onNavigate={onNavigate} />}
        </main>
        <Footer locale={locale} />
      </div>
    </CartProvider>
  );
}
