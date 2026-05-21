import { processTutorCommand } from './aiTutorService';

export const processCommand = async (command, router, pathname, language = 'en-US') => {
    const lowerCommand = command.toLowerCase();
    const isHindi = language === 'hi-IN';

    // Helper for bilingual responses
    const t = (en, hi) => isHindi ? hi : en;

    // Command Matcher Helper
    const match = (patterns) => patterns.some(p => lowerCommand.includes(p));

    // --- 0. AI Tutor Mode (High Priority) ---
    if (pathname === '/practice') {
        return processTutorCommand(command, language);
    }

    // --- 1. Navigation Commands ---
    if (match(['open menu', 'menu kholo'])) {
        // Mock menu opening (could toggle a state if we had access, for now just feedback)
        return t("Opening menu.", "Menu khul raha hai.");
    }
    if (match(['go back', 'peeche jao'])) {
        router.back();
        return t("Going back.", "Peeche ja raha hoon.");
    }
    if (match(['next page', 'aage badho'])) {
        // Mock pagination
        return t("Going to next page.", "Agla page khul raha hai.");
    }
    if (match(['previous page'])) { // Hindi 'peeche jao' covers both back and prev usually, but context matters
        return t("Going to previous page.", "Pichla page khul raha hai.");
    }
    if (match(['home page', 'go home', 'ghar le chalo', 'ghar'])) {
        router.push('/');
        return t("Going to home page.", "Home page par aa gaye.");
    }
    if (match(['open offers', 'offers dikhao'])) {
        router.push('/shop?filter=offers');
        return t("Showing offers.", "Offers dikha raha hoon.");
    }
    if (match(['open notifications', 'notifications dikhao'])) {
        return t("You have no new notifications.", "Koi nayi notification nahi hai.");
    }
    if (match(['show categories', 'category dikhao'])) {
        // Scroll to categories section if on home, or go to shop
        if (pathname === '/') {
            const element = document.getElementById('categories');
            if (element) element.scrollIntoView({ behavior: 'smooth' });
            return t("Here are the categories.", "Yeh rahi categories.");
        }
        router.push('/shop');
        return t("Opening categories.", "Categories khol raha hoon.");
    }
    if (match(['scroll up', 'upar jao', 'uper jao'])) {
        window.scrollBy({ top: -500, behavior: 'smooth' });
        return t("Scrolling up.", "Upar kar raha hoon.");
    }
    if (match(['scroll down', 'neeche jao', 'niche jao'])) {
        window.scrollBy({ top: 500, behavior: 'smooth' });
        return t("Scrolling down.", "Neeche kar raha hoon.");
    }

    if (match(['show my wishlist', 'wishlist dikhao'])) {
        router.push('/account?tab=wishlist');
        return t("Opening your wishlist.", "Aapki wishlist khul rahi hai.");
    }

    if (match(['add to wishlist', 'add this to wishlist', 'wishlist mein daalo', 'wishlist me daalo'])) {
        return {
            text: "",
            action: 'TRIGGER_ADD_TO_WISHLIST'
        };
    }

    if (match(['remove from wishlist', 'remove this from wishlist', 'wishlist se hatao'])) {
        return {
            text: "",
            action: 'TRIGGER_REMOVE_FROM_WISHLIST'
        };
    }

    // --- 2. Product Browsing Commands ---
    if (match(['trending products', 'trending saman', 'top-selling', 'sabse zyada bikne wale'])) {
        router.push('/shop?sort=trending');
        return t("Showing trending products.", "Trending saman dikha raha hoon.");
    }
    if (match(['today’s deals', 'aaj ki deals'])) {
        router.push('/shop?filter=deals');
        return t("Here are today's deals.", "Yeh rahi aaj ki deals.");
    }
    if (match(['new arrivals', 'naye products'])) {
        router.push('/shop?sort=newest');
        return t("Showing new arrivals.", "Naye products dikha raha hoon.");
    }
    if (match(['men fashion', 'mens fashion', "men's fashion", 'admiyon ke kapde', 'men clothes'])) {
        router.push('/shop?cat=apparel&q=men');
        return t("Showing men's fashion.", "Admiyon ke kapde dikha raha hoon.");
    }
    if (match(['women fashion', 'womens fashion', "women's fashion", 'auraton ke kapde', 'women clothes'])) {
        router.push('/shop?cat=apparel&q=women');
        return t("Showing women's fashion.", "Auraton ke kapde dikha raha hoon.");
    }
    if (match(['similar products', 'aise hi aur'])) {
        return t("Searching for similar products.", "Iske jaise aur products dhoond raha hoon.");
    }
    if (match(['more colors', 'aur colors'])) {
        return t("Showing available colors.", "Available colors dikha raha hoon.");
    }
    if (match(['size options', 'size options'])) {
        return t("Showing size options.", "Size options dikha raha hoon.");
    }
    if (match(['read me the reviews', 'read reviews', 'reviews padhke sunao'])) {
        return {
            text: t("Reading reviews.", "Reviews padh raha hoon."),
            action: 'TRIGGER_READ_REVIEWS'
        };
    }
    if (match(['show reviews', 'reviews dikhao'])) {
        return t("Scrolling to reviews.", "Reviews dikha raha hoon.");
    }
    if (match(['ratings high to low', 'rating zyada wali'])) {
        router.push('/shop?sort=rating_desc');
        return t("Sorted by highest ratings.", "Rating ke hisab se sort kar diya.");
    }

    // --- 3. Filter & Sort Commands ---
    if (match(['filter by price', 'price ke hisab se'])) {
        return t("How much is your budget?", "Aapka budget kitna hai?");
    }
    if (match(['under 500', '500 ke neeche'])) {
        router.push('/shop?price_max=500');
        return t("Showing items under 500.", "500 se kam ke items dikha raha hoon.");
    }
    if (match(['low to high', 'sasta pehle'])) {
        router.push('/shop?sort=price_asc');
        return t("Sorted price low to high.", "Price low to high sort kar diya.");
    }
    if (match(['4+ star', '4 star se upar'])) {
        router.push('/shop?rating_min=4');
        return t("Showing highly rated items.", "Achhi rating wale items dikha raha hoon.");
    }
    if (match(['only available', 'available items'])) {
        router.push('/shop?stock=in_stock');
        return t("Showing in-stock items.", "Sirf available items dikha raha hoon.");
    }
    if (match(['discounted items', 'discount wale'])) {
        router.push('/shop?filter=discount');
        return t("Showing discounted items.", "Discount wale items dikha raha hoon.");
    }

    // --- 4. Cart & Checkout Commands ---
    if (match(['add this to cart', 'isse cart mein', 'add to cart'])) {
        // Return an action that VoiceContext will dispatch as a window event
        return {
            text: t("Adding to cart.", "Cart mein daal raha hoon."),
            action: 'TRIGGER_ADD_TO_CART'
        };
    }
    if (match(['remove this', 'isse cart se hatao'])) {
        return t("Removed from cart.", "Cart se hata diya.");
    }
    if (match(['add the cheapest item', 'add cheapest item', 'cheapest item', 'sabse sasta item'])) {
        return {
            text: t("Adding the cheapest item to your cart.", "Sabse sasta item cart mein daal raha hoon."),
            action: 'TRIGGER_ADD_CHEAPEST'
        };
    }
    if (match(['increase quantity', 'quantity badhao'])) {
        return {
            text: t("Increasing quantity.", "Quantity badha raha hoon."),
            action: 'TRIGGER_INC_QTY'
        };
    }
    if (match(['decrease quantity', 'quantity kam karo'])) {
        return {
            text: t("Decreasing quantity.", "Quantity kam kar raha hoon."),
            action: 'TRIGGER_DEC_QTY'
        };
    }
    if (match(['clear my cart', 'cart saaf karo'])) {
        // This is global, but event based is fine too
        return t("Cart cleared.", "Cart khali kar diya.");
    }
    if (match(['proceed to checkout', 'checkout shuru'])) {
        router.push('/checkout');
        return t("Proceeding to checkout.", "Checkout shuru kar raha hoon.");
    }
    if (match(['apply coupon', 'coupon lagao'])) {
        return t("Applying best coupon.", "Sabse accha coupon laga raha hoon.");
    }
    if (match([
        'what is in my cart', 'read my cart', 'cart mein kya hai', 'cart me kya hai',
        'cart me kitna hai', 'mere cart mein', 'cart items', 'tell me about my cart', 'cart detail'
    ])) {
        try {
            const savedCart = localStorage.getItem('voice-shop-cart');
            if (savedCart) {
                const parsedCart = JSON.parse(savedCart);
                if (parsedCart.length === 0) {
                    return t("Your cart is empty.", "Aapka cart khali hai.");
                }
                const total = parsedCart.reduce((sum, item) => sum + item.price * item.quantity, 0);
                return t(`You have ${parsedCart.length} items in your cart. Your total is ${total.toLocaleString()} rupees.`, `Aapke cart mein ${parsedCart.length} items hain, aur aapka total ${total} rupaye hai.`);
            }
        } catch (e) {
            console.error(e);
        }
        return t("Your cart is empty.", "Aapka cart khali hai.");
    }

    if (match(['cart', 'jhola', 'tokri'])) {
        router.push('/cart');
        return t("Opening your cart.", "Aapka cart khul raha hai.");
    }

    // --- 5. Order Commands ---
    if (match([
        'track my order', 'delivery track', 'where is my package', 'parcel kahan hai', 
        'where is my order', 'mera order kahan hai', 'mera order kaha he', 'mera order kaha h',
        'order status', 'mera parcel', 'order check'
    ])) {
        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const orders = await res.json();
                if (orders && orders.length > 0) {
                    const latest = orders[0];
                    const count = latest.items.length;
                    const status = latest.status;
                    const amount = latest.total;
                    router.push('/account/orders');
                    return t(
                        `Your latest order for ${count} items totaling ${amount.toLocaleString()} rupees is currently in ${status} status.`,
                        `Aapka pichla order jisme ${count} items hain, waha abhi ${status} mein hai.`
                    );
                } else {
                    return t("You don't have any recent orders.", "Aapne abhi tak koi order nahi kiya hai.");
                }
            } else if (res.status === 401) {
                router.push('/signin');
                return t("Please login to track your orders.", "Apne order track karne ke liye login karein.");
            }
        } catch(e) {
            console.error(e);
        }
        router.push('/account/orders');
        return t("Tracking your order. It's on the way!", "Order track kar raha hoon. Raste mein hai!");
    }
    if (match(['order history', 'purane order'])) {
        router.push('/account/orders');
        return t("Showing your order history.", "Aapke purane orders dikha raha hoon.");
    }
    if (match(['cancel my order', 'order cancel'])) {
        return t("Please select the order to cancel.", "Kripya woh order chuniye jise cancel karna hai.");
    }
    if (match(['return this', 'wapas karna hai'])) {
        return t("Initiating return process.", "Wapsi ki prakriya shuru kar raha hoon.");
    }

    // --- 6. Payment Commands ---
    if (match(['payment methods', 'payment options'])) {
        return t("Showing payment options.", "Payment options dikha raha hoon.");
    }
    if (match(['use upi', 'upi se'])) {
        return t("Selected UPI payment.", "UPI select kiya gaya.");
    }
    if (match(['cash on delivery', 'cod'])) {
        return t("Selected Cash on Delivery.", "Cash on Delivery select kiya gaya.");
    }
    if (match(['add new card', 'naya card'])) {
        return t("Opening card details form.", "Card details form khol raha hoon.");
    }

    // --- 7. Help & Support ---
    if (match(['talk to support', 'support se baat'])) {
        return t("Connecting you to support agent.", "Support agent se connect kar raha hoon.");
    }
    if (match(['complaint', 'shikayat'])) {
        return t("Opening complaint form.", "Complaint form khol raha hoon.");
    }
    if (match(['return policy', 'wapsi ke niyam'])) {
        return t("You can return items within 30 days.", "Aap 30 din ke andar saman wapas kar sakte hain.");
    }
    if (match(['how to use', 'kaise use karun'])) {
        return t("Just speak naturally! Try saying 'Show me watches'.", "Bas aaram se boliye! Try kijiye 'Ghadi dikhao'.");
    }

    // --- 8. Accessibility ---
    if (match(['read this page', 'padh kar sunao'])) {
        return t("Reading page content...", "Page padh raha hoon...");
    }
    if (match(['increase text size', 'text bada karo'])) {
        document.body.style.fontSize = '120%'; // Simple implementation
        return t("Text size increased.", "Text bada kar diya.");
    }
    if (match(['dark mode', 'dark mode'])) {
        // Toggle class on html/body if supported
        document.documentElement.classList.add('dark');
        return t("Dark mode enabled.", "Dark mode chalu kar diya.");
    }
    if (match(['light mode', 'light mode'])) {
        document.documentElement.classList.remove('dark');
        return t("Light mode enabled.", "Light mode chalu kar diya.");
    }

    // --- 9. AI Agent Smart Commands ---
    if (match(['recommend', 'suggest', 'kuch recommend'])) {
        router.push('/shop?sort=rating_desc');
        return t("Based on your style, check these out.", "Aapki pasand ke hisab se yeh dekhiye.");
    }
    if (match(['compare', 'comparison'])) {
        return t("Added to comparison.", "Comparison mein daal diya.");
    }
    if (match(['is this good', 'accha hai kya'])) {
        return t("This item has 4.5 stars. It's very popular.", "Is item ki rating 4.5 stars hai. Yeh kaafi popular hai.");
    }
    if (match(['cheapest', 'sabse sasta'])) {
        router.push('/shop?sort=price_asc');
        return t("Showing the cheapest options.", "Sabse saste options dikha raha hoon.");
    }
    if (match(['what should i buy', 'kya khareedna chahiye'])) {
        router.push('/shop?filter=bestsellers');
        return t("Check out our bestsellers.", "Hamare bestsellers dekhiye.");
    }

    // --- 10. Contextual Commands ---
    if (match(['repeat', 'wapas bolo'])) {
        return t("Repeating last message.", "Wapas bol raha hoon.");
    }
    if (match(['slow down', 'dheere bolo'])) {
        // Would adjust speech rate in VoiceContext
        return t("Okay, I will speak slower.", "Theek hai, main dheere bolunga.");
    }
    if (match(['don’t show this', 'yeh mat dikhana'])) {
        return t("Okay, noted.", "Theek hai, note kar liya.");
    }
    if (match(['remember', 'yaad rakho'])) {
        return t("I will remember your preference.", "Main aapki pasand yaad rakhunga.");
    }
    if (match(['turn off', 'band karo'])) {
        // Handled in VoiceContext usually, but good to have response
        return t("Turning off voice assistant.", "Voice assistant band kar raha hoon.");
    }

    // --- Existing/Default Logic ---

    // Ignore form filling commands (let the page handle them)
    if (lowerCommand.match(/^(?:my|set|mera|set) (?:email|password|name|naam)/)) {
        return null;
    }

    // Authentication & Account
    if (match(['sign in', 'login', 'log in'])) {
        if (pathname === '/signin') return null;
        router.push('/signin');
        return t("Navigating to sign in page.", "Sign in page par le ja raha hoon.");
    }

    if (match(['sign up', 'create account', 'register', 'khata'])) {
        if (pathname === '/signup') return null;
        router.push('/signup');
        return t("Navigating to sign up page.", "Sign up page par le ja raha hoon.");
    }

    if (match(['what is my name', 'who am i', 'mera naam kya hai', 'mera name'])) {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data && data.user) {
                    return t(`You are logged in as ${data.user.name}.`, `Aap ${data.user.name} ke naam se logged in hain.`);
                }
            }
        } catch(e) {
            console.error(e);
        }
        return t("I'm not sure. Please check your account page.", "Mujhe nahi pata, kripya apne account page par check karein.");
    }

    if (match(['account', 'profile', 'dashboard'])) {
        router.push('/account');
        return t("Opening your account dashboard.", "Aapka account dashboard khul raha hai.");
    }

    // Search (General)
    if (match(['search for', 'find', 'dhoondo', 'khojo'])) {
        const query = lowerCommand
            .replace('search for', '')
            .replace('find', '')
            .replace('dhoondo', '')
            .replace('khojo', '')
            .trim();
        router.push(`/shop?q=${encodeURIComponent(query)}`);
        return t(`Searching for ${query}.`, `${query} dhoond raha hoon.`);
    }

    // Help (General)
    if (match(['help', 'what can you do', 'madad', 'kya kar sakte ho'])) {
        return t(
            "I can help you shop, track orders, and answer questions. Try 'Show trending products' or 'Track my order'.",
            "Main shopping, order tracking aur sawalon mein madad kar sakta hoon. Try kijiye 'Trending saman dikhao' ya 'Order track karo'."
        );
    }

    // Default fallback
    if (pathname === '/signin' || pathname === '/signup' || pathname === '/checkout') {
        return null;
    }

    if (lowerCommand.startsWith('my ') || lowerCommand.startsWith('set ') || lowerCommand.startsWith('mera ')) {
        return null;
    }

    return {
        text: "",
        action: 'TRIGGER_SHOW_TOAST',
        toastMessage: t("Command not recognized. Try saying 'Help'.", "Nirdeish samajh nahi aaya. 'Help' bol kar dekhein."),
        toastType: 'warning'
    };
};
