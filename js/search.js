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
    
    // Search functionality
    async function performSearch(query) {
        showLoading();
        searchBtn.disabled = true;
        
        console.log(query);

        try {
            const response = await fetch('/.netlify/functions/vivino', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query })
            });
            const cachedResults = await response.json();
            console.log(JSON.stringify(cachedResults));
            
            localStorage.setItem('searchResults', JSON.stringify(cachedResults));
            localStorage.setItem('currentSearch', query);
            
            window.location.href = 'search-results.html';
        } catch (e) {
            console.error('Error fetching results:', e);
            alert('Error fetching results from Vivino. Please try again.');
            hideLoading();
            searchBtn.disabled = false;
        }
    }
    
    // Event listeners
    searchBtn.addEventListener('click', () => {
        performSearch(searchInput.value.trim());
    });
    
    searchInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            performSearch(searchInput.value.trim());
        }
    });
    
    // Suggestion tags
    suggestionTags.forEach(tag => {
        tag.addEventListener('click', function() {
            const searchTerm = this.getAttribute('data-search');
            searchInput.value = searchTerm;
            performSearch(searchInput.value.trim());
        });
    });
    
    // Auto-focus search input
    searchInput.focus();
});
