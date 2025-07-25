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
    return wine.image_url || 'images/wine-placeholder.png';
}

function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'flex';
}
function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}