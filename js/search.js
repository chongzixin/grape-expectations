// Always hide loading indicator immediately on script load to support back button navigation
if (typeof hideLoading === 'function') hideLoading();
window.addEventListener('pageshow', function() {
    if (typeof hideLoading === 'function') hideLoading();
});

document.addEventListener('DOMContentLoaded', async function() {
    // hide loading indicator immediately on script load to support back button navigation
    if (typeof hideLoading === 'function') hideLoading();

    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    const suggestionTags = document.querySelectorAll('.tag');

    // Load wine data
    await wineApp.loadWineData();

    // Search functionality
    function performSearch() {
        const query = searchInput.value.trim();
        if (!query) {
            alert('Please enter a search term');
            return;
        }

        // Show loading state
        showLoading();
        searchBtn.disabled = true;

        setTimeout(() => {
            const results = wineApp.searchWines(query);
            wineApp.saveSearchResults(results, query);
            
            // Navigate to results page
            window.location.href = 'search-results.html';
        }, 500);
    }

    // Event listeners
    searchBtn.addEventListener('click', performSearch);

    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Suggestion tags
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const searchTerm = this.getAttribute('data-search');
            searchInput.value = searchTerm;
            performSearch();
        });
    });

    // Auto-focus search input
    searchInput.focus();
});
