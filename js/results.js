document.addEventListener('DOMContentLoaded', function() {
    const searchQuery = document.getElementById('searchQuery');
    const resultCount = document.getElementById('resultCount');
    const wineGrid = document.getElementById('wineGrid');
    const countryFilter = document.getElementById('countryFilter');
    const priceFilter = document.getElementById('priceFilter');

    let allResults = [];
    let filteredResults = [];

    // Load search results
    const { results, query } = wineApp.loadSearchResults();
    allResults = results || [];
    filteredResults = allResults;

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
                <img src="${getWineImageUrl(wine)}" alt="${wine.title || 'Wine bottle'}" style="width:100px;height:120px;object-fit:cover;border-radius:5px;">
            </div>
            <h3>${wine.title || 'Unknown Wine'}</h3>
            <div class="country">${wine.country || 'Unknown'}, ${wine.region || 'Unknown Region'}</div>
            <div class="price">${formatPrice(wine.price)}</div>
        `;

        return card;
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
