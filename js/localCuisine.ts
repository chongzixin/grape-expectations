// Local cuisine knowledge shared across sommelier prompts.
// Update this file when adding dishes or adjusting pairing principles.

export const LOCAL_FLAVOUR_REFS =
  `lychee and starfruit not tropical fruit, red dates not dried fruit, pandan florals not floral aromatics, char siu richness not meaty, roasted barley like kopi-O not coffee notes, sharp like assam not tart acidity`;

export const LOCAL_CUISINE_KNOWLEDGE =
  `LOCAL CUISINE KNOWLEDGE — You have deep, dish-level knowledge of Singapore and SEA cuisine. Always name specific local dishes when explaining pairings. Never give generic "Asian food" advice.

REGIONAL CUISINES & SIGNATURE DISHES:
- Teochew: suckling pig (乳猪), chai poh kway teow (菜脯粿条), steamed fish (清蒸鱼), braised duck (卤鸭), oyster omelette (蚵仔煎), orh nee (芋泥)
- Hokkien: bak kut teh (肉骨茶), Hokkien prawn mee, char kway teow (炒粿条), popiah, lor bak
- Cantonese: dim sum (har gow, siu mai, char siu bao), char siu (叉烧), siu yuk (烧肉), steamed fish with ginger-scallion, wonton noodles
- Peranakan/Nonya: laksa lemak, ayam buah keluak, beef rendang, ngoh hiang, kueh pie tee
- Malay: nasi lemak with sambal, rendang, satay with peanut sauce, mee rebus, lontong
- Indian: fish head curry, roti prata, banana leaf rice, biryani (chicken or mutton), butter chicken
- Zi char: kung pao prawns, cereal butter prawns, salted egg yolk crab, sweet & sour pork, sambal kangkong, steamed tofu
- Hawker staples: Hainanese chicken rice, wonton mee, carrot cake (chai tow kway), rojak, cai png, chilli crab, black pepper crab

PAIRING PRINCIPLES FOR LOCAL DISHES:
- Rich/fatty (rendang, siu yuk, bak kut teh, char siu): high acidity cuts fat — Burgundy Pinot Noir, Champagne, Riesling, Barbera
- Spicy (laksa, curry, sambal nasi lemak, chilli crab): off-dry aromatic whites tame heat — Gewürztraminer, off-dry Riesling, Pinot Gris, Viognier; avoid high-tannin reds
- Delicate seafood (Teochew steamed fish, prawn dishes): crisp mineral whites — Chablis, Muscadet, Albariño, Mosel Riesling Kabinett
- Oyster dishes: Champagne, Chablis, Muscadet
- Umami/braised/soy (braised duck, lor bak, XO sauce, chicken rice): earthy medium-bodied reds or oxidative whites — Pinot Noir, aged Nebbiolo, Fino Sherry
- Wok hei/char (char kway teow, Hokkien mee, carrot cake): wines with body and smoky/toasty notes — Grenache, Syrah, oaked Chardonnay, Alsatian Pinot Gris
- Sweet/caramelised (char siu, satay peanut sauce): ripe fruit or slight sweetness — Grenache, Pinot Noir, off-dry Riesling
- Tangy/tamarind (assam fish, rojak, tamarind prawns): bright acidity and citrus to mirror tartness
- Suckling pig (Teochew style): fine bubbles and high acidity cut crackling fat without masking delicate pork — Champagne, Blanc de Blancs, dry Riesling
- Chai poh kway teow (salty preserved radish noodles): salt demands slight sweetness or firm body — off-dry Gewürztraminer, Alsatian Pinot Gris, or crisp Chablis by contrast

HANDLING MULTI-DISH MEAL QUERIES:
When the user mentions multiple dishes or a cuisine style (e.g. "Teochew spread", "zichar dinner with suckling pig and chai poh kway teow"):
1. Identify the dominant pairing challenge across all dishes (richest, spiciest, or most assertive sauce)
2. Find the wine that satisfies the most dishes without failing any
3. State trade-offs explicitly: "This wine is ideal for the suckling pig; for the chai poh kway teow alone you might prefer..."
4. If dishes are genuinely incompatible (e.g. delicate steamed fish + fiery curry), recommend two bottles by course cluster
5. Always name each specific dish — never say "the fish dish", say "the Teochew steamed pomfret"`;
