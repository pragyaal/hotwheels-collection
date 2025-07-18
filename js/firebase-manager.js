// Firebase Manager for Hot Wheels Collection
class FirebaseManager {
    constructor() {
        this.db = null;
        this.auth = null;
        this.storage = null;
        this.currentUser = null;
        this.initialized = false;
        this.config = null;
    }

    // Initialize Firebase with config
    async init(config) {
        try {
            this.config = config;
            
            // Initialize Firebase
            if (!firebase.apps.length) {
                firebase.initializeApp(config);
            }
            
            this.db = firebase.firestore();
            this.auth = firebase.auth();
            this.storage = firebase.storage();
            
            // Set up auth state listener
            this.auth.onAuthStateChanged((user) => {
                this.currentUser = user;
                if (user) {
                    console.log('User authenticated:', user.uid);
                    this.onUserAuthenticated();
                } else {
                    console.log('User signed out');
                    this.onUserSignedOut();
                }
            });
            
            this.initialized = true;
            console.log('Firebase initialized successfully');
            return true;
        } catch (error) {
            console.error('Firebase initialization error:', error);
            return false;
        }
    }

    // Authentication Methods
    async signInAnonymously() {
        try {
            const result = await this.auth.signInAnonymously();
            console.log('Anonymous sign-in successful:', result.user.uid);
            return result.user;
        } catch (error) {
            console.error('Anonymous sign-in error:', error);
            throw error;
        }
    }

    async signInWithPassword(password) {
        try {
            // For simplicity, we'll use a fixed email with the password
            const email = 'admin@hotwheels.local';
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            console.log('Password sign-in successful:', result.user.uid);
            return result.user;
        } catch (error) {
            if (error.code === 'auth/user-not-found') {
                // Create user if doesn't exist
                console.log('Creating new admin user...');
                return await this.createAdminUser(password);
            }
            console.error('Sign-in error:', error);
            throw error;
        }
    }

    async createAdminUser(password) {
        try {
            const email = 'admin@hotwheels.local';
            const result = await this.auth.createUserWithEmailAndPassword(email, password);
            console.log('Admin user created:', result.user.uid);
            
            // Set up initial user profile
            await this.setupUserProfile(result.user.uid);
            return result.user;
        } catch (error) {
            console.error('Admin user creation error:', error);
            throw error;
        }
    }

    async setupUserProfile(userId) {
        const userProfile = {
            createdAt: firebase.firestore.Timestamp.now(),
            settings: {
                currency: 'INR',
                siteName: 'Hot Wheels Collection',
                theme: 'default',
                setupRequired: false
            },
            isAdmin: true
        };
        
        await this.db.collection('users').doc(userId).set(userProfile);
        console.log('User profile created for:', userId);
    }

    async signOut() {
        try {
            await this.auth.signOut();
            console.log('User signed out successfully');
        } catch (error) {
            console.error('Sign-out error:', error);
            throw error;
        }
    }

    // Cars Management
    async addCar(carData) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const carRef = this.db.collection('users').doc(this.currentUser.uid).collection('cars').doc();
        const car = {
            ...carData,
            id: carRef.id,
            createdAt: firebase.firestore.Timestamp.now(),
            updatedAt: firebase.firestore.Timestamp.now()
        };
        
        await carRef.set(car);
        console.log('Car added to Firebase:', car.id);
        return car;
    }

    async updateCar(carId, updates) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const carRef = this.db.collection('users').doc(this.currentUser.uid).collection('cars').doc(carId);
        const updateData = {
            ...updates,
            updatedAt: firebase.firestore.Timestamp.now()
        };
        
        await carRef.update(updateData);
        console.log('Car updated in Firebase:', carId);
        return updateData;
    }

    async deleteCar(carId) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const carRef = this.db.collection('users').doc(this.currentUser.uid).collection('cars').doc(carId);
        await carRef.delete();
        
        // Also delete associated image if exists
        await this.deleteCarImages(carId);
        console.log('Car deleted from Firebase:', carId);
    }

    async getCars() {
        if (!this.currentUser) return [];
        
        const snapshot = await this.db.collection('users').doc(this.currentUser.uid).collection('cars')
            .orderBy('createdAt', 'desc')
            .get();
        
        const cars = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                // Convert Firestore timestamps to ISO strings
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
            };
        });
        
        console.log(`Loaded ${cars.length} cars from Firebase`);
        return cars;
    }

    async getCar(carId) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const doc = await this.db.collection('users').doc(this.currentUser.uid).collection('cars').doc(carId).get();
        if (!doc.exists) return null;
        
        const data = doc.data();
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
            updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
        };
    }

    // Wishlist Management
    async addToWishlist(itemData) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const itemRef = this.db.collection('users').doc(this.currentUser.uid).collection('wishlist').doc();
        const item = {
            ...itemData,
            id: itemRef.id,
            createdAt: firebase.firestore.Timestamp.now()
        };
        
        await itemRef.set(item);
        console.log('Item added to wishlist:', item.id);
        return item;
    }

    async getWishlist() {
        if (!this.currentUser) return [];
        
        const snapshot = await this.db.collection('users').doc(this.currentUser.uid).collection('wishlist')
            .orderBy('createdAt', 'desc')
            .get();
        
        const wishlist = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
            };
        });
        
        console.log(`Loaded ${wishlist.length} wishlist items from Firebase`);
        return wishlist;
    }

    async updateWishlistItem(itemId, updates) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const itemRef = this.db.collection('users').doc(this.currentUser.uid).collection('wishlist').doc(itemId);
        await itemRef.update(updates);
        console.log('Wishlist item updated:', itemId);
    }

    async removeFromWishlist(itemId) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        await this.db.collection('users').doc(this.currentUser.uid).collection('wishlist').doc(itemId).delete();
        console.log('Item removed from wishlist:', itemId);
    }

    // Image Storage
    async uploadCarImage(carId, file) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const fileName = `cars/${this.currentUser.uid}/${carId}_${Date.now()}.${file.name.split('.').pop()}`;
        const storageRef = this.storage.ref(fileName);
        
        // Upload file
        const uploadTask = await storageRef.put(file);
        const downloadURL = await uploadTask.ref.getDownloadURL();
        
        console.log('Image uploaded to Firebase Storage:', fileName);
        return downloadURL;
    }

    async deleteCarImages(carId) {
        if (!this.currentUser) return;
        
        try {
            // List all images for this car
            const listRef = this.storage.ref(`cars/${this.currentUser.uid}`);
            const list = await listRef.listAll();
            
            const deletePromises = list.items
                .filter(item => item.name.startsWith(carId))
                .map(item => item.delete());
                
            await Promise.all(deletePromises);
            console.log('Car images deleted from storage for car:', carId);
        } catch (error) {
            console.warn('Error deleting car images:', error);
        }
    }

    // Settings Management
    async getUserSettings() {
        if (!this.currentUser) return {};
        
        const doc = await this.db.collection('users').doc(this.currentUser.uid).get();
        const data = doc.exists ? doc.data() : {};
        return data.settings || {};
    }

    async updateUserSettings(settings) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        await this.db.collection('users').doc(this.currentUser.uid).update({
            'settings': settings,
            updatedAt: firebase.firestore.Timestamp.now()
        });
        console.log('User settings updated');
    }

    // Real-time listeners
    onCarsChanged(callback) {
        if (!this.currentUser) return () => {};
        
        return this.db.collection('users').doc(this.currentUser.uid).collection('cars')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const cars = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
                        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt
                    };
                });
                callback(cars);
            });
    }

    onWishlistChanged(callback) {
        if (!this.currentUser) return () => {};
        
        return this.db.collection('users').doc(this.currentUser.uid).collection('wishlist')
            .orderBy('createdAt', 'desc')
            .onSnapshot(snapshot => {
                const wishlist = snapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        ...data,
                        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt
                    };
                });
                callback(wishlist);
            });
    }

    // Statistics
    async getCollectionStats() {
        if (!this.currentUser) return {};
        
        const cars = await this.getCars();
        
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

    // Test connection
    async testConnection() {
        try {
            if (!this.initialized) {
                throw new Error('Firebase not initialized');
            }
            
            // Test by reading user data
            if (this.currentUser) {
                await this.db.collection('users').doc(this.currentUser.uid).get();
                console.log('Firebase connection test successful');
                return true;
            } else {
                throw new Error('User not authenticated');
            }
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            throw error;
        }
    }

    // Event handlers
    onUserAuthenticated() {
        // Trigger data refresh
        if (window.dataManager) {
            window.dataManager.onAuthStateChanged(true);
        }
    }

    onUserSignedOut() {
        if (window.dataManager) {
            window.dataManager.onAuthStateChanged(false);
        }
    }

    // Utility methods
    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUserId() {
        return this.currentUser?.uid;
    }

    formatCurrency(amount, currency = 'INR') {
        const symbols = {
            'USD': '$',
            'EUR': '€',
            'GBP': '£',
            'INR': '₹',
            'JPY': '¥'
        };
        
        return `${symbols[currency] || symbols.INR}${amount?.toLocaleString() || 0}`;
    }

    // Export data
    async exportUserData() {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const [cars, wishlist, settings] = await Promise.all([
            this.getCars(),
            this.getWishlist(),
            this.getUserSettings()
        ]);
        
        return {
            cars,
            wishlist,
            settings,
            exportedAt: new Date().toISOString(),
            userId: this.currentUser.uid
        };
    }

    // Import data
    async importUserData(data) {
        if (!this.currentUser) throw new Error('User not authenticated');
        
        const batch = this.db.batch();
        
        // Import cars
        if (data.cars && Array.isArray(data.cars)) {
            data.cars.forEach(car => {
                const carRef = this.db.collection('users').doc(this.currentUser.uid).collection('cars').doc();
                batch.set(carRef, {
                    ...car,
                    id: carRef.id,
                    importedAt: firebase.firestore.Timestamp.now()
                });
            });
        }
        
        // Import wishlist
        if (data.wishlist && Array.isArray(data.wishlist)) {
            data.wishlist.forEach(item => {
                const itemRef = this.db.collection('users').doc(this.currentUser.uid).collection('wishlist').doc();
                batch.set(itemRef, {
                    ...item,
                    id: itemRef.id,
                    importedAt: firebase.firestore.Timestamp.now()
                });
            });
        }
        
        await batch.commit();
        console.log('Data import completed');
    }
}

// Initialize global Firebase manager
window.firebaseManager = new FirebaseManager();
