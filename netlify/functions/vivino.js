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
        console.log(`Fetched ${items.length} wines for query: ${query}`);
        
        const cachedResults = items.map(wine => ({
            url: wine.summary.url,
            name: wine.name,
            image_url: wine.summary.image,
            alcohol: wine.summary.alcoholLevel,
            country: wine.region.country,
            region: wine.region.name,
            // variety: wine.grapes.map(grape => grape.name).join(', '),
            rating: wine.summary.rating,
            // price: wine.price,
            // points: wine.points,
            winery: wine.summary.winery,
            description: wine.description,
            // tasting_notes: wine.tasting_notes,
            // food_pairing: wine.foods.map(food => food.name).join(', ')
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