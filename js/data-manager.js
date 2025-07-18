// Data Manager for Hot Wheels Collection - Firebase Version
class DataManager {
    constructor() {
        this.cars = [];
        this.wishlist = [];
        this.config = {};
        this.useFirebase = false;
        this.initialized = false;
        this.authListeners = [];
        
        // Initialize asynchronously
        this.initPromise = this.init();
    }

    async init() {
        console.log('DataManager initializing...');
        
        // Try to initialize Firebase
        await this.initializeFirebase();
        
        if (this.useFirebase) {
            console.log('Using Firebase for data persistence');
            // Wait for authentication state
            await this.waitForAuth();
        } else {
            console.log('Using localStorage fallback');
            await this.loadConfig();
            await this.loadLocalData();
        }
        
        this.initialized = true;
        console.log('DataManager initialization complete');
    }

    async initializeFirebase() {
        try {
            // Load Firebase config
            const config = await this.loadFirebaseConfig();
            if (config && window.firebaseManager) {
                const initialized = await window.firebaseManager.init(config);
                if (initialized) {
                    this.useFirebase = true;
                    console.log('Firebase initialized successfully');
                }
            }
        } catch (error) {
            console.log('Firebase initialization failed, using localStorage:', error.message);
        }
    }

    async loadFirebaseConfig() {
        try {
            // Check localStorage first
            const stored = localStorage.getItem('firebase_config');
            if (stored) {
                return JSON.parse(stored);
            }
            
            // Try to load from file
            const response = await fetch('data/firebase-config.json');
            if (response.ok) {
                const config = await response.json();
                // Store in localStorage for future use
                localStorage.setItem('firebase_config', JSON.stringify(config));
                return config;
            }
            
            return null;
        } catch (error) {
            console.log('Firebase config not found');
            return null;
        }
    }

    async waitForAuth() {
        return new Promise((resolve) => {
            if (window.firebaseManager?.isAuthenticated()) {
                this.loadFirebaseData();
                resolve();
            } else {
                // Wait for auth state change
                const unsubscribe = window.firebaseManager?.auth?.onAuthStateChanged((user) => {
                    if (user) {
                        this.loadFirebaseData();
                        unsubscribe?.();
                        resolve();
                    }
                });
                
                // If no auth after 2 seconds, continue without auth
                setTimeout(() => {
                    unsubscribe?.();
                    resolve();
                }, 2000);
            }
        });
    }

    async loadFirebaseData() {
        try {
            const [config, cars, wishlist] = await Promise.all([
                window.firebaseManager.getUserSettings(),
                window.firebaseManager.getCars(),
                window.firebaseManager.getWishlist()
            ]);
            
            this.config = {
                siteName: config.siteName || 'Hot Wheels Collection',
                currency: config.currency || 'INR',
                setupRequired: config.setupRequired || false
            };
            this.cars = cars;
            this.wishlist = wishlist;
            
            console.log(`Loaded from Firebase - Cars: ${cars.length}, Wishlist: ${wishlist.length}`);
        } catch (error) {
            console.error('Error loading Firebase data:', error);
        }
    }

    async loadLocalData() {
        try {
            // Load from localStorage
            const carsData = localStorage.getItem('cars_data');
            const wishlistData = localStorage.getItem('wishlist_data');
            
            if (carsData) {
                const parsed = JSON.parse(carsData);
                this.cars = parsed.cars || [];
            }
            
            if (wishlistData) {
                const parsed = JSON.parse(wishlistData);
                this.wishlist = parsed.wishlist || [];
            }
            
            console.log(`Loaded from localStorage - Cars: ${this.cars.length}, Wishlist: ${this.wishlist.length}`);
        } catch (error) {
            console.error('Error loading local data:', error);
            this.cars = [];
            this.wishlist = [];
        }
    }

    // Authentication methods
    async authenticate(password) {
        if (this.useFirebase && window.firebaseManager) {
            try {
                const user = await window.firebaseManager.signInWithPassword(password);
                await this.loadFirebaseData();
                this.notifyAuthListeners(true);
                return true;
            } catch (error) {
                console.error('Firebase authentication failed:', error);
                return false;
            }
        } else {
            // Fallback to local authentication
            const hashedPassword = this.encrypt(password);
            const isValid = this.config.adminPassword === hashedPassword;
            if (isValid) {
                localStorage.setItem('admin_authenticated', 'true');
                this.notifyAuthListeners(true);
            }
            return isValid;
        }
    }

    async signOut() {
        if (this.useFirebase && window.firebaseManager) {
            await window.firebaseManager.signOut();
        }
        localStorage.removeItem('admin_authenticated');
        this.notifyAuthListeners(false);
    }

    isAuthenticated() {
        if (this.useFirebase && window.firebaseManager) {
            return window.firebaseManager.isAuthenticated();
        }
        return localStorage.getItem('admin_authenticated') === 'true';
    }

    onAuthStateChanged(callback) {
        this.authListeners.push(callback);
        return () => {
            this.authListeners = this.authListeners.filter(cb => cb !== callback);
        };
    }

    notifyAuthListeners(isAuthenticated) {
        this.authListeners.forEach(callback => callback(isAuthenticated));
    }

    // Configuration management
    async loadConfig() {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                const settings = await window.firebaseManager.getUserSettings();
                this.config = {
                    siteName: settings.siteName || 'Hot Wheels Collection',
                    currency: settings.currency || 'INR',
                    setupRequired: settings.setupRequired || false
                };
            } else {
                // Load from localStorage or file
                const stored = localStorage.getItem('app_config');
                if (stored) {
                    this.config = JSON.parse(stored);
                } else {
                    // Try to load from file
                    try {
                        const response = await fetch('data/config.json');
                        if (response.ok) {
                            this.config = await response.json();
                        }
                    } catch (error) {
                        console.log('Config file not found, using defaults');
                    }
                    
                    // Set defaults if not found
                    this.config = {
                        siteName: 'Hot Wheels Collection',
                        currency: 'INR',
                        adminPassword: '',
                        setupRequired: true,
                        ...this.config
                    };
                }
            }
        } catch (error) {
            console.error('Error loading config:', error);
            this.config = {
                siteName: 'Hot Wheels Collection',
                currency: 'INR',
                adminPassword: '',
                setupRequired: true
            };
        }
    }

    async saveConfig(updates) {
        try {
            this.config = { ...this.config, ...updates };
            
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                const settings = {
                    siteName: this.config.siteName,
                    currency: this.config.currency,
                    setupRequired: this.config.setupRequired || false
                };
                await window.firebaseManager.updateUserSettings(settings);
            } else {
                // Save to localStorage
                localStorage.setItem('app_config', JSON.stringify(this.config));
            }
            
            console.log('Config saved successfully');
            return true;
        } catch (error) {
            console.error('Error saving config:', error);
            return false;
        }
    }

    // Car management
    getCars() {
        return this.cars;
    }

    async addCar(carData) {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                const newCar = await window.firebaseManager.addCar(carData);
                this.cars.unshift(newCar); // Add to beginning of array
                console.log('Car added via Firebase:', newCar.id);
                return newCar;
            } else {
                // Fallback to localStorage
                const newCar = {
                    ...carData,
                    id: this.generateId(),
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                };
                this.cars.unshift(newCar);
                await this.saveLocalCars();
                console.log('Car added to localStorage:', newCar.id);
                return newCar;
            }
        } catch (error) {
            console.error('Error adding car:', error);
            throw error;
        }
    }

    async updateCar(carId, updates) {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                await window.firebaseManager.updateCar(carId, updates);
                // Update local cache
                const carIndex = this.cars.findIndex(car => car.id === carId);
                if (carIndex !== -1) {
                    this.cars[carIndex] = { ...this.cars[carIndex], ...updates };
                }
                console.log('Car updated via Firebase:', carId);
                return true;
            } else {
                // Fallback to localStorage
                const carIndex = this.cars.findIndex(car => car.id === carId);
                if (carIndex !== -1) {
                    this.cars[carIndex] = { 
                        ...this.cars[carIndex], 
                        ...updates,
                        updatedAt: new Date().toISOString()
                    };
                    await this.saveLocalCars();
                    console.log('Car updated in localStorage:', carId);
                    return true;
                }
                return false;
            }
        } catch (error) {
            console.error('Error updating car:', error);
            return false;
        }
    }

    async deleteCar(carId) {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                await window.firebaseManager.deleteCar(carId);
                // Remove from local cache
                this.cars = this.cars.filter(car => car.id !== carId);
                console.log('Car deleted via Firebase:', carId);
                return true;
            } else {
                // Fallback to localStorage
                const originalLength = this.cars.length;
                this.cars = this.cars.filter(car => car.id !== carId);
                if (this.cars.length < originalLength) {
                    await this.saveLocalCars();
                    console.log('Car deleted from localStorage:', carId);
                    return true;
                }
                return false;
            }
        } catch (error) {
            console.error('Error deleting car:', error);
            return false;
        }
    }

    async saveLocalCars() {
        const data = {
            cars: this.cars,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('cars_data', JSON.stringify(data));
    }

    // Wishlist management
    getWishlist() {
        return this.wishlist;
    }

    async addToWishlist(itemData) {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                const newItem = await window.firebaseManager.addToWishlist(itemData);
                this.wishlist.unshift(newItem);
                console.log('Item added to Firebase wishlist:', newItem.id);
                return newItem;
            } else {
                // Fallback to localStorage
                const newItem = {
                    ...itemData,
                    id: this.generateId(),
                    createdAt: new Date().toISOString()
                };
                this.wishlist.unshift(newItem);
                await this.saveLocalWishlist();
                console.log('Item added to localStorage wishlist:', newItem.id);
                return newItem;
            }
        } catch (error) {
            console.error('Error adding to wishlist:', error);
            throw error;
        }
    }

    async updateWishlistItem(itemId, updates) {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                await window.firebaseManager.updateWishlistItem(itemId, updates);
                // Update local cache
                const itemIndex = this.wishlist.findIndex(item => item.id === itemId);
                if (itemIndex !== -1) {
                    this.wishlist[itemIndex] = { ...this.wishlist[itemIndex], ...updates };
                }
                console.log('Wishlist item updated via Firebase:', itemId);
                return true;
            } else {
                // Fallback to localStorage
                const itemIndex = this.wishlist.findIndex(item => item.id === itemId);
                if (itemIndex !== -1) {
                    this.wishlist[itemIndex] = { ...this.wishlist[itemIndex], ...updates };
                    await this.saveLocalWishlist();
                    console.log('Wishlist item updated in localStorage:', itemId);
                    return true;
                }
                return false;
            }
        } catch (error) {
            console.error('Error updating wishlist item:', error);
            return false;
        }
    }

    async removeFromWishlist(itemId) {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                await window.firebaseManager.removeFromWishlist(itemId);
                // Remove from local cache
                this.wishlist = this.wishlist.filter(item => item.id !== itemId);
                console.log('Item removed from Firebase wishlist:', itemId);
                return true;
            } else {
                // Fallback to localStorage
                const originalLength = this.wishlist.length;
                this.wishlist = this.wishlist.filter(item => item.id !== itemId);
                if (this.wishlist.length < originalLength) {
                    await this.saveLocalWishlist();
                    console.log('Item removed from localStorage wishlist:', itemId);
                    return true;
                }
                return false;
            }
        } catch (error) {
            console.error('Error removing from wishlist:', error);
            return false;
        }
    }

    async saveLocalWishlist() {
        const data = {
            wishlist: this.wishlist,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('wishlist_data', JSON.stringify(data));
    }

    // Image upload
    async uploadCarImage(carId, file) {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                const downloadURL = await window.firebaseManager.uploadCarImage(carId, file);
                console.log('Image uploaded to Firebase Storage:', downloadURL);
                return downloadURL;
            } else {
                // For localStorage fallback, we'll use base64 encoding
                const base64 = await this.fileToBase64(file);
                console.log('Image converted to base64 for localStorage');
                return base64;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            throw error;
        }
    }

    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Statistics
    async getCollectionStats() {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                return await window.firebaseManager.getCollectionStats();
            } else {
                // Calculate stats from local data
                const cars = this.cars;
                
                const stats = {
                    totalCars: cars.length,
                    totalValue: cars.reduce((sum, car) => sum + (car.purchasePrice || 0), 0),
                    byBrand: {},
                    bySeries: {},
                    byCondition: {},
                    byYear: {},
                    recentAdditions: cars.slice(0, 10)
                };
                
                cars.forEach(car => {
                    stats.byBrand[car.brand] = (stats.byBrand[car.brand] || 0) + 1;
                    stats.bySeries[car.series] = (stats.bySeries[car.series] || 0) + 1;
                    stats.byCondition[car.condition] = (stats.byCondition[car.condition] || 0) + 1;
                    stats.byYear[car.year] = (stats.byYear[car.year] || 0) + 1;
                });
                
                return stats;
            }
        } catch (error) {
            console.error('Error getting collection stats:', error);
            return {};
        }
    }

    // Utility methods
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    encrypt(text) {
        // Simple base64 encoding with character shifting
        return btoa(text.split('').map(char => 
            String.fromCharCode(char.charCodeAt(0) + 5)
        ).join(''));
    }

    decrypt(encrypted) {
        try {
            const decoded = atob(encrypted);
            return decoded.split('').map(char => 
                String.fromCharCode(char.charCodeAt(0) - 5)
            ).join('');
        } catch {
            return '';
        }
    }

    // Export/Import
    async exportData() {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                return await window.firebaseManager.exportUserData();
            } else {
                return {
                    cars: this.cars,
                    wishlist: this.wishlist,
                    config: { ...this.config, adminPassword: undefined }, // Don't export password
                    exportedAt: new Date().toISOString()
                };
            }
        } catch (error) {
            console.error('Error exporting data:', error);
            throw error;
        }
    }

    async importData(data) {
        try {
            if (this.useFirebase && window.firebaseManager?.isAuthenticated()) {
                await window.firebaseManager.importUserData(data);
                // Reload data
                await this.loadFirebaseData();
            } else {
                // Import to localStorage
                if (data.cars) this.cars = data.cars;
                if (data.wishlist) this.wishlist = data.wishlist;
                if (data.config) this.config = { ...this.config, ...data.config };
                
                await Promise.all([
                    this.saveLocalCars(),
                    this.saveLocalWishlist(),
                    this.saveConfig(this.config)
                ]);
            }
            console.log('Data import completed');
        } catch (error) {
            console.error('Error importing data:', error);
            throw error;
        }
    }

    // Setup Firebase configuration
    async setupFirebase(config) {
        try {
            // Save config to localStorage
            localStorage.setItem('firebase_config', JSON.stringify(config));
            
            // Initialize Firebase
            const initialized = await window.firebaseManager.init(config);
            if (initialized) {
                this.useFirebase = true;
                console.log('Firebase setup completed successfully');
                
                // Migrate existing data if any
                if (this.cars.length > 0 || this.wishlist.length > 0) {
                    const migrateData = confirm('Migrate existing data to Firebase?');
                    if (migrateData) {
                        await this.migrateToFirebase();
                    }
                }
                
                return true;
            }
            return false;
        } catch (error) {
            console.error('Firebase setup failed:', error);
            return false;
        }
    }

    async migrateToFirebase() {
        try {
            if (!window.firebaseManager?.isAuthenticated()) {
                throw new Error('Not authenticated');
            }
            
            const data = {
                cars: this.cars,
                wishlist: this.wishlist
            };
            
            await window.firebaseManager.importUserData(data);
            console.log('Data migration to Firebase completed');
        } catch (error) {
            console.error('Data migration failed:', error);
            throw error;
        }
    }

    // Status methods
    getStorageType() {
        return this.useFirebase ? 'Firebase' : 'LocalStorage';
    }

    getStorageStatusMessage() {
        if (this.useFirebase) {
            const isAuth = window.firebaseManager?.isAuthenticated();
            return `Using Firebase${isAuth ? ' (Authenticated)' : ' (Not Authenticated)'}`;
        }
        return 'Using Local Storage (Offline Mode)';
    }
}

// Initialize data manager
window.dataManager = new DataManager();
