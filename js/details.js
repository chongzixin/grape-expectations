if (typeof hideLoading === 'function') hideLoading();

document.addEventListener('DOMContentLoaded', function() {
  hideLoading();
  
  const vivinoResults = JSON.parse(localStorage.getItem('searchResults') || '[]');
  const selectedIndex = localStorage.getItem('selectedWineIndex');
  const wine = vivinoResults[selectedIndex];

  console.log(vivinoResults);
  console.log(`Displaying details for wine at index ${selectedIndex}:`, wine);
  
  if (!wine) return;

  // first translate the grape and food pairing IDs to names
  console.log(wine.variety, wine.food_pairing);
  const wineVariety = wine.variety.map(id => getNameById("grapes", id)).join(', ') || '';
  const foodPairing = wine.food_pairing.map(id => getNameById("foods", id)).join(', ') || '';
  
  document.getElementById('wineImage').src = wine.bottle_image_url?.trim() ? `https:${wine.bottle_image_url}` : 'images/wine-placeholder.png';;
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
  document.getElementById('foodPairings').textContent = foodPairing || '';
  document.getElementById('wineVariety').textContent = wineVariety || '';
});