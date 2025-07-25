const { ApifyClient } = require('apify-client');

exports.handler = async function(event) {
  try {
    const token = process.env.APIFY_TOKEN;
    if (!token) throw new Error('APIFY_TOKEN is not set');
    const client = new ApifyClient({ token });
    
    // Extract wine ID from query string
    const { id } = event.queryStringParameters;
    if (!id) return { statusCode: 400, body: 'Missing wine id' };
    
    // Call the Apify Vivino actor for wine details
    const run = await client.actor('canadesk/vivino').call({
      process: 'gw', // Use details wine process
      keyword: `https://${id}`, // prepend https:// to the id so that the search will become valid
      summary: true,
      proxy: {
        useApifyProxy: true,
        apifyProxyGroups: [
          "RESIDENTIAL"
        ]
      },
    });
    
    // Fetch results
    const { items } = await client.dataset(run.defaultDatasetId).listItems();
    if (!items || !items.length) return { statusCode: 404, body: 'Wine not found' };
    const wine = items[0];
    
    console.log(wine);
    
    // Format relevant fields
    const details = {
      name: wine.name,
      image_url: wine.summary.image,
      country: wine.region.country,
      region: wine.region.name,
      variety: (wine.grapes ?? []).map(grape => grape.name).join(', '),
      tasting_notes: wine.tasting_notes || '',
      food_pairing: (wine.foods ?? []).map(food => food.name).join(', '),
      description: wine.description || '',
      winery: wine.summary.winery,
      rating: wine.summary.rating,
      price: wine.price,
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify(details),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
