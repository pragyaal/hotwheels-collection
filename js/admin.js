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
        this.updateStorageStatusDisplay();
    }

    updateStorageStatusDisplay() {
        const statusElement = document.getElementById('storageStatusText');
        if (statusElement && window.dataManager) {
            statusElement.textContent = window.dataManager.getStorageStatusMessage();
            
            // Update icon based on storage type
            const panel = document.getElementById('storageInfoPanel');
            if (panel) {
                if (window.dataManager.isGitStorageActive()) {
                    panel.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                    panel.querySelector('i').className = 'fas fa-cloud-check';
                } else {
                    panel.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
                    panel.querySelector('i').className = 'fas fa-info-circle';
                }
            }
        }
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
            // First time setup - any password will work, then gets encrypted and stored
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
        
        // Normal login process - validate against stored password
        if (!window.dataManager.config.adminPassword) {
            errorDiv.textContent = 'Admin password not set. Please contact administrator.';
            errorDiv.style.display = 'block';
            document.getElementById('password').value = '';
            return;
        }
        
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
                loginDescription.textContent = 'Enter your admin password to access the panel';
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
                await window.dataManager.updateCar(this.editingCarId, formData);
                this.showMessage('Car updated successfully! Data saved permanently.', 'success');
                this.editingCarId = null;
            } else {
                const newCar = await window.dataManager.addCar(formData);
                console.log('Car added:', newCar);
                
                // Check storage type and show appropriate message
                if (window.dataManager.isGitStorageActive()) {
                    this.showMessage('Car added successfully! Data saved to Git repository.', 'success');
                } else {
                    this.showMessage('Car added successfully! Data saved to browser storage.', 'success');
                }
            }
            
            this.resetCarForm();
            this.loadManageCars();
            
            // Trigger a custom event to notify other pages that data has changed
            window.dispatchEvent(new CustomEvent('dataUpdated', { 
                detail: { type: 'cars' } 
            }));
            
        } catch (error) {
            console.error('Error saving car:', error);
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
        const timestamp = new Date().getTime();
        const fileName = `${carName.replace(/[^a-zA-Z0-9]/g, '_')}_${timestamp}.${file.name.split('.').pop()}`;
        
        // If Git storage is configured, upload image to repository
        if (window.dataManager.isGitStorageActive()) {
            try {
                this.showMessage('Uploading image to repository...', 'info');
                const imagePath = await window.gitStorage.uploadImage(file, fileName);
                this.showMessage('Image uploaded successfully!', 'success');
                return imagePath;
            } catch (error) {
                console.error('Failed to upload image to Git:', error);
                this.showMessage(`Image upload failed: ${error.message}. Using placeholder instead.`, 'error');
                return 'images/placeholder-car.svg';
            }
        } else {
            // Fallback for local storage - create blob URL and store for manual handling
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
                <div class="manage-item-checkbox">
                    <input type="checkbox" class="car-checkbox" value="${car.id}" onchange="adminPanel.updateBulkActions()">
                </div>
                <img src="${this.getImageUrl(car.image)}" alt="${car.name}" class="manage-item-image" 
                     onerror="this.src='images/placeholder-car.svg'">
                <div class="manage-item-info">
                    <div class="manage-item-name">${car.name}</div>
                    <div class="manage-item-details">
                        ${car.brand} • ${car.series} • ${car.color} • ${window.dataManager.formatCurrency(car.purchasePrice)}
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
            document.getElementById('imagePreview').innerHTML = `<img src="${this.getImageUrl(car.image)}" alt="Current image">`;
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

    async deleteCar(carId) {
        const car = window.dataManager.getCarById(carId);
        if (!car) return;

        const confirmMessage = `Are you sure you want to delete this car?
        
Name: ${car.name}
Brand: ${car.brand}
Series: ${car.series || 'N/A'}
Price: ${window.dataManager.formatCurrency(car.purchasePrice)}

This action cannot be undone.`;

        if (confirm(confirmMessage)) {
            try {
                const success = await window.dataManager.deleteCar(carId);
                if (success) {
                    this.showMessage(`"${car.name}" deleted successfully! Data saved to repository.`, 'success');
                    this.loadManageCars();
                    
                    // Trigger a custom event to notify other pages that data has changed
                    window.dispatchEvent(new CustomEvent('dataUpdated', { 
                        detail: { type: 'cars', action: 'delete', carId } 
                    }));
                } else {
                    this.showMessage('Failed to delete car. Please try again.', 'error');
                }
            } catch (error) {
                console.error('Error deleting car:', error);
                this.showMessage('Error deleting car: ' + error.message, 'error');
            }
        }
    }

    // Bulk delete functionality
    updateBulkActions() {
        const checkboxes = document.querySelectorAll('.car-checkbox');
        const checkedBoxes = document.querySelectorAll('.car-checkbox:checked');
        const deleteButton = document.getElementById('deleteSelectedCars');
        const selectAllButton = document.getElementById('selectAllCars');
        
        // Enable/disable delete button
        deleteButton.disabled = checkedBoxes.length === 0;
        
        // Update select all button text
        if (checkedBoxes.length === 0) {
            selectAllButton.innerHTML = '<i class="fas fa-check-square"></i> Select All';
        } else if (checkedBoxes.length === checkboxes.length) {
            selectAllButton.innerHTML = '<i class="fas fa-square"></i> Deselect All';
        } else {
            selectAllButton.innerHTML = '<i class="fas fa-minus-square"></i> Select All';
        }
        
        // Update delete button text with count
        deleteButton.innerHTML = `<i class="fas fa-trash"></i> Delete Selected (${checkedBoxes.length})`;
    }

    toggleSelectAll() {
        const checkboxes = document.querySelectorAll('.car-checkbox');
        const checkedBoxes = document.querySelectorAll('.car-checkbox:checked');
        const selectAll = checkedBoxes.length !== checkboxes.length;
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = selectAll;
        });
        
        this.updateBulkActions();
    }

    async deleteSelectedCars() {
        const checkedBoxes = document.querySelectorAll('.car-checkbox:checked');
        const carIds = Array.from(checkedBoxes).map(cb => parseInt(cb.value));
        
        if (carIds.length === 0) {
            this.showMessage('No cars selected for deletion.', 'error');
            return;
        }
        
        const confirmMessage = `Are you sure you want to delete ${carIds.length} car(s)? This action cannot be undone.`;
        if (!confirm(confirmMessage)) {
            return;
        }
        
        let deletedCount = 0;
        let errors = [];
        
        // Show progress
        this.showMessage(`Deleting ${carIds.length} cars...`, 'info');
        
        for (const carId of carIds) {
            try {
                const car = window.dataManager.getCarById(carId);
                const success = await window.dataManager.deleteCar(carId);
                if (success) {
                    deletedCount++;
                    console.log(`Deleted car: ${car?.name}`);
                } else {
                    errors.push(`Failed to delete car ID: ${carId}`);
                }
            } catch (error) {
                const car = window.dataManager.getCarById(carId);
                errors.push(`Error deleting ${car?.name || carId}: ${error.message}`);
                console.error('Error deleting car:', error);
            }
        }
        
        // Refresh the display
        this.loadManageCars();
        
        // Show results
        if (deletedCount === carIds.length) {
            this.showMessage(`Successfully deleted ${deletedCount} car(s)!`, 'success');
        } else if (deletedCount > 0) {
            this.showMessage(`Deleted ${deletedCount} of ${carIds.length} cars. Some deletions failed.`, 'warning');
        } else {
            this.showMessage(`Failed to delete cars: ${errors.join(', ')}`, 'error');
        }
        
        // Trigger update event
        window.dispatchEvent(new CustomEvent('dataUpdated', { 
            detail: { type: 'cars', action: 'bulkDelete', deletedCount } 
        }));
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
            if (newPassword.length < 6) {
                this.showMessage('Password must be at least 6 characters long.', 'error');
                return;
            }
            newConfig.adminPassword = window.dataManager.encrypt(newPassword);
            document.getElementById('newPassword').value = '';
            this.showMessage('Settings and password updated successfully!', 'success');
        } else {
            this.showMessage('Settings saved successfully!', 'success');
        }

        window.dataManager.config = newConfig;
        window.dataManager.saveConfig();
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

    // Git Storage Management
    setupGitStorage() {
        const repoOwner = document.getElementById('gitRepoOwner').value;
        const repoName = document.getElementById('gitRepoName').value;
        const accessToken = document.getElementById('gitAccessToken').value;

        try {
            // Configure Git storage (includes validation)
            window.gitStorage.configure({
                repoOwner,
                repoName,
                accessToken
            });

            // Test connection and setup
            this.testGitConnection().then(success => {
                if (success) {
                    // Force data manager to use Git storage immediately
                    window.dataManager.useGitStorage = true;
                    
                    // Also re-initialize data manager to pick up Git storage
                    window.dataManager.init();
                    
                    console.log('Data manager updated to use Git storage:', window.dataManager.useGitStorage);
                    
                    this.showMessage('Git storage configured successfully! Data will now be saved to your repository.', 'success');
                    
                    // Show current status
                    this.updateGitStorageStatus('Connected and Ready', 'success');
                    
                    // Update storage status display
                    this.updateStorageStatusDisplay();
                    
                    // Clear the form for security
                    document.getElementById('gitAccessToken').value = '';
                }
            }).catch(error => {
                this.showMessage(`Git setup failed: ${error.message}`, 'error');
            });
        } catch (error) {
            this.showMessage(`Configuration error: ${error.message}`, 'error');
        }
    }

    async testGitConnection() {
        const statusDiv = document.getElementById('gitStorageStatus');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Testing connection...';
        statusDiv.className = 'status-message info';

        try {
            // Check if git storage is configured
            if (!window.gitStorage.isConfigured) {
                this.updateGitStorageStatus('Git storage not configured. Please fill in all fields above.', 'error');
                return false;
            }

            const success = await window.gitStorage.testConnection();
            this.updateGitStorageStatus('Connection successful! Git storage is working.', 'success');
            return true;
        } catch (error) {
            console.error('Git connection test error:', error);
            this.updateGitStorageStatus(error.message, 'error');
            return false;
        }
    }

    async testGitOperations() {
        try {
            this.updateGitStorageStatus('Testing Git operations...', 'info');
            
            if (!window.gitStorage.isConfigured) {
                this.updateGitStorageStatus('Git storage not configured. Please set up first.', 'error');
                return;
            }
            
            const success = await window.gitStorage.testGitStorageOperations();
            if (success) {
                this.updateGitStorageStatus('Git operations test passed! Check your repository.', 'success');
            } else {
                this.updateGitStorageStatus('Git operations test failed. Check console for details.', 'error');
            }
        } catch (error) {
            this.updateGitStorageStatus(`Git operations test error: ${error.message}`, 'error');
        }
    }

    updateGitStorageStatus(message, type) {
        const statusDiv = document.getElementById('gitStorageStatus');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i> ${message}`;
        statusDiv.className = `status-message ${type}`;
    }

    showGitStorageHelp() {
        const helpContent = `
            <h3>Git Storage Setup Guide</h3>
            <ol>
                <li><strong>Create a Private Repository:</strong>
                    <ul>
                        <li>Go to GitHub and create a new <strong>private</strong> repository</li>
                        <li>Name it something like "hotwheels-data"</li>
                        <li>Initialize with a README (optional)</li>
                    </ul>
                </li>
                <li><strong>Create Personal Access Token:</strong>
                    <ul>
                        <li>Go to GitHub Settings → Developer settings → Personal access tokens</li>
                        <li>Generate new token (classic)</li>
                        <li>Select "repo" scope for full repository access</li>
                        <li>Copy the token (starts with "ghp_")</li>
                    </ul>
                </li>
                <li><strong>Security Notes:</strong>
                    <ul>
                        <li>Keep your repository <strong>private</strong> to protect your data</li>
                        <li>Never share your access token</li>
                        <li>Your password and data will be encrypted in the repository</li>
                        <li>You can revoke the token anytime from GitHub settings</li>
                    </ul>
                </li>
            </ol>
            <p><strong>Repository Structure:</strong><br>
            Your data repository will contain:<br>
            📁 data/<br>
            ├── 📄 cars.json (your car collection)<br>
            ├── 📄 wishlist.json (your wishlist)<br>
            └── 📄 config.json (encrypted settings)</p>
        `;
        
        this.showMessage(helpContent, 'info');
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

    getImageUrl(imagePath) {
        // If it's already a full URL, return as is
        if (imagePath && (imagePath.startsWith('http://') || imagePath.startsWith('https://'))) {
            return imagePath;
        }
        
        // If using Git storage and the image is in the repository, construct GitHub raw URL
        if (window.dataManager && window.dataManager.isGitStorageActive() && window.gitStorage && window.gitStorage.isConfigured) {
            if (imagePath && imagePath.startsWith('images/cars/')) {
                const { repoOwner, repoName } = window.gitStorage.config;
                return `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${imagePath}`;
            }
        }
        
        // Default to local path
        return imagePath || 'images/placeholder-car.svg';
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
