// Always hide loading indicator immediately on script load to support back button navigation
if (typeof hideLoading === 'function') hideLoading();

document.addEventListener('DOMContentLoaded', function() {
    hideLoading();

    const searchQuery = document.getElementById('searchQuery');
    const resultCount = document.getElementById('resultCount');
    const wineGrid = document.getElementById('wineGrid');
    const countryFilter = document.getElementById('countryFilter');
    const priceFilter = document.getElementById('priceFilter');

    const query = localStorage.getItem('currentSearch') || '';
    const allResults = JSON.parse(localStorage.getItem('searchResults') || '[]');
    let filteredResults = allResults;

    // Update page content
    searchQuery.textContent = `Results for "${query}"`;
    resultCount.textContent = `Found ${allResults.length} wines`;

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
                <img src="${getWineImageUrl(wine)}" alt="${wine.name || 'Wine bottle'}" style="width:100%;height:auto;object-fit:cover;border-radius:5px;">
            </div>
            <div class="price">${wine.winery || 'Unknown Winery'}</div>
            <h3>${wine.name || 'Unknown Wine'}</h3>
            <div class="country">${wine.country || 'Unknown'}, ${wine.region || 'Unknown Region'}</div>
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

            // Price filter
            if (priceFilter.value && wine.price) {
                const price = parseFloat(wine.price);
                const range = priceFilter.value;
                
                if (range === '0-25' && price >= 25) return false;
                if (range === '25-50' && (price < 25 || price >= 50)) return false;
                if (range === '50-100' && (price < 50 || price >= 100)) return false;
                if (range === '100+' && price < 100) return false;
            }

            return true;
        });

        displayResults(filteredResults);
        resultCount.textContent = `Showing ${filteredResults.length} of ${allResults.length} wines`;
    }

    // Event listeners for filters
    countryFilter.addEventListener('change', applyFilters);
    priceFilter.addEventListener('change', applyFilters);

    // Initial display
    displayResults(allResults);
});
