-- =============================================================
-- 006_update_product_descriptions.sql
-- Expands short product descriptions with detailed information
-- =============================================================

SET NAMES utf8mb4;

-- Update Wireless Bluetooth Headphones description
UPDATE products 
SET description = '{
  "en": "Experience premium audio with these wireless Bluetooth headphones featuring advanced active noise cancellation technology. The headphones deliver crystal-clear sound with deep bass and crisp highs, perfect for music, calls, and gaming. With up to 30 hours of battery life on a single charge, you can enjoy uninterrupted listening throughout your day. The comfortable over-ear design with memory foam ear cushions ensures long-wearing comfort, while Bluetooth 5.3 provides stable connectivity up to 33 feet. Built-in microphone with echo cancellation for clear hands-free calls. Foldable design for easy storage and travel.",
  "bn-BD": "এই ওয়্যারলেস ব্লুটুথ হেডফোনের সাথে প্রিমিয়াম অডিও অভিজ্ঞতা উপভোগ করুন যা উন্নত অ্যাক্টিভ নয়েজ ক্যানসেলেশন প্রযুক্তি সহ। হেডফোনগুলি গভীর বাস এবং স্পষ্ট হাই সহ স্ফটিক শব্দ সরবরাহ করে, যা সঙ্গীত, কল এবং গেমিংয়ের জন্য উপযুক্ত। একবার চার্জে ৩০ ঘণ্টা পর্যন্ত ব্যাটারি লাইফ সহ, আপনি সারাদিন অবিচ্ছিন্ন শ্রোতা উপভোগ করতে পারেন। মেমোরি ফোম কানের কুশন সহ আরামদায়ক ওভার-ইয়ার ডিজাইন দীর্ঘ সময় পরােনার আরাম নিশ্চিত করে, যেখানে ব্লুটুথ ৫.৩ ৩৩ ফুট পর্যন্ত স্থিতিশীল সংযোগ সরবরাহ করে। পরিষ্কার হ্যান্ডস-ফ্রি কলের জন্য ইকো ক্যানসেলেশন সহ বিল্ট-ইন মাইক্রোফোন। সহজ সংরক্ষণ এবং ভ্রমণের জন্য ফোল্ডেবল ডিজাইন।",
  "sv": "Upplev premiumljud med dessa trådlösa Bluetooth-hörlurar med avancerad aktiv brusreduceringsteknologi. Hörlurarna levererar kristallklart ljud med djup bas och skarpa höjder, perfekta för musik, samtal och spel. Med upp till 30 timmars batteritid på en laddning kan du njuta av oavbruten lyssning under hela dagen. Den bekväma över-ör-designen med minnesskum-örkuddar säkerställer långvarig komfort, medan Bluetooth 5.3 ger stabil anslutning upp till 33 fot. Inbyggd mikrofon med ekocancelering för tydliga handsfree-samtal. Vikbar design för enkel förvaring och resa."
}'
WHERE asin = 'B0DTEST001';

-- Update USB-C Fast Charger 65W description
UPDATE products 
SET description = '{
  "en": "Power up your devices faster with this compact 65W GaN USB-C charger. Featuring advanced Gallium Nitride (GaN) technology, this charger delivers efficient, high-speed charging while remaining cool to the touch. The dual USB-C ports allow you to charge two devices simultaneously, perfect for laptops, tablets, and smartphones. Intelligent power distribution automatically adjusts output based on connected devices for optimal charging speed. Universal compatibility with MacBook Pro, Dell XPS, Samsung Galaxy, iPad Pro, and more. Compact and travel-friendly design with foldable plug. Built-in multiple protection systems including over-current, over-voltage, and short-circuit protection for safe charging.",
  "bn-BD": "এই কমপ্যাক্ট ৬৫W GaN USB-C চার্জারের সাথে আপনার ডিভাইসগুলি দ্রুত পাওয়ার আপ করুন। উন্নত গ্যালিয়াম নাইট্রাইড (GaN) প্রযুক্তি সহ, এই চার্জার দক্ষ, হাই-স্পিড চার্জিং সরবরাহ করে এবং এটি স্পর্শে ঠান্ডা থাকে। ডুয়াল USB-C পোর্টগুলি আপনাকে একই সাথে দুটি ডিভাইস চার্জ করতে দেয়, যা ল্যাপটপ, ট্যাবলেট এবং স্মার্টফোনের জন্য উপযুক্ত। সংযুক্ত ডিভাইসের উপর ভিত্তি করে স্বয়ংক্রিয়ভাবে আউটপুট সামঞ্জস্য করে ইন্টেলিজেন্ট পাওয়ার ডিস্ট্রিবিউশন অপ্টিমাল চার্জিং স্পিডের জন্য। MacBook Pro, Dell XPS, Samsung Galaxy, iPad Pro এবং আরও অনেকের সাথে ইউনিভার্সাল সামঞ্জস্য। ফোল্ডেবল প্লাগ সহ কমপ্যাক্ট এবং ভ্রমণ-বান্ধব ডিজাইন। নিরাপদ চার্জিংয়ের জন্য ওভার-কারেন্ট, ওভার-ভোল্টেজ এবং শর্ট-সার্কিট সুরক্ষা সহ বিল্ট-ইন একাধিক সুরক্ষা ব্যবস্থা।"
}'
WHERE asin = 'B0DTEST002';

-- Update Stainless Steel Water Bottle description
UPDATE products 
SET description = '{
  "en": "Stay hydrated in style with this premium 750ml stainless steel water bottle. Crafted from high-quality 18/8 food-grade stainless steel, this bottle features double-wall vacuum insulation that keeps drinks cold for up to 24 hours or hot for up to 12 hours. The sweat-proof exterior ensures your hands stay dry, while the leak-proof lid with silicone ring prevents spills. BPA-free, phthalate-free, and non-toxic construction ensures safe drinking. Wide mouth opening for easy filling, adding ice cubes, and cleaning. Perfect for gym, office, outdoor adventures, or daily hydration needs. Durable powder-coated finish provides scratch resistance and a comfortable grip.",
  "bn-BD": "এই প্রিমিয়াম ৭৫০মিলি স্টেইনলেস স্টিল ওয়াটার বোতলের সাথে স্টাইলে হাইড্রেটেড থাকুন। উচ্চমানের ১৮/৮ ফুড-গ্রেড স্টেইনলেস স্টিল থেকে তৈরি, এই বোতলে ডাবল-ওয়াল ভ্যাকুয়াম ইনসুলেশন রয়েছে যা ২৪ ঘণ্টা পর্যন্ত পানি ঠান্ডা বা ১২ ঘণ্টা পর্যন্ত গরম রাখে। স্বেট-প্রুফ এক্সটেরিয়র নিশ্চিত করে আপনার হাত শুকনো থাকে, যেখানে সিলিকন রিং সহ লিক-প্রুফ ঢাকনা স্পিল প্রতিরোধ করে। নিরাপদ পানীয়ের জন্য BPA-ফ্রি, ফ্থালেট-ফ্রি এবং নন-টক্সিক নির্মাণ। সহজ পূরণ, আইস কিউব যোগ করা এবং পরিষ্কারের জন্য প্রশস্ত মুখ খোলা। জিম, অফিস, আউটডোর অ্যাডভেঞ্চার বা দৈনিক হাইড্রেশন প্রয়োজনের জন্য উপযুক্ত। টেকসচার প্রতিরোধ এবং আরামদায়ক গ্রিপ সরবরাহ করে টেকসচার-কোটেড ফিনিশ।",
  "sv": "Håll dig hydrerad med stil med denna premium 750ml vattenflaska i rostfritt stål. Tillverkad av högkvalitativ 18/8 livsmedelsklassat rostfritt stål, har denna flaska dubbelväggig vakuumisolering som håller drycker kalla i upp till 24 timmar eller varma i upp till 12 timmar. Den svettfria ytan säkerställer att dina händer förblir torra, medan läckagesäkert lock med silikonring förhindrar spill. BPA-fri, ftalatfri och giftfri konstruktion säkerställer säker drickning. Bred öppning för enkel påfyllning, tillsättning av isbitar och rengöring. Perfekt för gym, kontor, utomhusäventyr eller dagliga hydreringsbehov. Hållbar pulverlackerad yta ger repbeständighet och bekvämt grepp."
}'
WHERE asin = 'B0DTEST003';

-- Update The Art of Programming description
UPDATE products 
SET description = '{
  "en": "Master the art of writing clean, maintainable, and efficient code with this comprehensive programming guide. This 500+ page book covers fundamental principles of software design, including SOLID principles, design patterns, and architectural patterns. Learn practical techniques for refactoring legacy code, writing testable code, and implementing continuous integration. Features real-world examples from industry experts, updated for 2024 with modern frameworks and best practices. Covers essential topics like code reviews, documentation, debugging, and performance optimization. Suitable for beginners learning the basics and experienced developers looking to level up their skills. Includes practical exercises and coding challenges to reinforce learning.",
  "bn-BD": "এই বিস্তৃত প্রোগ্রামিং গাইডের সাথে পরিষ্কার, রক্ষণাবেক্ষণযোগ্য এবং দক্ষ কোড লেখার শিল্প আয়ত্ত করুন। এই ৫০০+ পৃষ্ঠার বইটি সফটওয়্যার ডিজাইনের মৌলিক নীতিগুলি কভার করে, যার মধ্যে SOLID নীতি, ডিজাইন প্যাটার্ন এবং আর্কিটেকচারাল প্যাটার্ন অন্তর্ভুক্ত। লিগ্যাসি কোড রিফ্যাক্টরিং, টেস্টেবল কোড লেখা এবং কন্টিনিউয়াস ইন্টিগ্রেশন বাস্তবায়নের ব্যবহারিক কৌশল শিখুন। ইন্ডাস্ট্রি বিশেষজ্ঞদের বাস্তব-বিশ্ব উদাহরণ রয়েছে, ২০২৪ সালে আধুনিক ফ্রেমওয়ার্ক এবং সেরা অনুশীলনগুলির সাথে আপডেট করা হয়েছে। কোড রিভিউ, ডকুমেন্টেশন, ডিবাগিং এবং পারফরম্যান্স অপ্টিমাইজেশনের মতো প্রয়োজনীয় বিষয় কভার করে। বেসিক শিখছেন এমন শিক্ষার্থীদের এবং দক্ষতা বাড়াতে চাইছেন এমন অভিজ্ঞ ডেভেলপারদের জন্য উপযুক্ত। শেখার শক্তিশালী করার জন্য ব্যবহারিক অনুশীলন এবং কোডিং চ্যালেঞ্জ অন্তর্ভুক্ত।"
}'
WHERE asin = 'B0DTEST004';

-- Update Smart LED Desk Lamp description
UPDATE products 
SET description = '{
  "en": "Illuminate your workspace with this intelligent LED desk lamp featuring adjustable color temperature from warm 2700K to cool 6500K. Touch-sensitive controls allow easy dimming and mode switching, while the built-in USB charging port keeps your devices powered. The flexible gooseneck design lets you direct light exactly where needed, perfect for reading, working, or studying. Memory function remembers your last brightness and color settings. Eye-friendly LED technology with flicker-free illumination reduces eye strain during extended use. Modern minimalist design complements any desk decor. Energy-efficient LEDs consume up to 75% less energy than traditional bulbs. Includes a built-in timer function for automatic shut-off after 30 or 60 minutes.",
  "bn-BD": "এই ইন্টেলিজেন্ট LED ডেস্ক ল্যাম্পের সাথে আপনার কর্মক্ষেত্র আলোকিত করুন যা ২৭০০K থেকে ৬৫০০K পর্যন্ত সামঞ্জস্যযোগ্য কালার টেম্পারেচার সহ। স্পর্শ-সংবেদনশীল নিয়ন্ত্রণ সহজ ডিমিং এবং মোড সুইচিং করতে দেয়, যেখানে বিল্ট-ইন USB চার্জিং পোর্ট আপনার ডিভাইসগুলি পাওয়ারড রাখে। নমনীয গুসনেক ডিজাইন আপনাকে ঠিক যেখানে প্রয়োজন আলো নির্দেশ করতে দেয়, যা পড়া, কাজ বা পড়াশুনার জন্য উপযুক্ত। মেমোরি ফাংশন আপনার শেষ ব্রাইটনেস এবং কালার সেটিংস মনে রাখে। ফ্লিকার-ফ্রি ইলুমিনেশন সহ আই-ফ্রেন্ডলি LED প্রযুক্তি দীর্ঘ ব্যবহারের সময় চোখের চাপ কমায়। আধুনিক মিনিমালিস্ট ডিজাইন যেকোনো ডেস্ক ডেকরের সাথে মানানসই। ঐতিহ্বাগত বাল্বের তুলনায় ৭৫% কম শক্তি খরচ করে শক্তি-দক্ষ LEDs। ৩০ বা ৬০ মিনিটের পরে স্বয়ংক্রিয় শাট-অফের জন্য বিল্ট-ইন টাইমার ফাংশন অন্তর্ভুক্ত।"
}'
WHERE asin = 'B0DTEST005';

-- Update Discontinued Kitchen Scale description
UPDATE products 
SET description = '{
  "en": "This digital kitchen scale has been discontinued by the manufacturer. We recommend checking out our other kitchen tools and accessories for similar products. For alternatives, browse our Home & Kitchen category where you can find modern digital scales with enhanced features like touch screens, nutritional tracking, and smart connectivity. Thank you for your interest in our products.",
  "bn-BD": "এই ডিজিটাল রান্নাঘর স্কেলটি প্রস্তুতকারক দ্বারা বন্ধ করা হয়েছে। আমরা অনুরূপ পণ্যের জন্য আমাদের অন্য রান্নাঘরের সরঞ্জাম এবং আনুষাঙ্গিক চেক করার পরামর্শ দিই। বিকল্পের জন্য, আমাদের বাড়ি ও রান্নাঘর ক্যাটাগরি ব্রাউজ করুন যেখানে আপনি টাচ স্ক্রিন, পুষ্টি ট্র্যাকিং এবং স্মার্ট কানেক্টিভিটি সহ আধুনিক ডিজিটাল স্কেল খুঁজে পেতে পারেন। আমাদের পণ্যগুলিতে আপনার আগ্রহের জন্য ধন্যবাদ।",
  "sv": "Denna digitala köksvåg har utgått av tillverkaren. Vi rekommenderar att du tittar på våra andra köksverktyg och tillbehör för liknande produkter. För alternativ, bläddra i vår kategori Hem och Kök där du kan hitta moderna digitala vågar med förbättrade funktioner som pekskärmar, näringsspårning och smart anslutning. Tack för ditt intresse för våra produkter."
}'
WHERE asin = 'B0DTEST006';
