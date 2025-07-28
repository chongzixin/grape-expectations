// Always hide loading indicator immediately on script load to support back button navigation
if (typeof hideLoading === 'function') hideLoading();
window.addEventListener('pageshow', function() {
    if (typeof hideLoading === 'function') hideLoading();
});

document.addEventListener('DOMContentLoaded', function() {
    hideLoading();
    
    const searchQuery = document.getElementById('searchQuery');
    const resultCount = document.getElementById('resultCount');
    const wineGrid = document.getElementById('wineGrid');
    const countryFilter = document.getElementById('countryFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    
    const query = localStorage.getItem('currentSearch') || '';
    const allResults = JSON.parse(localStorage.getItem('searchResults') || '[]');
    let filteredResults = allResults;
    
    // Update page content
    searchQuery.textContent = `Results for "${query}"`;
    resultCount.textContent = `Found ${allResults.length || 0} wines`;
    
    // Populate country filter
    const countries = [...new Set(allResults.map(wine => wine.country))].filter(Boolean);
    countries.forEach(country => {
        const option = document.createElement('option');
        option.value = country;
        option.textContent = country;
        countryFilter.appendChild(option);
    });
    
    function createWineCard(wine, index) {
        const card = document.createElement('div');
        card.className = 'wine-card';
        card.onclick = () => {
            showLoading();
            localStorage.setItem('selectedWineIndex', index);
            window.location.href = 'wine-details.html';
        };
        
        card.innerHTML = `
            <div class="wine-card-image">
                <img src="${wine.image_url || 'images/wine-placeholder.jpg'}" alt="${wine.name || 'Wine bottle'}">
            </div>
            <div class="winery-name">${wine.winery || 'Unknown Winery'}</div>
            <h3 class="wine-name">${wine.name || 'Unknown Wine'}</h3>
            <div class="country-region-rating">${wine.country || 'Unknown'}, ${wine.region || 'Unknown Region'} | ${wine.rating ? `⭐: ${wine.rating.toFixed(1)}` : 'Not rated'}</div>
        `;
        
        return card;
    }
    
    // Display results
    function displayResults(wines) {
        wineGrid.innerHTML = '';
        
        if (wines.length === 0) {
            wineGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; color: white; font-size: 1.2rem;">No wines found matching your criteria.</div>';
            return;
        }
        
        wines.forEach((wine, index) => {
            const wineCard = createWineCard(wine, index);
            wineGrid.appendChild(wineCard);
        });
    }
    
    // Filter functionality
    function applyFilters() {
        filteredResults = allResults.filter(wine => {
            // Country filter
            if (countryFilter.value && wine.country !== countryFilter.value) {
                return false;
            }
            
            // Rating filter
            if (ratingFilter.value && wine.rating !== undefined && wine.rating !== null && wine.rating !== '') {
                const rating = parseFloat(wine.rating);
                const range = ratingFilter.value;
                
                if (range === 'lt35' && rating >= 3.5) return false;
                if (range === '35-40' && (rating < 3.5 || rating >= 4.0)) return false;
                if (range === '40-45' && (rating < 4.0 || rating >= 4.5)) return false;
                if (range === 'gt45' && rating < 4.5) return false;
            }
            
            return true;
        });
        
        displayResults(filteredResults);
        resultCount.textContent = `Showing ${filteredResults.length} of ${allResults.length} wines`;
    }
    
    // Event listeners for filters
    countryFilter.addEventListener('change', applyFilters);
    ratingFilter.addEventListener('change', applyFilters);
    
    // Initial display
    displayResults(allResults);
});
