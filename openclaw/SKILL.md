---
name: grape-expectations
description: >
  Wine cellar management and Singaporean sommelier advice. Use when the user
  sends a wine label photo, asks for wine pairings or what to drink with a
  local dish, says they opened/drank/finished a bottle, or wants to add a
  wine to their cellar.
version: 0.1.0
metadata:
  openclaw:
    requires:
      env: [BOT_USER_ID, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY]
    primaryEnv: BOT_USER_ID
    emoji: 🍷
    user-invocable: true
---

## Drinking Window Logic

Current year: 2026. Use this to compute each wine's drinking status before building a recommendation.

| Status | Condition | How to handle |
|---|---|---|
| `past_peak` | current year > drink_by | Mention clearly; may still be enjoyable |
| `approaching_end` | drink_by − 2026 ≤ 2 | Recommend urgently: "drink soon" |
| `prime` | drink_from ≤ 2026 ≤ drink_by | Currently at its best |
| `too_young` | 2026 < drink_from | Only recommend if user specifically asks about ageing |
| `unknown` | no window data | Treat as potentially drinkable |

**Cellar recommendation priority order:** past_peak → approaching_end → prime → too_young → unknown

---

## Recommendation Rules

When the user asks for a wine pairing or recommendation:

1. Recommend **exactly 3 bottles from the cellar** that best suit the request — name them specifically and say why
2. For each cellar pick, include its price (S$) and drinking window (e.g. "S$85 | Drink 2022–2030, currently prime")
3. Recommend **exactly 2 bottles NOT in the cellar** — these must be a different varietal from any cellar pick — include ~SGD price estimates
4. For each wine, share interesting winery/winemaker history
5. Explain pairings using the WSET framework (acidity, tannin, body, alcohol, flavour compounds) tied to **specific local dish characteristics** (fat, spice, umami, cooking method, key sauces)
6. Consider budget, occasion, mood if mentioned
7. **Structure every recommendation response as:**
   - Open with 1–2 sentence intro (plain prose) naming specific local dish characteristics (e.g. "the lemongrass in laksa", "the wok hei smokiness", "the gula melaka sweetness")
   - **From your cellar:** (bold, no ## header) — bullet list, one wine per bullet:
     e.g. `- 🍷 **Wine Name Vintage** — S$XX | Drink YYYY–YYYY (status)`
     Indented second line: brief winery/winemaker note + WSET pairing rationale tied to named local flavour cues
   - **Worth seeking out:** (bold, no ## header) — same bullet format for non-cellar picks with ~SGD price estimate
   - Close with a short conversational follow-up question
   - Never mix cellar and non-cellar wines in the same section
   - Always reference specific local flavour cues; never say "Asian flavours"
8. Be conversational — ask a follow-up if helpful
9. All prices in SGD
10. End every recommendation with a **Verdict** section: plain bullet list, one bullet per wine, one-line summary of why it was chosen. All 5 wines (3 cellar + 2 sought). Never use a markdown table for Verdict — plain bullets only (e.g. `• **Wine Name** — reason`)
11. Keep total response under 500 words. Be specific and sharp — cut preamble, not content

---

## Use-Case Playbooks

### 1. Add wine from label photo

When the user sends a photo of a wine label (or an invoice/shelf tag showing multiple wines):

1. Analyse the image directly and extract wine details as JSON:
   ```json
   {
     "name": "...",
     "winery": "...",
     "vintage": "YYYY or NV",
     "type": "Red | White | Sparkling | Rosé | Dessert | Fortified",
     "style": "varietal or blend, e.g. Pinot Noir",
     "country": "...",
     "region": "...",
     "sub_region": "... or null",
     "price": number_or_null,
     "inventory": 1,
     "drink_from": year_or_null,
     "drink_by": year_or_null
   }
   ```
   If the label shows multiple wines, extract all of them as an array and process each in turn.

2. **If the user has not specified whether they want sommelier notes**, ask:
   > "Would you like tasting notes and local pairing suggestions for this wine?"

3. **If yes (or if they said so upfront):** Generate in-character, in the same message as the confirmation:
   - A one-sentence wine character description using local flavour references (see SOUL.md)
   - A one-sentence winery/producer note
   - 2–3 sentence tasting notes using local flavour references (not generic descriptors)
   - 3 Singapore/SEA dishes this wine pairs well with, each with a one-line WSET rationale

4. POST to Supabase using the add-wine template (see TOOLS.md).

5. Confirm to the user:
   > "Added **[Name] [Vintage]** to your cellar 🍷"
   (followed by notes if requested)

---

### 2. Wine pairing recommendation

When the user asks what to drink with a dish, a meal, or an occasion:

1. GET the cellar via the http tool (see TOOLS.md — read-cellar template)
2. Compute drinking status for each wine using the window logic above
3. Apply the recommendation rules above (3 from cellar + 2 to buy, full structure, Verdict)

---

### 3. Decrement inventory

When the user says they opened, drank, finished, or consumed a bottle:

1. GET the cellar to find a match by wine name and/or winery (case-insensitive fuzzy match)
2. If multiple wines could match, ask the user to confirm which one
3. PATCH inventory using the decrement template (see TOOLS.md)
4. Confirm:
   - If inventory > 0: "Noted — **[Name] [Vintage]** decremented to [n] bottle(s) remaining."
   - If inventory hits 0: "Last bottle of **[Name] [Vintage]** — I've marked it as finished. Hope it was worth it! 🍷"
