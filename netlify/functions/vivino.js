const { ApifyClient } = require('apify-client');

exports.handler = async function(event) {
    try {
        const token = process.env.APIFY_TOKEN;
        if (!token) throw new Error('APIFY_TOKEN is not set');

        const client = new ApifyClient({ token });

        const { query } = JSON.parse(event.body);

        const run = await client.actor('canadesk/vivino').call({
            search: query,
            market: 'SG'
        });

        const { items } = await client.dataset(run.defaultDatasetId).listItems();

        const cachedResults = items.map(wine => ({
            id: wine.id,
            name: wine.name,
            image_url: wine.image_url,
            country: wine.country,
            region: wine.region,
            variety: wine.variety,
            price: wine.price,
            points: wine.points,
            winery: wine.winery,
            description: wine.description,
            tasting_notes: wine.tasting_notes,
            food_pairing: wine.food_pairing
        }));

        return {
            statusCode: 200,
            body: JSON.stringify(cachedResults)
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        };
    }
};