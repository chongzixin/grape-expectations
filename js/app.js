// Global utility functions and data management
class WineApp {
    constructor() {
        this.wines = [];
        this.currentSearch = '';
        this.searchResults = [];
    }

    async loadWineData() {
        try {
            const response = await fetch('data/wines.csv');
            const csvText = await response.text();
            this.wines = this.parseCSV(csvText);
            return this.wines;
        } catch (error) {
            console.error('Error loading wine data:', error);
            return [];
        }
    }

    parseCSV(csvText) {
        const lines = csvText.trim().split('\n');
        const headers = lines[0].split(',').map(header => header.trim().replace(/"/g, ''));
        const wines = [];

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);
            if (values.length === headers.length) {
                const wine = {};
                headers.forEach((header, index) => {
                    wine[header] = values[index].replace(/"/g, '');
                });
                wines.push(wine);
            }
        }
        return wines;
    }

    parseCSVLine(line) {
        const values = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                values.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        values.push(current.trim());
        return values;
    }

    searchWines(query) {
        if (!query) return [];
        
        const searchTerms = query.toLowerCase().split(' ');
        
        return this.wines.filter(wine => {
             // Concatenate all values from the wine object
            const searchableText = Object.values(wine).join(' ').toLowerCase();
            return searchTerms.every(term => searchableText.includes(term));
        });
    }

    getWineById(id) {
        return this.wines[id] || null;
    }

    saveSearchResults(results, query) {
        this.searchResults = results;
        this.currentSearch = query;
        localStorage.setItem('searchResults', JSON.stringify(results));
        localStorage.setItem('currentSearch', query);
    }

    loadSearchResults() {
        const results = localStorage.getItem('searchResults');
        const query = localStorage.getItem('currentSearch');
        if (results && query) {
            this.searchResults = JSON.parse(results);
            this.currentSearch = query;
        }
        return { results: this.searchResults, query: this.currentSearch };
    }
}

// Global app instance
const wineApp = new WineApp();

// Utility functions
function formatPrice(price) {
    if (!price || price === 'null') return 'Price not available';
    return `$${parseFloat(price).toFixed(2)}`;
}

function formatPoints(points) {
    if (!points || points === 'null') return 'Not rated';
    return `${points}/100`;
}

function getWineImageUrl(wine) {
    if (wine && wine.image_url && wine.image_url.startsWith('http')) {
        return wine.image_url;
    }
    return 'images/wine-placeholder.jpg';
}

function showLoading() {
    document.getElementById('loadingIndicator').style.display = 'flex';
}
function hideLoading() {
    document.getElementById('loadingIndicator').style.display = 'none';
}