// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.currentTab = 'addCar';
        this.editingCarId = null;
        this.init();
    }

    async init() {
        // Wait for data manager to load and initialize
        while (!window.dataManager) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        // Wait for data manager to be fully initialized
        await window.dataManager.initPromise;
        
        console.log('Data manager initialized, config loaded:', window.dataManager.config);

        this.setupEventListeners();
        this.checkAuthStatus();
        this.updateStorageStatusDisplay();
    }

    updateStorageStatusDisplay() {
        const statusElement = document.getElementById('storageStatusText');
        const firebasePrompt = document.getElementById('firebaseStoragePrompt');
        
        if (statusElement && window.dataManager) {
            statusElement.textContent = window.dataManager.getStorageStatusMessage();
            
            // Show/hide Firebase storage prompt
            if (firebasePrompt) {
                if (window.dataManager.useFirebase) {
                    firebasePrompt.style.display = 'none';
                } else {
                    firebasePrompt.style.display = 'block';
                }
            }
            
            // Update icon based on storage type
            const panel = document.getElementById('storageInfoPanel');
            if (panel) {
                if (window.dataManager.useFirebase) {
                    panel.style.background = 'linear-gradient(135deg, #28a745 0%, #20c997 100%)';
                    panel.querySelector('i').className = 'fas fa-database';
                } else {
                    panel.style.background = 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)';
                    panel.querySelector('i').className = 'fas fa-exclamation-triangle';
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

    async checkAuthStatus() {
        const isAuthenticated = sessionStorage.getItem('adminAuth') === 'true';
        
        console.log('=== ADMIN AUTH DEBUG ===');
        console.log('Session authenticated:', isAuthenticated);
        console.log('Config loaded:', window.dataManager.config);
        console.log('AdminPassword value:', JSON.stringify(window.dataManager.config.adminPassword));
        console.log('AdminPassword length:', window.dataManager.config.adminPassword ? window.dataManager.config.adminPassword.length : 'undefined');
        console.log('SetupRequired:', window.dataManager.config.setupRequired);
        
        if (isAuthenticated) {
            console.log('User is authenticated, showing admin panel');
            this.showAdminPanel();
        } else {
            console.log('User not authenticated, checking password setup');
            // Check if password is configured
            await this.checkPasswordSetup();
        }
    }

    async checkPasswordSetup() {
        // Check local config first - only consider it set if it's not empty
        const hasLocalPassword = window.dataManager.config.adminPassword && 
                                window.dataManager.config.adminPassword.trim() !== '';
        let hasFirebasePassword = false;

        console.log('Checking password setup:');
        console.log('- Local password:', hasLocalPassword ? '[SET]' : '[NOT SET]');
        console.log('- Raw adminPassword value:', JSON.stringify(window.dataManager.config.adminPassword));
        console.log('- Config object:', window.dataManager.config);

        // Check Firebase if available
        if (window.firebaseManager && window.firebaseManager.isConfigured() && window.firebaseManager.isAuthenticated()) {
            try {
                const settings = await window.firebaseManager.getUserSettings();
                hasFirebasePassword = !!(settings.adminPassword && settings.adminPassword.trim() !== '');
                console.log('- Firebase password:', hasFirebasePassword ? '[SET]' : '[NOT SET]');
            } catch (error) {
                console.log('Could not check Firebase password:', error);
            }
        } else {
            console.log('- Firebase not available or not authenticated');
        }

        console.log('Final decision: hasLocalPassword =', hasLocalPassword, ', hasFirebasePassword =', hasFirebasePassword);

        if (hasLocalPassword || hasFirebasePassword) {
            // Password is configured, show normal login
            console.log('Showing login form (password found)');
            this.showLoginForm();
        } else {
            // No password configured, show setup instructions
            console.log('Showing setup instructions (no password found)');
            this.showSetupInstructions();
        }
    }

    showSetupInstructions() {
        document.getElementById('loginSection').style.display = 'block';
        document.getElementById('adminPanel').style.display = 'none';
        
        // Hide the password input and login button, show setup message
        const loginForm = document.querySelector('#loginSection form');
        const errorDiv = document.getElementById('loginError');
        
        if (loginForm) {
            loginForm.style.display = 'none';
        }
        
        errorDiv.innerHTML = `
            <div style="text-align: left; background: #e3f2fd; border: 1px solid #2196f3; padding: 20px; border-radius: 8px;">
                <h3 style="color: #1976d2; margin-top: 0;"><i class="fas fa-rocket"></i> Welcome to Hot Wheels Collection!</h3>
                <p><strong>Setup Required:</strong> No admin password is configured yet.</p>
                
                <div style="margin: 15px 0;">
                    <h4 style="color: #1976d2;"><i class="fas fa-list-ol"></i> Setup Steps:</h4>
                    <ol style="margin-left: 20px;">
                        <li><strong>Configure Firebase:</strong> Set up your Firebase project following the <a href="FIREBASE_SETUP_GUIDE.md" target="_blank" style="color: #1976d2;">Firebase Setup Guide</a></li>
                        <li><strong>Set Admin Password:</strong> Use the admin panel to configure your secure password</li>
                        <li><strong>Start Managing:</strong> Begin adding your Hot Wheels collection!</li>
                    </ol>
                </div>
                
                <div style="margin-top: 20px;">
                    <button type="button" class="btn btn-primary" onclick="adminPanel.proceedToSetup()" style="margin-right: 10px;">
                        <i class="fas fa-cog"></i> Proceed to Setup
                    </button>
                    <button type="button" class="btn btn-secondary" onclick="adminPanel.showLoginForm()">
                        <i class="fas fa-key"></i> I Already Have a Password
                    </button>
                </div>
            </div>
        `;
        errorDiv.style.display = 'block';
    }

    proceedToSetup() {
        // Bypass authentication for initial setup
        sessionStorage.setItem('adminAuth', 'true');
        sessionStorage.setItem('setupMode', 'true');
        this.showAdminPanel();
        
        // Show a setup message in the admin panel
        this.showMessage('Welcome! Please configure Firebase and set up your admin password using the sections below.', 'info');
    }

    async handleLogin() {
        const password = document.getElementById('password').value;
        const errorDiv = document.getElementById('loginError');
        
        console.log('Login attempt with config:', {
            setupRequired: window.dataManager.config.setupRequired,
            hasPassword: !!window.dataManager.config.adminPassword,
            adminPassword: window.dataManager.config.adminPassword
        });
        
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
        // Check if password is set
        if (!window.dataManager.config.adminPassword) {
            console.log('No admin password set, checking if Firebase is configured...');
            
            // Check if Firebase is configured
            if (!window.firebaseManager || !window.firebaseManager.isConfigured()) {
                console.log('Firebase not configured, showing setup message');
                errorDiv.innerHTML = `
                    <div style="text-align: left;">
                        <strong>Setup Required:</strong><br>
                        No admin password is configured. Please set up Firebase first:<br><br>
                        1. Follow the <strong>Firebase Setup Guide</strong> in the project documentation<br>
                        2. Configure Firebase credentials<br>
                        3. Set up admin password through Firebase<br><br>
                        <small>Or check the FIREBASE_SETUP_GUIDE.md file for detailed instructions.</small>
                    </div>
                `;
                errorDiv.style.display = 'block';
                document.getElementById('password').value = '';
                return;
            } else {
                // Firebase is configured but no password set
                errorDiv.innerHTML = `
                    <div style="text-align: left;">
                        <strong>Password Setup Required:</strong><br>
                        Firebase is configured but no admin password is set.<br>
                        Please use the Firebase console or setup interface to configure your admin password.
                    </div>
                `;
                errorDiv.style.display = 'block';
                document.getElementById('password').value = '';
                return;
            }
        }
        
        console.log('Validating password...');
        try {
            const isValid = await window.dataManager.validatePassword(password);
            if (isValid) {
                console.log('Password validation successful');
                sessionStorage.setItem('adminAuth', 'true');
                this.showAdminPanel();
                errorDiv.style.display = 'none';
            } else {
                console.log('Password validation failed');
                errorDiv.textContent = 'Invalid password. Please try again.';
                errorDiv.style.display = 'block';
                document.getElementById('password').value = '';
            }
        } catch (error) {
            console.error('Error during password validation:', error);
            errorDiv.textContent = 'Error validating password. Please try again.';
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
        
        // Show the login form and clear any setup messages
        const loginForm = document.querySelector('#loginSection form');
        const errorDiv = document.getElementById('loginError');
        
        if (loginForm) {
            loginForm.style.display = 'block';
        }
        
        // Clear any previous error messages
        if (errorDiv) {
            errorDiv.style.display = 'none';
            errorDiv.innerHTML = '';
        }
        
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
        
        // Focus on password input
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.focus();
        }
    }

    showAdminPanel() {
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('adminPanel').style.display = 'block';
        
        // Check if this is setup mode
        const isSetupMode = sessionStorage.getItem('setupMode') === 'true';
        if (isSetupMode) {
            // Switch to settings tab for setup
            this.switchTab('settings');
            sessionStorage.removeItem('setupMode');
        }
        
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
            
            if (!window.gitStorage || !window.gitStorage.isConfigured) {
                this.updateGitStorageStatus('❌ Git storage not configured. Please fill in all fields and click "Setup Git Storage" first.', 'error');
                return;
            }
            
            console.log('Starting Git operations test...');
            await window.gitStorage.testGitStorageOperations();
            
            this.updateGitStorageStatus('✅ Git operations test passed! Your repository is working correctly. Check your repo for test files.', 'success');
            console.log('Git operations test completed successfully');
            
        } catch (error) {
            console.error('Git operations test failed:', error);
            
            let errorMessage = '❌ Git operations test failed: ';
            if (error.message.includes('404') || error.message.includes('Not Found')) {
                errorMessage += 'Repository not found. Make sure the repository exists and your token has access.';
            } else if (error.message.includes('401') || error.message.includes('Unauthorized')) {
                errorMessage += 'Invalid access token. Check that your token is correct and has "repo" permissions.';
            } else if (error.message.includes('403') || error.message.includes('Forbidden')) {
                errorMessage += 'Access forbidden. Your token may not have the required permissions for this repository.';
            } else {
                errorMessage += error.message;
            }
            
            this.updateGitStorageStatus(errorMessage, 'error');
        }
    }

    async testImageUpload() {
        try {
            this.updateGitStorageStatus('Testing image upload...', 'info');
            
            if (!window.gitStorage || !window.gitStorage.isConfigured) {
                this.updateGitStorageStatus('❌ Git storage not configured. Please set up Git storage first.', 'error');
                return;
            }
            
            console.log('Starting image upload test...');
            const result = await window.gitStorage.testImageUpload();
            
            if (result.success) {
                this.updateGitStorageStatus(`✅ Image upload test successful! Test image uploaded to: ${result.path}`, 'success');
                console.log('Image upload test successful:', result);
            } else {
                this.updateGitStorageStatus(`❌ Image upload test failed: ${result.error}`, 'error');
                console.error('Image upload test failed:', result);
            }
        } catch (error) {
            console.error('Image upload test error:', error);
            this.updateGitStorageStatus(`❌ Image upload test error: ${error.message}`, 'error');
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
        // If no image path provided, return placeholder
        if (!imagePath) {
            return 'images/placeholder-car.svg';
        }
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // If it's a placeholder, return as is
        if (imagePath === 'images/placeholder-car.svg') {
            return imagePath;
        }
        
        // Check if Git storage is configured and active
        const gitStorageActive = window.dataManager && window.dataManager.isGitStorageActive();
        const gitConfigured = window.gitStorage && window.gitStorage.isConfigured;
        
        // If using Git storage and the image is in the repository, construct GitHub raw URL
        if (gitStorageActive && gitConfigured && imagePath.startsWith('images/cars/')) {
            try {
                const repoOwner = window.gitStorage.repoOwner;
                const repoName = window.gitStorage.repoName;
                if (repoOwner && repoName) {
                    const gitUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${imagePath}`;
                    return gitUrl;
                }
            } catch (error) {
                console.error('Admin error accessing Git config:', error);
            }
        }
        
        // Default to local path
        return imagePath;
    }

    async testDeletion() {
        try {
            this.updateGitStorageStatus('Testing deletion functionality...', 'info');
            
            if (!window.gitStorage || !window.gitStorage.isConfigured) {
                this.updateGitStorageStatus('❌ Git storage not configured. Please set up Git storage first.', 'error');
                return;
            }
            
            console.log('Starting deletion test...');
            
            // First, get current cars data
            const currentCars = window.dataManager.getCars();
            console.log('Current cars before deletion test:', currentCars.length);
            
            if (currentCars.length === 0) {
                this.updateGitStorageStatus('❌ No cars to test deletion with. Add a car first.', 'error');
                return;
            }
            
            // Get the first car for testing
            const testCar = currentCars[0];
            console.log('Testing deletion of car:', testCar.name, 'ID:', testCar.id);
            
            // Test deletion
            const deleteResult = await window.dataManager.deleteCar(testCar.id);
            console.log('Deletion result:', deleteResult);
            
            if (deleteResult) {
                // Check if car was actually removed from data
                const carsAfterDeletion = window.dataManager.getCars();
                console.log('Cars after deletion:', carsAfterDeletion.length);
                
                const carStillExists = carsAfterDeletion.find(car => car.id === testCar.id);
                if (carStillExists) {
                    this.updateGitStorageStatus('❌ Deletion test failed: Car still exists in memory', 'error');
                } else {
                    // Now check if it was saved to Git
                    try {
                        console.log('Forcing reload from Git to verify deletion...');
                        await window.dataManager.forceReloadFromGit();
                        const carsFromGit = window.dataManager.getCars();
                        const carExistsInGit = carsFromGit.find(car => car.id === testCar.id);
                        
                        if (carExistsInGit) {
                            this.updateGitStorageStatus('❌ Deletion test failed: Car still exists in Git repository', 'error');
                        } else {
                            this.updateGitStorageStatus(`✅ Deletion test successful! Car "${testCar.name}" was deleted from both memory and Git repository`, 'success');
                        }
                    } catch (gitError) {
                        console.error('Failed to reload from Git:', gitError);
                        this.updateGitStorageStatus(`⚠️ Deletion from memory successful, but couldn't verify Git deletion: ${gitError.message}`, 'warning');
                    }
                }
            } else {
                this.updateGitStorageStatus('❌ Deletion test failed: deleteCar returned false', 'error');
            }
            
        } catch (error) {
            console.error('Deletion test error:', error);
            this.updateGitStorageStatus(`❌ Deletion test error: ${error.message}`, 'error');
        }
    }

    // Firebase Setup Methods
    async setupFirebase() {
        try {
            this.updateFirebaseStatus('Setting up Firebase...', 'info');
            
            const config = {
                apiKey: document.getElementById('firebaseApiKey').value.trim(),
                authDomain: document.getElementById('firebaseAuthDomain').value.trim(),
                projectId: document.getElementById('firebaseProjectId').value.trim(),
                storageBucket: document.getElementById('firebaseStorageBucket').value.trim(),
                messagingSenderId: document.getElementById('firebaseMessagingSenderId').value.trim(),
                appId: document.getElementById('firebaseAppId').value.trim()
            };
            
            // Validate config
            const errors = this.validateFirebaseConfig(config);
            if (errors.length > 0) {
                this.updateFirebaseStatus(`❌ Configuration errors: ${errors.join(', ')}`, 'error');
                return;
            }
            
            // Test Firebase setup
            const success = await window.dataManager.setupFirebase(config);
            if (success) {
                this.updateFirebaseStatus('✅ Firebase setup completed successfully! Your data will now be saved to Firebase.', 'success');
                
                // Force data manager reinitialization
                await window.dataManager.initPromise;
                this.updateStorageStatusDisplay();
                
                // Reload the page to ensure everything is properly initialized
                setTimeout(() => {
                    location.reload();
                }, 2000);
            } else {
                this.updateFirebaseStatus('❌ Firebase setup failed. Please check your configuration.', 'error');
            }
        } catch (error) {
            console.error('Firebase setup error:', error);
            this.updateFirebaseStatus(`❌ Firebase setup error: ${error.message}`, 'error');
        }
    }

    validateFirebaseConfig(config) {
        const errors = [];
        
        if (!config.apiKey || !config.apiKey.startsWith('AIza')) {
            errors.push('API Key should start with "AIza"');
        }
        
        if (!config.projectId || config.projectId.trim() === '') {
            errors.push('Project ID is required');
        }
        
        if (!config.authDomain || !config.authDomain.includes('.firebaseapp.com')) {
            errors.push('Auth Domain should end with .firebaseapp.com');
        }
        
        if (!config.storageBucket || (!config.storageBucket.includes('.appspot.com') && !config.storageBucket.includes('.firebasestorage.app'))) {
            errors.push('Storage Bucket should end with .appspot.com or .firebasestorage.app');
        }
        
        if (!config.messagingSenderId || !/^\d+$/.test(config.messagingSenderId)) {
            errors.push('Messaging Sender ID should be numeric');
        }
        
        if (!config.appId || !config.appId.includes(':')) {
            errors.push('App ID format appears invalid');
        }
        
        return errors;
    }

    async testFirebaseConnection() {
        try {
            this.updateFirebaseStatus('Testing Firebase connection...', 'info');
            
            if (!window.firebaseManager || !window.firebaseManager.initialized) {
                this.updateFirebaseStatus('❌ Firebase not initialized. Please setup Firebase first.', 'error');
                return;
            }
            
            await window.firebaseManager.testConnection();
            this.updateFirebaseStatus('✅ Firebase connection successful!', 'success');
        } catch (error) {
            console.error('Firebase connection test failed:', error);
            this.updateFirebaseStatus(`❌ Firebase connection failed: ${error.message}`, 'error');
        }
    }

    async testFirebaseOperations() {
        try {
            this.updateFirebaseStatus('Testing Firebase operations...', 'info');
            
            if (!window.firebaseManager?.isAuthenticated()) {
                this.updateFirebaseStatus('❌ Not authenticated. Please sign in first.', 'error');
                return;
            }
            
            // Test basic operations
            const testCar = {
                name: 'Test Car',
                brand: 'Test Brand',
                series: 'Test Series',
                year: '2025',
                color: 'Red',
                condition: 'Mint',
                purchasePrice: 1.99
            };
            
            // Add test car
            const addedCar = await window.firebaseManager.addCar(testCar);
            
            // Update test car
            await window.firebaseManager.updateCar(addedCar.id, { color: 'Blue' });
            
            // Delete test car
            await window.firebaseManager.deleteCar(addedCar.id);
            
            this.updateFirebaseStatus('✅ Firebase operations test passed! All CRUD operations work correctly.', 'success');
        } catch (error) {
            console.error('Firebase operations test failed:', error);
            this.updateFirebaseStatus(`❌ Firebase operations test failed: ${error.message}`, 'error');
        }
    }

    updateFirebaseStatus(message, type) {
        const statusDiv = document.getElementById('firebaseStatus');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i> ${message}`;
        statusDiv.className = `status-message ${type}`;
        
        // Auto-hide success messages after 5 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 5000);
        }
    }

    // Password Setup Methods
    showPasswordSetup() {
        const form = document.getElementById('passwordSetupForm');
        const isVisible = form.style.display !== 'none';
        form.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            document.getElementById('newAdminPassword').focus();
        }
    }

    async setupAdminPassword() {
        const newPassword = document.getElementById('newAdminPassword').value;
        const confirmPassword = document.getElementById('confirmAdminPassword').value;
        const statusDiv = document.getElementById('passwordStatus');

        // Validation
        if (!newPassword || !confirmPassword) {
            this.updatePasswordStatus('Please fill in both password fields.', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            this.updatePasswordStatus('Passwords do not match.', 'error');
            return;
        }

        if (newPassword.length < 6) {
            this.updatePasswordStatus('Password must be at least 6 characters long.', 'error');
            return;
        }

        try {
            // Check if Firebase is configured and authenticated
            if (!window.firebaseManager || !window.firebaseManager.isConfigured()) {
                this.updatePasswordStatus('Please configure Firebase first before setting up admin password.', 'error');
                return;
            }

            if (!window.firebaseManager.isAuthenticated()) {
                this.updatePasswordStatus('Please authenticate with Firebase first.', 'error');
                return;
            }

            // Encrypt the password using the same method as local storage
            const encryptedPassword = window.dataManager.encrypt(newPassword);

            // Save to Firebase user settings
            const currentSettings = await window.firebaseManager.getUserSettings();
            await window.firebaseManager.updateUserSettings({
                ...currentSettings,
                adminPassword: encryptedPassword
            });

            // Clear form
            document.getElementById('newAdminPassword').value = '';
            document.getElementById('confirmAdminPassword').value = '';
            document.getElementById('passwordSetupForm').style.display = 'none';

            this.updatePasswordStatus('✅ Admin password has been set successfully! You can now use this password to log in.', 'success');
            
        } catch (error) {
            console.error('Error setting up admin password:', error);
            this.updatePasswordStatus(`❌ Failed to set admin password: ${error.message}`, 'error');
        }
    }

    async changeAdminPassword() {
        // Same as setupAdminPassword but with additional current password verification
        const currentPassword = prompt('Enter your current admin password:');
        if (!currentPassword) return;

        try {
            // Verify current password
            const isValid = await window.dataManager.validatePassword(currentPassword);
            if (!isValid) {
                this.updatePasswordStatus('Current password is incorrect.', 'error');
                return;
            }

            // Show password setup form
            this.showPasswordSetup();
            
        } catch (error) {
            console.error('Error verifying current password:', error);
            this.updatePasswordStatus(`❌ Error verifying current password: ${error.message}`, 'error');
        }
    }

    updatePasswordStatus(message, type) {
        const statusDiv = document.getElementById('passwordStatus');
        statusDiv.style.display = 'block';
        statusDiv.innerHTML = `<i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i> ${message}`;
        statusDiv.className = `status-message ${type}`;
        
        // Auto-hide success messages after 10 seconds
        if (type === 'success') {
            setTimeout(() => {
                statusDiv.style.display = 'none';
            }, 10000);
        }
    }

    // Debug utility for clearing localStorage
    clearLocalStorage() {
        console.log('Clearing localStorage and sessionStorage...');
        localStorage.clear();
        sessionStorage.clear();
        console.log('Storage cleared. Refreshing page...');
        window.location.reload();
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});
