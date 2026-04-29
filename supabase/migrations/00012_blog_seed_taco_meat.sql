-- 00012_blog_seed_taco_meat.sql
-- Seed: Recipes blog category + taco meat featured blog post
-- Idempotent: fixed UUIDs + ON CONFLICT DO NOTHING

-- ─── Blog Category: Recipes ──────────────────────────────────────────────────
INSERT INTO blog_categories (id, name, slug, description, color, sort_order, is_active)
VALUES (
  'c1000000-0000-0000-0000-000000000001',
  '{"en": "Recipes", "bn-BD": "রেসিপি", "sv": "Recept"}',
  '{"en": "recipes", "bn-BD": "recipes", "sv": "recept"}',
  '{"en": "Easy, delicious recipes for every day", "bn-BD": "প্রতিদিনের জন্য সহজ ও সুস্বাদু রেসিপি", "sv": "Enkla och laeckra recept foer varje dag"}',
  '#ef4444',
  1,
  true
)
ON CONFLICT (id) DO NOTHING;

-- ─── Blog Tags ───────────────────────────────────────────────────────────────
INSERT INTO blog_tags (id, name, slug)
VALUES
  ('d1000000-0000-0000-0000-000000000001',
   '{"en": "Taco", "bn-BD": "ট্যাকো", "sv": "Taco"}',
   '{"en": "taco", "bn-BD": "taco", "sv": "taco"}'),
  ('d1000000-0000-0000-0000-000000000002',
   '{"en": "Ground Beef", "bn-BD": "গ্রাউন্ড বিফ", "sv": "Malet kott"}',
   '{"en": "ground-beef", "bn-BD": "ground-beef", "sv": "malet-kott"}'),
  ('d1000000-0000-0000-0000-000000000003',
   '{"en": "Easy Dinner", "bn-BD": "সহজ ডিনার", "sv": "Enkel middag"}',
   '{"en": "easy-dinner", "bn-BD": "easy-dinner", "sv": "enkel-middag"}'),
  ('d1000000-0000-0000-0000-000000000004',
   '{"en": "Meal Prep", "bn-BD": "মিল প্রেপ", "sv": "Matlaga i forvaeg"}',
   '{"en": "meal-prep", "bn-BD": "meal-prep", "sv": "meal-prep"}'),
  ('d1000000-0000-0000-0000-000000000005',
   '{"en": "Quick Recipes", "bn-BD": "দ্রুত রেসিপি", "sv": "Snabba recept"}',
   '{"en": "quick-recipes", "bn-BD": "quick-recipes", "sv": "snabba-recept"}')
ON CONFLICT (id) DO NOTHING;

-- ─── Blog Post ───────────────────────────────────────────────────────────────
INSERT INTO blog_posts (
  id,
  blog_category_id,
  title,
  slug,
  excerpt,
  content,
  cover_image_url,
  cover_image_alt,
  meta_title,
  meta_description,
  author_name,
  author_avatar_url,
  status,
  is_featured,
  read_time_minutes,
  published_at
)
VALUES (
  'e1000000-0000-0000-0000-000000000001',
  'c1000000-0000-0000-0000-000000000001',

  -- title (JSONB, 3 locales)
  '{
    "en": "3-Ingredient Taco Meat & 4 Delicious Ways to Use It",
    "bn-BD": "৩ উপাদানের ট্যাকো মিট এবং এটি ব্যবহারের ৪টি উপায়",
    "sv": "Tacokott med 3 ingredienser och 4 laeckra satt att anvanda det"
  }',

  -- slug (JSONB, 3 locales)
  '{
    "en": "3-ingredient-taco-meat-4-ways-to-use-it",
    "bn-BD": "3-ingredient-taco-meat-4-ways-to-use-it",
    "sv": "3-ingredienser-tacokott-4-satt-att-anvanda"
  }',

  -- excerpt (JSONB)
  '{
    "en": "This simple 3-ingredient taco meat comes together in just 15 minutes using ground beef, tomato sauce, and homemade seasoning. Make one batch and use it all week in tacos, nachos, salads, and more.",
    "bn-BD": "এই সহজ ৩ উপাদানের ট্যাকো মিট মাত্র ১৫ মিনিটে তৈরি হয়। একবার রান্না করুন এবং সারাসপ্তাহ ট্যাকো, নাচোস, সালাদে ব্যবহার করুন।",
    "sv": "Det haer enkla tacokottet med 3 ingredienser ar klart pa bara 15 minuter. Tillag en sats och anvand det hela veckan i tacos, nachos, sallader och mer."
  }',

  -- content (HTML from rich text editor)
  '<h2>The Best 3-Ingredient Taco Meat</h2>
<p>If you have ever stood in the taco aisle debating between seasoning packets, this recipe will change everything. All you need is <strong>ground meat</strong>, <strong>tomato sauce</strong>, and a handful of spices already sitting in your pantry. The result is juicy, flavorful taco meat that tastes better than any packet version — ready in just 15 minutes.</p>

<figure>
  <img src="https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&auto=format&fit=crop&q=80" alt="Seasoned taco meat in a cast iron skillet with fresh toppings nearby" />
  <figcaption>Restaurant-quality taco meat you can make at home in 15 minutes.</figcaption>
</figure>

<h2>Why This Recipe Works</h2>
<ul>
  <li><strong>15 minutes</strong> from skillet to table</li>
  <li>Uses pantry staples — no special shopping trip needed</li>
  <li>Works with beef, chicken, turkey, or pork</li>
  <li>Scales up perfectly for batch cooking and meal prep</li>
  <li>No mystery ingredients — you control every element</li>
</ul>

<h2>Ingredients</h2>
<p>You only need <em>three core components</em>:</p>
<ol>
  <li><strong>1 lb (450 g) ground meat</strong> — beef (80/20), ground turkey, chicken, or pork all work beautifully</li>
  <li><strong>½ cup tomato sauce</strong> — the secret ingredient that keeps the meat moist and binds the spices</li>
  <li><strong>Homemade taco seasoning</strong> — chili powder, cumin, salt, garlic powder, onion powder, paprika, dried oregano, black pepper, and a pinch of crushed red pepper flakes</li>
</ol>

<blockquote>
  <p><strong>Pro tip:</strong> Using tomato sauce instead of water is the single biggest upgrade you can make to homemade taco meat. It adds body, a subtle sweetness, and ensures the seasoning clings to every crumble.</p>
</blockquote>

<h2>Step-by-Step Instructions</h2>

<h3>Step 1 — Brown the meat</h3>
<p>Heat a large skillet over <strong>medium-high heat</strong>. Add your ground meat and break it into pieces with a wooden spoon. Cook for 6–8 minutes, stirring occasionally, until no pink remains. Drain any excess fat and blot with paper towels for the cleanest result.</p>

<h3>Step 2 — Add sauce and seasoning</h3>
<p>Return the drained meat to the skillet. Pour in the tomato sauce and water, then add all the spices. Stir everything together until the meat is evenly coated.</p>

<h3>Step 3 — Simmer until thickened</h3>
<p>Bring the mixture to a boil, then reduce to <strong>medium heat</strong>. Simmer for 5–7 minutes, stirring occasionally, until most of the liquid has absorbed and the meat looks glossy and cohesive. Taste and adjust salt if needed.</p>

<h3>Restaurant-style crumble trick</h3>
<p>For ultra-fine crumbles like you get at a fast-casual taco chain, transfer the cooked, drained meat to a food processor and pulse 4–5 times before adding it back to the pan with the sauce. This one step makes a surprisingly big difference in texture.</p>

<h2>4 Ways to Use Taco Meat</h2>

<h3>1. Classic Street Tacos</h3>
<p>Warm corn or flour tortillas in a dry skillet, pile on the taco meat, and top with white onion, fresh cilantro, a squeeze of lime, and your favorite salsa. Simple, fast, and perfect every time.</p>

<h3>2. Loaded Taco Salad</h3>
<p>Layer romaine lettuce, warm taco meat, shredded cheddar, pico de gallo, black beans, and crushed tortilla chips in a large bowl. Drizzle with a creamy cilantro-lime dressing for a satisfying weeknight dinner that feels indulgent but is actually packed with protein.</p>

<h3>3. Sheet-Pan Nachos</h3>
<p>Spread tortilla chips on a baking sheet, scatter taco meat and shredded cheese on top, and broil for 3–4 minutes until the cheese is bubbly and golden. Finish with jalapeños, sour cream, guacamole, and a drizzle of hot sauce. Perfect for game day or movie night.</p>

<h3>4. Taco-Stuffed Baked Potatoes</h3>
<p>Split a fluffy baked potato, load it with taco meat, shredded cheese, sour cream, and green onions. It sounds unconventional, but this combination is absolute comfort food — a great way to stretch one batch of taco meat into a completely different meal.</p>

<h2>Taco Seasoning Blend (Full Measurements)</h2>
<ul>
  <li>1½ tsp chili powder</li>
  <li>1 tsp ground cumin</li>
  <li>½ tsp fine sea salt</li>
  <li>½ tsp garlic powder</li>
  <li>½ tsp onion powder</li>
  <li>¼ tsp smoked paprika</li>
  <li>¼ tsp dried oregano</li>
  <li>¼ tsp black pepper</li>
  <li>⅛ tsp crushed red pepper flakes (optional, for heat)</li>
</ul>
<p>This blend is mild enough for kids but easy to amp up — add more chili powder and red pepper flakes for extra heat.</p>

<h2>Storage & Meal Prep</h2>
<p>Taco meat is one of the best proteins to batch cook ahead of time:</p>
<ul>
  <li><strong>Refrigerator:</strong> Store in an airtight container for up to <strong>3 days</strong></li>
  <li><strong>Freezer:</strong> Portion into zip-lock bags (about 1 cup per bag) and freeze for up to <strong>3 months</strong>. Lay flat to freeze, then stack vertically to save space</li>
  <li><strong>Reheating:</strong> Warm in a skillet over medium heat with a splash of water to restore moisture, or microwave covered for 2 minutes</li>
</ul>

<h2>Frequently Asked Questions</h2>

<h3>Can I use ground turkey instead of beef?</h3>
<p>Absolutely. Ground turkey is leaner and works perfectly with this seasoning. Because turkey has less fat, keep the heat at medium (not high) and do not over-drain — a small amount of moisture helps it stay tender.</p>

<h3>Is this recipe gluten-free?</h3>
<p>Yes — every ingredient in the seasoning blend and tomato sauce is naturally gluten-free. Just check the label on your tomato sauce to confirm no thickeners have been added.</p>

<h3>How do I make it spicier?</h3>
<p>Double the red pepper flakes and add ¼ tsp of cayenne pepper to the spice blend. A chipotle pepper in adobo sauce (finely chopped) stirred in at the end adds both heat and a deep, smoky complexity.</p>

<h3>Can I double the recipe?</h3>
<p>Easily. Use a larger skillet or Dutch oven and increase the tomato sauce to ¾ cup. Simmer time may extend by 2–3 minutes since there is more liquid to reduce.</p>',

  -- cover image
  'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=1200&auto=format&fit=crop&q=80',

  -- cover_image_alt (JSONB)
  '{
    "en": "Seasoned ground taco meat in a cast iron skillet, ready to serve",
    "bn-BD": "একটি কাস্ট আয়রন প্যানে মশলাদার ট্যাকো মিট",
    "sv": "Kryddat tacokott i en gjutjarnspanna, redo att serveras"
  }',

  -- meta_title (JSONB)
  '{
    "en": "3-Ingredient Taco Meat Recipe (Ready in 15 Minutes) | BestFinds",
    "bn-BD": "৩ উপাদানের ট্যাকো মিট রেসিপি (১৫ মিনিটে তৈরি) | BestFinds",
    "sv": "Tacokott med 3 ingredienser (klart pa 15 minuter) | BestFinds"
  }',

  -- meta_description (JSONB)
  '{
    "en": "Make the juiciest taco meat with just 3 ingredients in 15 minutes. Ground beef, tomato sauce, and homemade seasoning — plus 4 creative ways to use it all week.",
    "bn-BD": "মাত্র ৩ উপাদানে ১৫ মিনিটে সবচেয়ে সুস্বাদু ট্যাকো মিট তৈরি করুন। গ্রাউন্ড বিফ, টমেটো সস এবং ঘরে তৈরি মশলা — সাথে এটি ব্যবহারের ৪টি উপায়।",
    "sv": "Gor det saftigaste tacokottet med bara 3 ingredienser pa 15 minuter. Malet kott, tomatsas och hemgjord krydda — plus 4 kreativa satt att anvanda det hela veckan."
  }',

  -- author
  'BestFinds Editorial',
  NULL,

  -- status + featured
  'published',
  true,

  -- read_time_minutes
  5,

  -- published_at
  now()
)
ON CONFLICT (id) DO NOTHING;

-- ─── Tag associations ─────────────────────────────────────────────────────────
INSERT INTO blog_post_tags (blog_post_id, blog_tag_id)
VALUES
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000001'),
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000002'),
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000003'),
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000004'),
  ('e1000000-0000-0000-0000-000000000001', 'd1000000-0000-0000-0000-000000000005')
ON CONFLICT DO NOTHING;
