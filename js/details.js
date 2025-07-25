document.addEventListener('DOMContentLoaded', async function() {
  // Get wine object and especially the id
  const selectedWineUrl = localStorage.getItem('selectedWineUrl');

  try {
    // Call your new Netlify function with wine.id
    const resp = await fetch(`/.netlify/functions/vivino-details?id=${selectedWineUrl}`);
    const details = await resp.json();
    console.log('Wine details:', details);
    hideLoading();

    document.getElementById('wineImage').src = details.image_url || 'images/wine-placeholder.png';
    document.getElementById('wineName').textContent = details.name || '';
    document.getElementById('wineCountry').textContent = details.country || '';
    document.getElementById('wineRegion').textContent = details.region || '';
    document.getElementById('wineVariety').textContent = details.variety || '';
    document.getElementById('winePoints').textContent = details.rating || '';
    document.getElementById('wineryName').textContent = details.winery || '';
    document.getElementById('wineDescription').textContent = details.description || '';
    document.getElementById('foodPairings').textContent = details.food_pairing || '';
    document.getElementById('tastingNotes').textContent = details.tasting_notes || '';
    document.getElementById('winePrice').textContent = details.price ? `$${details.price}` : '';
  } catch (e) {
    alert('Could not load detailed wine info');
  }
});
