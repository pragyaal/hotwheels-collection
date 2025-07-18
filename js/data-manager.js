// Data Manager for Hot Wheels Collection
class DataManager {
    constructor() {
        this.cars = [];
        this.wishlist = [];
        this.config = {};
        this.init();
    }

    async init() {
        await this.loadConfig();
        await this.loadCars();
        await this.loadWishlist();
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
            const response = await fetch('data/config.json');
            if (response.ok) {
                this.config = await response.json();
            } else {
                // Default config if file doesn't exist
                this.config = {
                    adminPassword: this.encrypt('hotwheels123'), // Default password: hotwheels123
                    siteName: 'Hot Wheels Collection',
                    currency: 'USD'
                };
            }
        } catch (error) {
            console.log('Config file not found, using defaults');
            this.config = {
                adminPassword: this.encrypt('hotwheels123'),
                siteName: 'Hot Wheels Collection',
                currency: 'USD'
            };
        }
    }

    // Car data management
    async loadCars() {
        try {
            const response = await fetch('data/cars.json');
            if (response.ok) {
                const data = await response.json();
                this.cars = data.cars || [];
            } else {
                // Initialize with sample data if no file exists
                this.cars = [
                    {
                        id: 1,
                        name: 'Lamborghini Huracán',
                        brand: 'Hot Wheels',
                        series: 'Exotics',
                        year: '2023',
                        color: 'Orange',
                        scale: '1:64',
                        condition: 'Mint',
                        purchasePrice: 1.97,
                        purchaseDate: '2023-06-15',
                        description: 'Beautiful orange Lamborghini from the Exotics series.',
                        image: 'images/cars/lambo-huracan.jpg',
                        dateAdded: new Date().toISOString()
                    },
                    {
                        id: 2,
                        name: 'Porsche 911 GT3',
                        brand: 'Hot Wheels',
                        series: 'Car Culture',
                        year: '2023',
                        color: 'White',
                        scale: '1:64',
                        condition: 'Mint',
                        purchasePrice: 5.99,
                        purchaseDate: '2023-07-20',
                        description: 'White Porsche 911 GT3 from Car Culture series.',
                        image: 'images/cars/porsche-911.jpg',
                        dateAdded: new Date().toISOString()
                    }
                ];
            }
        } catch (error) {
            console.log('Cars data file not found, using sample data');
            this.cars = [];
        }
    }

    async loadWishlist() {
        try {
            const response = await fetch('data/wishlist.json');
            if (response.ok) {
                const data = await response.json();
                this.wishlist = data.wishlist || [];
            } else {
                this.wishlist = [];
            }
        } catch (error) {
            console.log('Wishlist file not found, starting empty');
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
    addCar(carData) {
        const newCar = {
            id: this.getNextId(),
            ...carData,
            dateAdded: new Date().toISOString()
        };
        this.cars.push(newCar);
        this.saveCars();
        return newCar;
    }

    // Update car
    updateCar(id, carData) {
        const index = this.cars.findIndex(car => car.id === parseInt(id));
        if (index !== -1) {
            this.cars[index] = { ...this.cars[index], ...carData };
            this.saveCars();
            return this.cars[index];
        }
        return null;
    }

    // Delete car
    deleteCar(id) {
        const index = this.cars.findIndex(car => car.id === parseInt(id));
        if (index !== -1) {
            this.cars.splice(index, 1);
            this.saveCars();
            return true;
        }
        return false;
    }

    // Wishlist management
    getWishlist() {
        return this.wishlist;
    }

    addToWishlist(item) {
        const newItem = {
            id: this.getNextWishlistId(),
            ...item,
            dateAdded: new Date().toISOString()
        };
        this.wishlist.push(newItem);
        this.saveWishlist();
        return newItem;
    }

    removeFromWishlist(id) {
        const index = this.wishlist.findIndex(item => item.id === parseInt(id));
        if (index !== -1) {
            this.wishlist.splice(index, 1);
            this.saveWishlist();
            return true;
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

    // Data persistence (simulated - in real implementation, this would save to server)
    saveCars() {
        const data = {
            cars: this.cars,
            lastUpdated: new Date().toISOString()
        };
        
        // In a real implementation, this would send data to server
        // For now, we'll store in localStorage as a backup
        localStorage.setItem('hotwheels_cars', JSON.stringify(data));
        
        // Create downloadable JSON file
        this.createDownloadableFile('cars.json', data);
    }

    saveWishlist() {
        const data = {
            wishlist: this.wishlist,
            lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem('hotwheels_wishlist', JSON.stringify(data));
        this.createDownloadableFile('wishlist.json', data);
    }

    saveConfig() {
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
}

// Initialize data manager
window.dataManager = new DataManager();
