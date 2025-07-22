document.addEventListener('DOMContentLoaded', function() {
    hideLoading();

    const vivinoResults = JSON.parse(localStorage.getItem('searchResults') || '[]');
    const selectedIndex = localStorage.getItem('selectedWineIndex');
    const wine = vivinoResults[selectedIndex];

    if (!wine) return;

    document.getElementById('wineImage').src = wine.image_url || 'images/wine-placeholder.jpg';
    document.getElementById('wineName').textContent = wine.name || '';
    document.getElementById('winePrice').textContent = wine.price ? `$${wine.price}` : '';
    document.getElementById('wineCountry').textContent = wine.country || '';
    document.getElementById('wineRegion').textContent = wine.region || '';
    document.getElementById('wineVariety').textContent = wine.variety || '';
    document.getElementById('winePoints').textContent = wine.points || '';
    document.getElementById('wineryName').textContent = wine.winery || '';
    document.getElementById('wineDescription').textContent = wine.description || '';
    document.getElementById('foodPairings').textContent = wine.food_pairing || '';
    document.getElementById('tastingNotes').textContent = wine.tasting_notes || '';
});