// Data Manager for Hot Wheels Collection
class DataManager {
    constructor() {
        this.cars = [];
        this.wishlist = [];
        this.config = {};
        this.useGitStorage = false;
        this.initialized = false;
        this.initPromise = this.init();
    }

    async init() {
        console.log('DataManager initializing...');
        // Check if Git storage is configured
        if (window.gitStorage) {
            // First check if config can be loaded
            const gitConfigured = window.gitStorage.loadConfig();
            if (gitConfigured && window.gitStorage.isConfigured) {
                this.useGitStorage = true;
                console.log('Using Git storage for data persistence');
            } else {
                console.log('Git storage not configured, using localStorage');
            }
        } else {
            console.log('Git storage not available, using localStorage');
        }
        
        console.log('DataManager: useGitStorage =', this.useGitStorage, 'gitStorage.isConfigured =', window.gitStorage?.isConfigured);
        
        await this.loadConfig();
        await this.loadCars();
        await this.loadWishlist();
        
        this.initialized = true;
        console.log('DataManager initialization complete. Cars:', this.cars.length, 'Wishlist:', this.wishlist.length);
    }

    // Simple encryption/decryption for password
    encrypt(text) {
        // Simple base64 encoding with character shifting
        const shifted = text.split('').map(char => 
            String.fromCharCode(char.charCodeAt(0) + 3)
        ).join('');
        return btoa(shifted);
    }

    decrypt(encrypted) {
        try {
            const decoded = atob(encrypted);
            return decoded.split('').map(char => 
                String.fromCharCode(char.charCodeAt(0) - 3)
            ).join('');
        } catch {
            return '';
        }
    }

    // Configuration management
    async loadConfig() {
        try {
            // Try Git storage first
            if (this.useGitStorage) {
                try {
                    this.config = await window.gitStorage.loadConfig();
                    if (Object.keys(this.config).length > 0) {
                        console.log('Loaded config from Git storage');
                        return;
                    }
                } catch (error) {
                    console.log('Failed to load config from Git, falling back to local');
                }
            }

            // Fallback to local file
            const response = await fetch('data/config.json');
            if (response.ok) {
                this.config = await response.json();
            } else {
                this.config = {
                    siteName: 'Hot Wheels Collection',
                    currency: 'INR'
                };
            }
        } catch (error) {
            console.log('Config file not found, using defaults');
            this.config = {
                siteName: 'Hot Wheels Collection',
                currency: 'INR'
            };
        }
    }

    // Car data management
    async loadCars() {
        try {
            console.log('loadCars: Starting, useGitStorage =', this.useGitStorage);
            
            // Try Git storage first if configured
            if (this.useGitStorage) {
                try {
                    console.log('loadCars: Attempting to load from Git storage...');
                    const gitCars = await window.gitStorage.loadCars();
                    console.log('loadCars: Git storage returned:', gitCars);
                    this.cars = gitCars || [];
                    console.log('Loaded cars from Git storage:', this.cars.length);
                    return;
                } catch (error) {
                    console.log('Failed to load cars from Git, falling back to local. Error:', error);
                }
            } else {
                console.log('loadCars: Git storage not active, skipping');
            }

            // Fallback to localStorage
            console.log('loadCars: Attempting localStorage...');
            const localData = localStorage.getItem('hotwheels_cars');
            if (localData) {
                try {
                    const parsedLocal = JSON.parse(localData);
                    const localCars = parsedLocal.cars || [];
                    this.cars = localCars;
                    console.log('Loaded cars from localStorage:', this.cars.length);
                    return;
                } catch (error) {
                    console.log('Error parsing localStorage data:', error);
                }
            } else {
                console.log('loadCars: No localStorage data found');
            }

            // Final fallback to local file
            console.log('loadCars: Attempting local file...');
            try {
                const response = await fetch('data/cars.json');
                if (response.ok) {
                    const data = await response.json();
                    this.cars = data.cars || [];
                    console.log('Loaded cars from local file:', this.cars.length);
                    return;
                }
            } catch (error) {
                console.log('No cars.json file found or error loading:', error);
            }

            // If all else fails, start with empty array
            console.log('loadCars: All sources failed, starting with empty array');
            this.cars = [];
        } catch (error) {
            console.log('Error loading cars data:', error);
            this.cars = [];
        }
    }

    async loadWishlist() {
        try {
            // Try Git storage first if configured
            if (this.useGitStorage) {
                try {
                    const gitWishlist = await window.gitStorage.loadWishlist();
                    this.wishlist = gitWishlist || [];
                    console.log('Loaded wishlist from Git storage:', this.wishlist.length);
                    return;
                } catch (error) {
                    console.log('Failed to load wishlist from Git, falling back to local');
                }
            }

            // Fallback to localStorage
            const localData = localStorage.getItem('hotwheels_wishlist');
            if (localData) {
                try {
                    const parsedLocal = JSON.parse(localData);
                    const localWishlist = parsedLocal.wishlist || [];
                    this.wishlist = localWishlist;
                    console.log('Loaded wishlist from localStorage:', this.wishlist.length);
                    return;
                } catch (error) {
                    console.log('Error parsing localStorage wishlist data');
                }
            }

            // Final fallback to local file
            try {
                const response = await fetch('data/wishlist.json');
                if (response.ok) {
                    const data = await response.json();
                    this.wishlist = data.wishlist || [];
                    console.log('Loaded wishlist from local file:', this.wishlist.length);
                    return;
                }
            } catch (error) {
                console.log('No wishlist.json file found');
            }

            // If all else fails, start with empty array
            this.wishlist = [];
        } catch (error) {
            console.log('Error loading wishlist data');
            this.wishlist = [];
        }
    }

    // Get all cars
    getCars() {
        return this.cars;
    }

    // Get car by ID
    getCarById(id) {
        return this.cars.find(car => car.id === parseInt(id));
    }

    // Add new car
    async addCar(carData) {
        console.log('Adding car, useGitStorage:', this.useGitStorage);
        const newCar = {
            id: this.getNextId(),
            ...carData,
            dateAdded: new Date().toISOString()
        };
        this.cars.push(newCar);
        await this.saveCars();
        return newCar;
    }

    // Update car
    async updateCar(id, carData) {
        const index = this.cars.findIndex(car => car.id === parseInt(id));
        if (index !== -1) {
            this.cars[index] = { ...this.cars[index], ...carData };
            await this.saveCars();
            return this.cars[index];
        }
        return null;
    }

    // Delete car
    async deleteCar(id) {
        console.log(`Attempting to delete car with ID: ${id}`);
        console.log('Git storage status:', this.useGitStorage ? 'Active' : 'Inactive');
        console.log('Git storage configured:', window.gitStorage?.isConfigured);
        
        const index = this.cars.findIndex(car => car.id === parseInt(id));
        if (index !== -1) {
            const deletedCar = this.cars[index];
            console.log(`Found car to delete: ${deletedCar.name}`);
            
            // Make a backup of the car in case we need to restore it
            const carBackup = { ...deletedCar };
            
            // Remove from memory first
            this.cars.splice(index, 1);
            console.log(`Cars after removal: ${this.cars.length}`);
            
            try {
                console.log('Calling saveCars after deletion...');
                console.log('Current useGitStorage:', this.useGitStorage);
                console.log('Git storage isConfigured:', window.gitStorage?.isConfigured);
                
                await this.saveCars();
                console.log('saveCars completed successfully after deletion');
                
                // Also delete the associated image if using Git storage
                if (this.useGitStorage && window.gitStorage?.isConfigured && deletedCar.image) {
                    try {
                        console.log('Attempting to delete associated image:', deletedCar.image);
                        await window.gitStorage.deleteImage(deletedCar.image);
                        console.log('Image deletion completed');
                    } catch (imageError) {
                        console.warn('Failed to delete image, but car deletion will continue:', imageError);
                    }
                }
                
                console.log(`Car "${deletedCar.name}" deleted successfully and saved`);
                return true;
            } catch (error) {
                // Restore the car if save failed
                console.error('Failed to save after deleting car, restoring car:', error);
                this.cars.splice(index, 0, carBackup);
                console.log(`Cars after restoration: ${this.cars.length}`);
                throw error;
            }
        }
        console.log(`Car with ID ${id} not found`);
        return false;
    }

    // Wishlist management
    getWishlist() {
        return this.wishlist;
    }

    async addToWishlist(item) {
        const newItem = {
            id: this.getNextWishlistId(),
            ...item,
            dateAdded: new Date().toISOString()
        };
        this.wishlist.push(newItem);
        await this.saveWishlist();
        return newItem;
    }

    async removeFromWishlist(id) {
        const index = this.wishlist.findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            const deletedItem = this.wishlist[index];
            this.wishlist.splice(index, 1);
            
            try {
                await this.saveWishlist();
                console.log(`Wishlist item "${deletedItem.name}" deleted successfully`);
                return true;
            } catch (error) {
                // Restore the item if save failed
                this.wishlist.splice(index, 0, deletedItem);
                console.error('Failed to save after deleting wishlist item:', error);
                throw error;
            }
        }
        return false;
    }

    // Utility methods
    getNextId() {
        return this.cars.length > 0 ? Math.max(...this.cars.map(car => car.id)) + 1 : 1;
    }

    getNextWishlistId() {
        return this.wishlist.length > 0 ? Math.max(...this.wishlist.map(item => item.id)) + 1 : 1;
    }

    // Statistics
    getStatistics() {
        const totalCars = this.cars.length;
        const totalValue = this.cars.reduce((sum, car) => sum + (parseFloat(car.purchasePrice) || 0), 0);
        
        const brandStats = {};
        const seriesStats = {};
        const colorStats = {};
        const conditionStats = {};
        
        this.cars.forEach(car => {
            // Brand statistics
            brandStats[car.brand] = (brandStats[car.brand] || 0) + 1;
            
            // Series statistics
            seriesStats[car.series] = (seriesStats[car.series] || 0) + 1;
            
            // Color statistics
            colorStats[car.color] = (colorStats[car.color] || 0) + 1;
            
            // Condition statistics
            conditionStats[car.condition] = (conditionStats[car.condition] || 0) + 1;
        });

        return {
            totalCars,
            totalValue,
            brandStats,
            seriesStats,
            colorStats,
            conditionStats,
            averagePrice: totalCars > 0 ? totalValue / totalCars : 0
        };
    }

    // Search and filter
    searchCars(query, filters = {}) {
        let filteredCars = this.cars;

        // Text search
        if (query) {
            const searchTerm = query.toLowerCase();
            filteredCars = filteredCars.filter(car =>
                car.name.toLowerCase().includes(searchTerm) ||
                car.brand.toLowerCase().includes(searchTerm) ||
                car.series.toLowerCase().includes(searchTerm) ||
                car.color.toLowerCase().includes(searchTerm) ||
                car.description.toLowerCase().includes(searchTerm)
            );
        }

        // Apply filters
        if (filters.brand) {
            filteredCars = filteredCars.filter(car => car.brand === filters.brand);
        }
        if (filters.series) {
            filteredCars = filteredCars.filter(car => car.series === filters.series);
        }
        if (filters.color) {
            filteredCars = filteredCars.filter(car => car.color === filters.color);
        }
        if (filters.condition) {
            filteredCars = filteredCars.filter(car => car.condition === filters.condition);
        }

        return filteredCars;
    }

    // Sort cars
    sortCars(cars, sortBy, direction = 'asc') {
        return cars.sort((a, b) => {
            let aVal, bVal;
            
            switch (sortBy) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'brand':
                    aVal = a.brand.toLowerCase();
                    bVal = b.brand.toLowerCase();
                    break;
                case 'purchaseDate':
                    aVal = new Date(a.purchaseDate);
                    bVal = new Date(b.purchaseDate);
                    break;
                case 'price':
                    aVal = parseFloat(a.purchasePrice) || 0;
                    bVal = parseFloat(b.purchasePrice) || 0;
                    break;
                default:
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
            }

            if (aVal < bVal) return direction === 'asc' ? -1 : 1;
            if (aVal > bVal) return direction === 'asc' ? 1 : -1;
            return 0;
        });
    }

    // Get unique values for filters
    getUniqueValues(field) {
        const values = [...new Set(this.cars.map(car => car[field]))];
        return values.filter(value => value && value.trim() !== '').sort();
    }

    // Authentication
    validatePassword(password) {
        const storedPassword = this.decrypt(this.config.adminPassword);
        return password === storedPassword;
    }

    // Currency formatting helper
    formatCurrency(amount) {
        const currency = this.config.currency || 'INR';
        const formattedAmount = parseFloat(amount || 0).toFixed(2);
        
        switch (currency) {
            case 'INR':
                return `₹${formattedAmount}`;
            case 'USD':
                return `$${formattedAmount}`;
            case 'EUR':
                return `€${formattedAmount}`;
            case 'GBP':
                return `£${formattedAmount}`;
            case 'CAD':
                return `C$${formattedAmount}`;
            case 'AUD':
                return `A$${formattedAmount}`;
            default:
                return `${currency} ${formattedAmount}`;
        }
    }

    // Data persistence
    async saveCars() {
        console.log('=== saveCars called ===');
        console.log('useGitStorage:', this.useGitStorage);
        console.log('Git storage configured:', window.gitStorage?.isConfigured);
        console.log('Cars to save:', this.cars.length);
        
        // Check if Git storage is properly configured
        if (this.useGitStorage && window.gitStorage?.isConfigured) {
            try {
                console.log('Attempting to save cars to Git repository...');
                console.log('First few cars:', this.cars.slice(0, 2).map(car => ({ id: car.id, name: car.name })));
                
                const result = await window.gitStorage.saveCars(this.cars);
                console.log('Git save result:', result);
                console.log('Cars saved to Git repository successfully');
                
                // Also save to localStorage as backup
                const data = {
                    cars: this.cars,
                    lastUpdated: new Date().toISOString()
                };
                localStorage.setItem('hotwheels_cars', JSON.stringify(data));
                console.log('Cars also saved to localStorage as backup');
                return;
            } catch (error) {
                console.error('Failed to save cars to Git storage:', error);
                console.error('Error details:', {
                    message: error.message,
                    stack: error.stack
                });
                throw error;
            }
        }
        
        // Use localStorage if Git storage is not configured
        console.log('Saving cars to localStorage (Git storage not configured)');
        const data = {
            cars: this.cars,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('hotwheels_cars', JSON.stringify(data));
        this.createDownloadableFile('cars.json', data);
        console.log('Cars saved to localStorage and download created');
        console.log('=== saveCars completed ===');
    }

    async saveWishlist() {
        console.log('saveWishlist called, useGitStorage:', this.useGitStorage);
        // If Git storage is configured, save there primarily
        if (this.useGitStorage) {
            try {
                console.log('Attempting to save wishlist to Git repository...');
                await window.gitStorage.saveWishlist(this.wishlist);
                console.log('Wishlist saved to Git repository');
                
                // Also save to localStorage as backup
                const data = {
                    wishlist: this.wishlist,
                    lastUpdated: new Date().toISOString()
                };
                localStorage.setItem('hotwheels_wishlist', JSON.stringify(data));
                return;
            } catch (error) {
                console.error('Failed to save wishlist to Git storage:', error);
                throw error;
            }
        }
        
        // Only use localStorage if Git storage is not configured
        console.log('Saving wishlist to localStorage (Git storage not configured)');
        const data = {
            wishlist: this.wishlist,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('hotwheels_wishlist', JSON.stringify(data));
        this.createDownloadableFile('wishlist.json', data);
    }

    async saveConfig() {
        // If Git storage is configured, save there primarily
        if (this.useGitStorage) {
            try {
                await window.gitStorage.saveConfig(this.config);
                console.log('Config saved to Git repository');
                
                // Also save to localStorage as backup
                localStorage.setItem('hotwheels_config', JSON.stringify(this.config));
                return;
            } catch (error) {
                console.error('Failed to save config to Git storage:', error);
                throw error;
            }
        }
        
        // Only use localStorage if Git storage is not configured
        localStorage.setItem('hotwheels_config', JSON.stringify(this.config));
        this.createDownloadableFile('config.json', this.config);
    }

    // Create downloadable file (for development/backup purposes)
    createDownloadableFile(filename, data) {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        // Store the URL for potential download
        if (!window.downloadableFiles) {
            window.downloadableFiles = {};
        }
        window.downloadableFiles[filename] = url;
    }

    // Export functionality
    exportToCSV() {
        const headers = ['Name', 'Brand', 'Series', 'Year', 'Color', 'Scale', 'Condition', 'Purchase Price', 'Purchase Date', 'Description'];
        const csvContent = [
            headers.join(','),
            ...this.cars.map(car => [
                `"${car.name}"`,
                `"${car.brand}"`,
                `"${car.series}"`,
                `"${car.year}"`,
                `"${car.color}"`,
                `"${car.scale}"`,
                `"${car.condition}"`,
                car.purchasePrice,
                car.purchaseDate,
                `"${car.description.replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotwheels-collection-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    exportToJSON() {
        const data = {
            cars: this.cars,
            wishlist: this.wishlist,
            statistics: this.getStatistics(),
            exportDate: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotwheels-collection-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Check if Git storage is active
    isGitStorageActive() {
        return this.useGitStorage;
    }

    // Get storage status message
    getStorageStatusMessage() {
        if (this.useGitStorage) {
            return "Cars are permanently saved to your private GitHub repository. All data persists across devices and sessions.";
        } else {
            return "Cars are saved to your browser's local storage and will persist while using this site. For permanent backup, download the generated data files from the Settings tab.";
        }
    }

    // Force reload data from Git repository (for debugging)
    async forceReloadFromGit() {
        if (this.useGitStorage && window.gitStorage?.isConfigured) {
            try {
                console.log('Force reloading data from Git repository...');
                this.cars = await window.gitStorage.loadCars();
                this.wishlist = await window.gitStorage.loadWishlist();
                console.log('Data reloaded from Git - Cars:', this.cars.length, 'Wishlist:', this.wishlist.length);
                return true;
            } catch (error) {
                console.error('Failed to reload from Git:', error);
                return false;
            }
        } else {
            console.log('Git storage not active, cannot reload from Git');
            return false;
        }
    }
}

// Initialize data manager
window.dataManager = new DataManager();
