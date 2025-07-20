document.addEventListener('DOMContentLoaded', function() {
    const wineIndex = localStorage.getItem('selectedWineIndex');
    const { results } = wineApp.loadSearchResults();
    
    if (!wineIndex || !results || !results[wineIndex]) {
        alert('Wine not found');
        window.location.href = 'index.html';
        return;
    }

    const wine = results[wineIndex];
    displayWineDetails(wine);
});

function displayWineDetails(wine) {
    console.log(wine);
    // Basic information
    document.getElementById('wineName').textContent = wine.title || 'Unknown Wine';
    document.getElementById('winePrice').textContent = formatPrice(wine.price);
    document.getElementById('wineCountry').textContent = wine.country || 'Unknown';
    document.getElementById('wineRegion').textContent = wine.region || 'Unknown';
    document.getElementById('wineVariety').textContent = wine.variety || 'Unknown';
    document.getElementById('winePoints').textContent = wine.points || 'Not rated';
    
    // Description
    document.getElementById('wineDescription').textContent = wine.description || 'No description available for this wine.';

    document.getElementById('wineryHistory').textContent = wine.winery_history || 'No winery history available.';
    document.getElementById('tasteProfile').textContent = wine.tasting_notes || 'No taste profile available.';
    document.getElementById('foodPairings').textContent = wine.food_pairing || 'No food pairings available.';
    
    // Set wine image
    document.getElementById('wineImage').src = getWineImageUrl(wine);
    document.getElementById('wineImage').alt = wine.title || 'Wine bottle';
}
