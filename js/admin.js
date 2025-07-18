// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentTab = 'addCar';
        this.editingCarId = null;
        this.init();
    }

    async init() {
        // Wait for data manager to load
        while (!window.dataManager) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.setupEventListeners();
        this.checkAuthStatus();
    }

    setupEventListeners() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleLogin();
            });
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.handleLogout();
            });
        }

        // Tab navigation
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tabName = e.target.closest('.tab-btn').dataset.tab;
                this.switchTab(tabName);
            });
        });

        // Add car form
        const addCarForm = document.getElementById('addCarForm');
        if (addCarForm) {
            addCarForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddCar();
            });
        }

        // Image upload preview
        const carImage = document.getElementById('carImage');
        if (carImage) {
            carImage.addEventListener('change', (e) => {
                this.previewImage(e.target.files[0]);
            });
        }

        // Add wishlist form
        const addWishlistForm = document.getElementById('addWishlistForm');
        if (addWishlistForm) {
            addWishlistForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleAddWishlist();
            });
        }

        // Settings form
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSaveSettings();
            });
        }

        // Search functionality
        const manageSearch = document.getElementById('manageSearch');
        if (manageSearch) {
            manageSearch.addEventListener('input', (e) => {
                this.filterManageCars(e.target.value);
            });
        }

        // Data management
        const exportData = document.getElementById('exportData');
        const importData = document.getElementById('importData');
        const importFile = document.getElementById('importFile');

        if (exportData) {
            exportData.addEventListener('click', () => {
                this.exportAllData();
            });
        }

        if (importData) {
            importData.addEventListener('click', () => {
                importFile.click();
            });
        }

        if (importFile) {
            importFile.addEventListener('change', (e) => {
                this.importData(e.target.files[0]);
            });
        }

        // Modal functionality
        const modal = document.getElementById('messageModal');
        const closeModal = modal?.querySelector('.close');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        if (modal) {
            window.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.style.display = 'none';
                }
            });
        }

        // Mobile navigation
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }
    }

    checkAuthStatus() {
        const isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
        
        if (isAuthenticated) {
            this.showAdminPanel();
        } else {
            this.showLoginForm();
        }
    }

    handleLogin() {
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        // Check if setup is required (no password set)
        if (window.dataManager.config.setupRequired && !window.dataManager.config.adminPassword) {
            // First time setup - any password will work, then gets encrypted
            if (password.length < 6) {
                errorDiv.textContent = 'Please enter a password with at least 6 characters for initial setup.';
                errorDiv.style.display = 'block';
                return;
            }
            
            // Set the new password
            window.dataManager.config.adminPassword = window.dataManager.encrypt(password);
            window.dataManager.config.setupRequired = false;
            window.dataManager.saveConfig();
            
            sessionStorage.setItem('adminAuth', 'true');
            this.showAdminPanel();
            this.showMessage('Welcome! Your admin password has been set up successfully.', 'success');
            errorDiv.style.display = 'none';
            return;
        }
        
        // Normal login process
        if (window.dataManager.validatePassword(password)) {
            sessionStorage.setItem('adminAuth', 'true');
            this.showAdminPanel();
            errorDiv.style.display = 'none';
        } else {
            errorDiv.textContent = 'Invalid password. Please try again.';
            errorDiv.style.display = 'block';
            document.getElementById('password').value = '';
        }
    }

    handleLogout() {
        sessionStorage.removeItem('adminAuth');
        this.showLoginForm();
    }

    showLoginForm() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        
        // Check if this is first-time setup
        const loginDescription = document.getElementById('loginDescription');
        if (window.dataManager.config.setupRequired && !window.dataManager.config.adminPassword) {
            if (loginDescription) {
                loginDescription.textContent = 'First time setup: Create your admin password (minimum 6 characters)';
                loginDescription.style.color = '#667eea';
            }
        } else {
            if (loginDescription) {
                loginDescription.textContent = 'Enter password to access admin panel';
                loginDescription.style.color = '';
            }
        }
    }

    showAdminPanel() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        this.loadSettings();
        this.loadManageCars();
        this.loadWishlistItems();
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.getElementById(tabName).classList.add('active');

        this.currentTab = tabName;

        // Load content for specific tabs
        if (tabName === 'manageCars') {
            this.loadManageCars();
        } else if (tabName === 'manageWishlist') {
            this.loadWishlistItems();
        }
    }

    previewImage(file) {
        const preview = document.getElementById('imagePreview');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.innerHTML = `<img src="${e.target.result}" alt="Preview">`;
            };
            reader.readAsDataURL(file);
        } else {
            preview.innerHTML = '';
        }
    }

    async handleAddCar() {
        const formData = this.getCarFormData();
        
        if (!formData.name || !formData.brand) {
            this.showMessage('Please fill in required fields (Name and Brand)', 'error');
            return;
        }

        // Handle image
        const imageFile = document.getElementById('carImage').files[0];
        if (imageFile) {
            formData.image = await this.processImage(imageFile, formData.name);
        } else {
            formData.image = 'images/placeholder-car.svg';
        }

        try {
            if (this.editingCarId) {
                window.dataManager.updateCar(this.editingCarId, formData);
                this.showMessage('Car updated successfully!', 'success');
                this.editingCarId = null;
            } else {
                window.dataManager.addCar(formData);
                this.showMessage('Car added successfully!', 'success');
            }
            
            this.resetCarForm();
            this.loadManageCars();
        } catch (error) {
            this.showMessage('Error saving car: ' + error.message, 'error');
        }
    }

    getCarFormData() {
        return {
            name: document.getElementById('carName').value.trim(),
            brand: document.getElementById('carBrand').value.trim(),
            series: document.getElementById('carSeries').value.trim(),
            year: document.getElementById('carYear').value.trim(),
            color: document.getElementById('carColor').value.trim(),
            scale: document.getElementById('carScale').value,
            condition: document.getElementById('carCondition').value,
            purchasePrice: parseFloat(document.getElementById('carPrice').value) || 0,
            purchaseDate: document.getElementById('carPurchaseDate').value,
            description: document.getElementById('carDescription').value.trim()
        };
    }

    async processImage(file, carName) {
        // In a real implementation, this would upload to a server
        // For now, we'll create a local URL and suggest manual file management
        const timestamp = new Date().getTime();
        const fileName = `${carName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${file.name.split('.').pop()}`;
        
        // Create a blob URL for immediate use
        const blobUrl = URL.createObjectURL(file);
        
        // Store the file info for manual handling
        if (!window.pendingImages) {
            window.pendingImages = [];
        }
        
        window.pendingImages.push({
            fileName: fileName,
            file: file,
            suggestedPath: `images/cars/${fileName}`
        });

        this.showMessage(`Image processed. Please save the file as: images/cars/${fileName}`, 'info');
        
        return `images/cars/${fileName}`;
    }

    resetCarForm() {
        document.getElementById('addCarForm').reset();
        document.getElementById('imagePreview').innerHTML = '';
        
        // Reset form title if editing
        const formTitle = document.querySelector('#addCar h2');
        if (formTitle) {
            formTitle.textContent = 'Add New Car';
        }
        
        const submitBtn = document.querySelector('#addCarForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Car';
        }
    }

    loadManageCars() {
        const container = document.getElementById('manageCarsList');
        if (!container) return;

        const cars = window.dataManager.getCars();
        
        if (cars.length === 0) {
            container.innerHTML = '<p>No cars in collection yet.</p>';
            return;
        }

        container.innerHTML = cars.map(car => `
            <div class="manage-item" data-car-id="${car.id}">
                <img src="${car.image}" alt="${car.name}" class="manage-item-image" 
                     onerror="this.src='images/placeholder-car.svg'">
                <div class="manage-item-info">
                    <div class="manage-item-name">${car.name}</div>
                    <div class="manage-item-details">
                        ${car.brand} • ${car.series} • ${car.color} • $${parseFloat(car.purchasePrice).toFixed(2)}
                    </div>
                </div>
                <div class="manage-item-actions">
                    <button class="btn btn-primary btn-small" onclick="adminPanel.editCar(${car.id})">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn btn-danger btn-small" onclick="adminPanel.deleteCar(${car.id})">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `).join('');
    }

    filterManageCars(query) {
        const items = document.querySelectorAll('.manage-item');
        const searchTerm = query.toLowerCase();

        items.forEach(item => {
            const text = item.textContent.toLowerCase();
            item.style.display = text.includes(searchTerm) ? 'flex' : 'none';
        });
    }

    editCar(carId) {
        const car = window.dataManager.getCarById(carId);
        if (!car) return;

        // Switch to add car tab
        this.switchTab('addCar');

        // Populate form
        document.getElementById('carName').value = car.name;
        document.getElementById('carBrand').value = car.brand;
        document.getElementById('carSeries').value = car.series || '';
        document.getElementById('carYear').value = car.year || '';
        document.getElementById('carColor').value = car.color || '';
        document.getElementById('carScale').value = car.scale || '1:64';
        document.getElementById('carCondition').value = car.condition || 'Mint';
        document.getElementById('carPrice').value = car.purchasePrice || '';
        document.getElementById('carPurchaseDate').value = car.purchaseDate || '';
        document.getElementById('carDescription').value = car.description || '';

        // Show image preview if exists
        if (car.image && car.image !== 'images/placeholder-car.svg') {
            document.getElementById('imagePreview').innerHTML = `<img src="${car.image}" alt="Current image">`;
        }

        // Update form appearance
        const formTitle = document.querySelector('#addCar h2');
        if (formTitle) {
            formTitle.textContent = 'Edit Car';
        }
        
        const submitBtn = document.querySelector('#addCarForm button[type="submit"]');
        if (submitBtn) {
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Car';
        }

        this.editingCarId = carId;
    }

    deleteCar(carId) {
        const car = window.dataManager.getCarById(carId);
        if (!car) return;

        if (confirm(`Are you sure you want to delete "${car.name}"? This action cannot be undone.`)) {
            window.dataManager.deleteCar(carId);
            this.showMessage('Car deleted successfully!', 'success');
            this.loadManageCars();
        }
    }

    handleAddWishlist() {
        const formData = {
            name: document.getElementById('wishlistName').value.trim(),
            brand: document.getElementById('wishlistBrand').value.trim(),
            series: document.getElementById('wishlistSeries').value.trim(),
            expectedPrice: parseFloat(document.getElementById('wishlistPrice').value) || 0,
            notes: document.getElementById('wishlistNotes').value.trim()
        };

        if (!formData.name) {
            this.showMessage('Please enter a car name', 'error');
            return;
        }

        try {
            window.dataManager.addToWishlist(formData);
            this.showMessage('Item added to wishlist!', 'success');
            document.getElementById('addWishlistForm').reset();
            this.loadWishlistItems();
        } catch (error) {
            this.showMessage('Error adding to wishlist: ' + error.message, 'error');
        }
    }

    loadWishlistItems() {
        const container = document.getElementById('wishlistItems');
        if (!container) return;

        const wishlist = window.dataManager.getWishlist();
        
        if (wishlist.length === 0) {
            container.innerHTML = '<p>No items in wishlist yet.</p>';
            return;
        }

        container.innerHTML = wishlist.map(item => `
            <div class="wishlist-item">
                <div class="wishlist-item-header">
                    <div class="wishlist-item-name">${item.name}</div>
                    <button class="btn btn-danger btn-small" onclick="adminPanel.removeFromWishlist(${item.id})">
                        <i class="fas fa-trash"></i> Remove
                    </button>
                </div>
                <div class="wishlist-item-details">
                    ${item.brand ? `
                        <div class="wishlist-detail">
                            <span class="wishlist-detail-label">Brand:</span>
                            <span class="wishlist-detail-value">${item.brand}</span>
                        </div>
                    ` : ''}
                    ${item.series ? `
                        <div class="wishlist-detail">
                            <span class="wishlist-detail-label">Series:</span>
                            <span class="wishlist-detail-value">${item.series}</span>
                        </div>
                    ` : ''}
                    ${item.expectedPrice ? `
                        <div class="wishlist-detail">
                            <span class="wishlist-detail-label">Expected Price:</span>
                            <span class="wishlist-detail-value">$${item.expectedPrice.toFixed(2)}</span>
                        </div>
                    ` : ''}
                    <div class="wishlist-detail">
                        <span class="wishlist-detail-label">Added:</span>
                        <span class="wishlist-detail-value">${new Date(item.dateAdded).toLocaleDateString()}</span>
                    </div>
                </div>
                ${item.notes ? `
                    <div class="wishlist-notes">
                        <strong>Notes:</strong> ${item.notes}
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    removeFromWishlist(itemId) {
        if (confirm('Are you sure you want to remove this item from your wishlist?')) {
            window.dataManager.removeFromWishlist(itemId);
            this.showMessage('Item removed from wishlist!', 'success');
            this.loadWishlistItems();
        }
    }

    loadSettings() {
        const config = window.dataManager.config;
        
        document.getElementById('siteName').value = config.siteName || 'Hot Wheels Collection';
        document.getElementById('currency').value = config.currency || 'USD';
    }

    handleSaveSettings() {
        const newConfig = {
            ...window.dataManager.config,
            siteName: document.getElementById('siteName').value.trim(),
            currency: document.getElementById('currency').value
        };

        const newPassword = document.getElementById('newPassword').value;
        if (newPassword) {
            newConfig.adminPassword = window.dataManager.encrypt(newPassword);
            document.getElementById('newPassword').value = '';
        }

        window.dataManager.config = newConfig;
        window.dataManager.saveConfig();
        
        this.showMessage('Settings saved successfully!', 'success');
    }

    exportAllData() {
        const data = {
            cars: window.dataManager.getCars(),
            wishlist: window.dataManager.getWishlist(),
            config: window.dataManager.config,
            statistics: window.dataManager.getStatistics(),
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `hotwheels-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showMessage('Data exported successfully!', 'success');
    }

    importData(file) {
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                
                if (confirm('This will replace all current data. Are you sure you want to continue?')) {
                    if (data.cars) {
                        window.dataManager.cars = data.cars;
                        window.dataManager.saveCars();
                    }
                    
                    if (data.wishlist) {
                        window.dataManager.wishlist = data.wishlist;
                        window.dataManager.saveWishlist();
                    }
                    
                    if (data.config) {
                        window.dataManager.config = data.config;
                        window.dataManager.saveConfig();
                    }

                    this.showMessage('Data imported successfully! Refreshing page...', 'success');
                    setTimeout(() => {
                        location.reload();
                    }, 2000);
                }
            } catch (error) {
                this.showMessage('Error importing data: Invalid file format', 'error');
            }
        };
        reader.readAsText(file);
    }

    showMessage(message, type = 'info') {
        const modal = document.getElementById('messageModal');
        const content = document.getElementById('messageContent');
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            info: 'fas fa-info-circle'
        };

        const colors = {
            success: '#4caf50',
            error: '#f44336',
            info: '#2196f3'
        };

        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <i class="${icons[type]}" style="font-size: 3rem; color: ${colors[type]}; margin-bottom: 1rem;"></i>
                <p style="font-size: 1.1rem; margin: 0;">${message}</p>
            </div>
        `;

        modal.style.display = 'block';

        // Auto-close success messages
        if (type === 'success') {
            setTimeout(() => {
                modal.style.display = 'none';
            }, 3000);
        }
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
