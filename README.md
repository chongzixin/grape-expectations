# Grape Expectations

Your Singaporean sommelier app that recommends what to drink based on what is in the cellar and what food you are having.

## Database

As this is a prototype, a Google Sheets will be used as a database so that it's easy to view records.

| Name | Winery | Vintage | Price | Inventory | Style | Country | Region | Sub-Region | Type |
|---|---|---|---|---|---|---|---|---|---|
| Vosne-Romanee La Croix Blanche | Domaine Chevillon-Chezeaux | 2022 | - | 1 | Pinot Noir | France | Burgundy | Vosne-Romanee | Red |
| Vosne-Romanee 1er Cru Les Rouges | Bruno Desaunay-Bissey | 2013 | 170 | 1 | Pinot Noir | France | Burgundy | Vosne-Romanee | Red |
| Julienas | Chateau Des Capitans | 2022 | - | 1 | Gamay | France | Beaujolais | Julienas | Red |
| Single Vineyard Chardonnay | PepperGreen Estate | 2021 | - | 1 | Chardonnay | Australia | New South Wales | Southern Highlands | White |
| Lluerna Xarel-lo | Els Vinyerons | 2022 | - | 1 | Xarel-lo | Spain | Catalunya | Penedes | White |
| Cuvee St-Denis Brut Champagne Grand Cru | Varnier Fanniere | NV | - | 1 | Chardonnay | France | Champagne | Champagne Grand Cru | Sparkling |

## Features

### Cellar Management

- Add wines by taking photo of wine label or invoice.
- List wines and update number of bottles conveniently. Set inventory to 0 when there are no more bottles of that wine. Don't list wines when inventory is 0.

### Cellar Analytics

- Use Perplexity AI to give a summary of the wines in the cellar.
- Also list the following
  - Total Number of Bottles
  - Total Unique Bottles
  - Average price per bottle
  - Number of 2018 vintage bottles
  - Number of 2023 vintage bottles
  - Mode vintage (i.e. vintage with the most bottles)
  - Mode country (i.e. country with the most bottles)
  - Mode style

### Wine Pairing Recommendations

- Conversational based on budget (mood, occasion) and food pairing. (e.g. preferably light red daily drinking bottle to pair with pizza)
- Recommend up to 3 bottles from cellar ideally with different varietals, 2 best recommendations based on grape varietals that may not be in cellar.
- For each recommendation, explain any interesting history behind the winery or winemaker, and why the bottle will pair well with the food based on WSET standards

## Features to consider

- Add wines by uploading receipt

## History of Pivoting Points for the app

- [February 2026] With learnings from previous versions below, I decided that it wasn't worth trying to build another Wine Searcher given the high effort to get a proper database. Based on my interactions with Sommeliers at wine bars or when spectating competitions, the ability to describe and explain the wine without being overly pushy and salesy is important, but the ones that stand out memorably are the ones who can recommend based on local Singaporean dishes (nasi lemak, rendang, etc.). This iteration of the app attempts to meet this need.
- [July 2025] The initial idea of the app was to be a Wine Searcher. 2 versions were implemented.
  - A purely static one powered by a CSV database. While technically convenient, obtaining a big enough database of wines together with theri images proved to be difficult. Attempts included scraping Vivino database through Apify (check out the repository `vivino-scraper` which only yielded about 9k unique wines). This version can be found on the branch `static-version`.
  - A second dynamic one that connects to Vivino APIs through Apify was explored. While data is more complete (more wines and data fields), latency was high (up to 30 seconds or more) because Apify needed to get around Vivino servers.