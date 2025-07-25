if (typeof hideLoading === 'function') hideLoading();

document.addEventListener('DOMContentLoaded', function() {
  hideLoading();
  
  const vivinoResults = JSON.parse(localStorage.getItem('searchResults') || '[]');
  const selectedIndex = localStorage.getItem('selectedWineIndex');
  const wine = vivinoResults[selectedIndex];

  console.log(vivinoResults);
  console.log(`Displaying details for wine at index ${selectedIndex}:`, wine);
  
  if (!wine) return;
  
  document.getElementById('wineImage').src = `https:${wine.bottle_image_url}` || 'images/wine-placeholder.jpg';
  document.getElementById('wineryName').textContent = wine.winery || '';
  document.getElementById('wineName').textContent = wine.name || '';

  document.getElementById('wineRating').innerHTML = wine.rating
    ? `<span class="star-icon">⭐</span> <span class="rating-figure">${Number(wine.rating).toFixed(1)}</span>`
    : 'Not rated';

  document.getElementById('wineType').textContent = wine.type || '';
  document.getElementById('wineCountry').textContent = wine.country || '';
  document.getElementById('wineRegion').textContent = wine.region || '';
  document.getElementById('wineAlcohol').textContent = wine.alcohol ? `${wine.alcohol}% ABV` : '';
  document.getElementById('wineDescription').textContent = wine.description || '';
  document.getElementById('foodPairings').textContent = wine.food_pairing || '';
  document.getElementById('tastingNotes').textContent = wine.variety || '';
});