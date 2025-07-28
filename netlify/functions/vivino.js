const { ApifyClient } = require('apify-client');

exports.handler = async function(event) {
    try {
        const token = process.env.APIFY_TOKEN;
        if (!token) throw new Error('APIFY_TOKEN is not set');
        
        const client = new ApifyClient({ token });
        
        const { query } = JSON.parse(event.body);
        
        console.log(`Received search query: ${query}`);
        const run = await client.actor('canadesk/vivino-bulk').call({
            process: 'gs',
            keywords: [query],
            market: 'SG',
            maximum: 200,
            pricemax: 1000,
            sortby: 'ratings_average',
            summary: false,
            proxy: {
                useApifyProxy: true,
                apifyProxyGroups: [
                    "RESIDENTIAL"
                ],
                apifyProxyCountry: 'SG'
            }, 
        });
        
        const response = await client.dataset(run.defaultDatasetId).listItems();
        const cachedResults = (response.items[0]?.data || []).map(wine => ({
            id: wine.id,
            name: wine.name,
            image_url: wine.summary.image,
            bottle_image_url: wine.image.variations.bottle_medium,
            alcohol: wine.summary?.alcoholLevel || 0,
            country: wine.summary?.country ?? 'Unknown Country',
            region: wine.region?.name ?? 'Unknown Region',
            variety: (wine.grapes ?? []),
            rating: wine.summary?.rating ?? 0,
            winery: wine.summary?.winery ?? 'Unknown Winery',
            description: wine.description,
            type: wine.summary?.type ?? 'Unknown Type',
            food_pairing: (wine.foods ?? [])
        }));
        console.log(`Returning ${JSON.stringify(cachedResults)} wines as response`);
        
        return {
            statusCode: 200,
            body: JSON.stringify(cachedResults)
        };
    } catch (error) {
        console.error('Error in Vivino function:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};