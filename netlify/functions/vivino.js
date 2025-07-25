const { ApifyClient } = require('apify-client');

exports.handler = async function(event) {
    try {
        const token = process.env.APIFY_TOKEN;
        if (!token) throw new Error('APIFY_TOKEN is not set');
        
        const client = new ApifyClient({ token });
        
        const { query } = JSON.parse(event.body);
        
        console.log(`Received search query: ${query}`);
        const run = await client.actor('canadesk/vivino').call({
            process: 'gs',
            keyword: query,
            market: 'SG',
            maximum: 200,
            pricemax: 1000,
            sortby: 'ratings_average',
            summary: false,
            proxy: {
                useApifyProxy: true,
                apifyProxyGroups: [
                    "RESIDENTIAL"
                ]
            },
            
        });
        
        const { items } = await client.dataset(run.defaultDatasetId).listItems();
        
        const cachedResults = items.map(wine => ({
            id: wine.id,
            name: wine.name,
            image_url: wine.summary.image,
            bottle_image_url: wine.image.variations.bottle_medium,
            alcohol: wine.summary.alcoholLevel,
            country: wine.summary.country,
            region: wine.region.name,
            variety: (wine.grapes ?? []),
            rating: wine.summary.rating,
            winery: wine.summary.winery,
            description: wine.description,
            type: wine.summary.type,
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