// Global utility functions and data management
class WineApp {
    constructor() {
        this.wines = [];
        this.currentSearch = '';
        this.searchResults = [];
    }
}

// Global app instance
const wineApp = new WineApp();

// Utility functions
function getWineImageUrl(wine) {
    return wine.image_url || 'images/wine-placeholder.jpg';
}

function formatPrice(price) {
    if (!price || price === 'null') return 'Price not available';
    return `$${parseFloat(price).toFixed(2)}`;
}

function formatPoints(points) {
    if (!points || points === 'null') return 'Not rated';
    return `${points}/100`;
}

function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'flex';
}
function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}