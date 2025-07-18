// Main JavaScript for Hot Wheels Collection
class CollectionView {
    constructor() {
        this.currentView = 'grid';
        this.currentFilters = {};
        this.currentSort = 'name';
        this.currentQuery = '';
        this.init();
    }

    async init() {
        // Wait for data manager to load
        while (!window.dataManager) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Wait for data manager to finish initializing
        if (window.dataManager.initPromise) {
            await window.dataManager.initPromise;
        }

        console.log('Data manager loaded, cars:', window.dataManager.cars.length);
        
        // Debug: Log car images
        if (window.dataManager.cars.length > 0) {
            console.log('Car images:', window.dataManager.cars.map(car => ({
                name: car.name,
                image: car.image
            })));
        } else {
            console.log('No cars found in collection');
        }

        this.setupEventListeners();
        this.populateFilters();
        this.updateStatistics();
        this.displayCars();
        
        // Listen for data updates from admin panel
        window.addEventListener('dataUpdated', (event) => {
            if (event.detail.type === 'cars') {
                this.refreshData();
            }
        });
        
        // Also listen for storage events (when localStorage changes)
        window.addEventListener('storage', (event) => {
            if (event.key === 'hotwheels_cars') {
                this.refreshData();
            }
        });
    }

    setupEventListeners() {
        // Mobile navigation
        const navToggle = document.querySelector('.nav-toggle');
        const navMenu = document.querySelector('.nav-menu');
        
        if (navToggle) {
            navToggle.addEventListener('click', () => {
                navMenu.classList.toggle('active');
                navToggle.classList.toggle('active');
            });
        }

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentQuery = e.target.value;
                this.displayCars();
            });
        }

        // Filter functionality
        const filters = ['brandFilter', 'seriesFilter', 'colorFilter', 'conditionFilter'];
        filters.forEach(filterId => {
            const filter = document.getElementById(filterId);
            if (filter) {
                filter.addEventListener('change', (e) => {
                    const filterType = filterId.replace('Filter', '');
                    if (e.target.value) {
                        this.currentFilters[filterType] = e.target.value;
                    } else {
                        delete this.currentFilters[filterType];
                    }
                    this.displayCars();
                });
            }
        });

        // Sort functionality
        const sortBy = document.getElementById('sortBy');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.displayCars();
            });
        }

        // View toggle
        const gridView = document.getElementById('gridView');
        const tableView = document.getElementById('tableView');
        
        if (gridView) {
            gridView.addEventListener('click', () => {
                this.currentView = 'grid';
                this.updateViewButtons();
                this.displayCars();
            });
        }

        if (tableView) {
            tableView.addEventListener('click', () => {
                this.currentView = 'table';
                this.updateViewButtons();
                this.displayCars();
            });
        }

        // Export functionality
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.showExportOptions();
            });
        }

        // Modal functionality
        const modal = document.getElementById('carModal');
        const closeModal = document.querySelector('.close');
        
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
    }

    populateFilters() {
        // Populate brand filter
        const brandFilter = document.getElementById('brandFilter');
        if (brandFilter) {
            const brands = window.dataManager.getUniqueValues('brand');
            brandFilter.innerHTML = '<option value="">All Brands</option>';
            brands.forEach(brand => {
                const option = document.createElement('option');
                option.value = brand;
                option.textContent = brand;
                brandFilter.appendChild(option);
            });
        }

        // Populate series filter
        const seriesFilter = document.getElementById('seriesFilter');
        if (seriesFilter) {
            const series = window.dataManager.getUniqueValues('series');
            seriesFilter.innerHTML = '<option value="">All Series</option>';
            series.forEach(serie => {
                const option = document.createElement('option');
                option.value = serie;
                option.textContent = serie;
                seriesFilter.appendChild(option);
            });
        }

        // Populate color filter
        const colorFilter = document.getElementById('colorFilter');
        if (colorFilter) {
            const colors = window.dataManager.getUniqueValues('color');
            colorFilter.innerHTML = '<option value="">All Colors</option>';
            colors.forEach(color => {
                const option = document.createElement('option');
                option.value = color;
                option.textContent = color;
                colorFilter.appendChild(option);
            });
        }
    }

    updateStatistics() {
        const stats = window.dataManager.getStatistics();
        
        const totalCarsElement = document.getElementById('totalCars');
        const totalValueElement = document.getElementById('totalValue');
        
        if (totalCarsElement) {
            totalCarsElement.textContent = stats.totalCars;
        }
        
        if (totalValueElement) {
            totalValueElement.textContent = window.dataManager.formatCurrency(stats.totalValue);
        }
    }

    updateViewButtons() {
        const gridView = document.getElementById('gridView');
        const tableView = document.getElementById('tableView');
        
        if (gridView && tableView) {
            gridView.classList.toggle('active', this.currentView === 'grid');
            tableView.classList.toggle('active', this.currentView === 'table');
        }
    }

    displayCars() {
        // Get filtered and sorted cars
        const filteredCars = window.dataManager.searchCars(this.currentQuery, this.currentFilters);
        const sortedCars = window.dataManager.sortCars(filteredCars, this.currentSort);

        console.log('displayCars: Total cars:', window.dataManager.cars.length, 'Filtered:', filteredCars.length, 'Sorted:', sortedCars.length);

        // Show/hide views
        const gridContainer = document.getElementById('carsGrid');
        const tableContainer = document.getElementById('carsTable');
        const noResults = document.getElementById('noResults');

        if (gridContainer && tableContainer) {
            gridContainer.style.display = this.currentView === 'grid' ? 'grid' : 'none';
            tableContainer.style.display = this.currentView === 'table' ? 'block' : 'none';
        }

        if (sortedCars.length === 0) {
            if (noResults) {
                // Check if this is due to filters or genuinely empty collection
                const allCars = window.dataManager.getCars();
                if (allCars.length === 0) {
                    noResults.innerHTML = `
                        <i class="fas fa-car"></i>
                        <h3>No cars in collection yet</h3>
                        <p>Start building your collection by adding cars in the <a href="admin.html">Admin Panel</a></p>
                    `;
                } else {
                    noResults.innerHTML = `
                        <i class="fas fa-search"></i>
                        <h3>No cars found</h3>
                        <p>Try adjusting your search or filters</p>
                    `;
                }
                noResults.style.display = 'block';
            }
            if (gridContainer) gridContainer.innerHTML = '';
            if (tableContainer) {
                const tbody = document.getElementById('carsTableBody');
                if (tbody) tbody.innerHTML = '';
            }
            return;
        }

        if (noResults) {
            noResults.style.display = 'none';
        }

        if (this.currentView === 'grid') {
            this.displayGridView(sortedCars);
        } else {
            this.displayTableView(sortedCars);
        }
    }

    displayGridView(cars) {
        const container = document.getElementById('carsGrid');
        if (!container) return;

        container.innerHTML = cars.map(car => `
            <div class="car-card" onclick="collectionView.showCarDetails(${car.id})">
                <img src="${this.getImageUrl(car.image)}" alt="${car.name}" class="car-image" 
                     onerror="window.collectionView.handleImageError(this, '${car.name}');"
                     onload="console.log('Image loaded successfully:', this.src);">
                <div class="car-info">
                    <h3 class="car-name">${car.name}</h3>
                    <p class="car-brand">${car.brand}</p>
                    <div class="car-details">
                        <div class="car-detail">
                            <span class="car-detail-label">Series:</span>
                            <span class="car-detail-value">${car.series}</span>
                        </div>
                        <div class="car-detail">
                            <span class="car-detail-label">Color:</span>
                            <span class="car-detail-value">${car.color}</span>
                        </div>
                        <div class="car-detail">
                            <span class="car-detail-label">Condition:</span>
                            <span class="car-detail-value">${car.condition}</span>
                        </div>
                        <div class="car-detail">
                            <span class="car-detail-label">Price:</span>
                            <span class="car-detail-value car-price">${window.dataManager.formatCurrency(car.purchasePrice)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displayTableView(cars) {
        const tbody = document.getElementById('carsTableBody');
        if (!tbody) return;

        tbody.innerHTML = cars.map(car => `
            <tr onclick="collectionView.showCarDetails(${car.id})" style="cursor: pointer;">
                <td>
                    <img src="${this.getImageUrl(car.image)}" alt="${car.name}" class="table-car-image" 
                         onerror="this.src='images/placeholder-car.svg'">
                </td>
                <td><strong>${car.name}</strong></td>
                <td>${car.brand}</td>
                <td>${car.series}</td>
                <td>${car.color}</td>
                <td>${car.condition}</td>
                <td>${window.dataManager.formatCurrency(car.purchasePrice)}</td>
                <td>${new Date(car.purchaseDate).toLocaleDateString()}</td>
            </tr>
        `).join('');
    }

    showCarDetails(carId) {
        const car = window.dataManager.getCarById(carId);
        if (!car) return;

        const modal = document.getElementById('carModal');
        const carDetails = document.getElementById('carDetails');
        
        if (!modal || !carDetails) return;

        carDetails.innerHTML = `
            <img src="${this.getImageUrl(car.image)}" alt="${car.name}" class="modal-car-image" 
                 onerror="this.src='images/placeholder-car.svg'">
            <h2 class="modal-car-name">${car.name}</h2>
            <p class="modal-car-brand">${car.brand}</p>
            
            <div class="modal-details-grid">
                <div class="modal-detail">
                    <div class="modal-detail-label">Series</div>
                    <div class="modal-detail-value">${car.series}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Year</div>
                    <div class="modal-detail-value">${car.year}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Color</div>
                    <div class="modal-detail-value">${car.color}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Scale</div>
                    <div class="modal-detail-value">${car.scale}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Condition</div>
                    <div class="modal-detail-value">${car.condition}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Purchase Price</div>
                    <div class="modal-detail-value">$${parseFloat(car.purchasePrice).toFixed(2)}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Purchase Date</div>
                    <div class="modal-detail-value">${new Date(car.purchaseDate).toLocaleDateString()}</div>
                </div>
                <div class="modal-detail">
                    <div class="modal-detail-label">Date Added</div>
                    <div class="modal-detail-value">${new Date(car.dateAdded).toLocaleDateString()}</div>
                </div>
            </div>
            
            ${car.description ? `
                <div class="modal-detail" style="grid-column: 1 / -1; margin-top: 1rem;">
                    <div class="modal-detail-label">Description</div>
                    <div class="modal-detail-value">${car.description}</div>
                </div>
            ` : ''}
        `;

        modal.style.display = 'block';
    }

    showExportOptions() {
        const options = confirm('Choose export format:\nOK for CSV\nCancel for JSON');
        
        if (options) {
            window.dataManager.exportToCSV();
        } else {
            window.dataManager.exportToJSON();
        }
    }

    getImageUrl(imagePath) {
        console.log('getImageUrl called with:', imagePath);
        
        // If no image path provided, return placeholder
        if (!imagePath) {
            return 'images/placeholder-car.svg';
        }
        
        // If it's already a full URL, return as is
        if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
            return imagePath;
        }
        
        // Check if Git storage is configured and active
        const gitStorageActive = window.dataManager && window.dataManager.isGitStorageActive();
        const gitConfigured = window.gitStorage && window.gitStorage.isConfigured;
        
        console.log('Git storage active:', gitStorageActive, 'Git configured:', gitConfigured);
        
        // If using Git storage and the image is in the repository, construct GitHub raw URL
        if (gitStorageActive && gitConfigured && imagePath.startsWith('images/cars/')) {
            try {
                const { repoOwner, repoName } = window.gitStorage.config;
                if (repoOwner && repoName) {
                    const gitUrl = `https://raw.githubusercontent.com/${repoOwner}/${repoName}/main/${imagePath}`;
                    console.log('Constructed Git URL:', gitUrl);
                    return gitUrl;
                }
            } catch (error) {
                console.error('Error accessing Git config:', error);
            }
        }
        
        // For local images, ensure proper relative path
        const localPath = imagePath.startsWith('./') ? imagePath : `./${imagePath}`;
        console.log('Using local path:', localPath);
        return localPath;
    }

    async refreshData() {
        // Reload data from data manager
        if (window.dataManager.initPromise) {
            await window.dataManager.initPromise;
        }
        
        // Refresh all displays
        this.populateFilters();
        this.updateStatistics();
        this.displayCars();
        
        console.log('Data refreshed - found', window.dataManager.cars.length, 'cars');
    }

    handleImageError(imgElement, carName) {
        console.log(`Image failed to load for ${carName}:`, imgElement.src);
        
        // Try different fallback paths for the placeholder
        const fallbacks = [
            './images/placeholder-car.svg',
            'images/placeholder-car.svg',
            // Use the actual SVG content as data URL (embedded placeholder)
            'data:image/svg+xml;charset=utf-8,<svg width="400" height="300" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" style="stop-color:%23667eea;stop-opacity:0.1" /><stop offset="100%" style="stop-color:%23764ba2;stop-opacity:0.1" /></linearGradient></defs><rect width="100%" height="100%" fill="url(%23bg)"/><circle cx="200" cy="120" r="40" fill="%23667eea" opacity="0.3"/><rect x="150" y="140" width="100" height="20" rx="10" fill="%23667eea" opacity="0.5"/><rect x="170" y="170" width="20" height="40" rx="10" fill="%23667eea" opacity="0.4"/><rect x="210" y="170" width="20" height="40" rx="10" fill="%23667eea" opacity="0.4"/><text x="200" y="230" font-family="Arial" font-size="14" fill="%23667eea" text-anchor="middle">Hot Wheels</text></svg>'
        ];
        
        let currentIndex = 0;
        const tryNext = () => {
            if (currentIndex < fallbacks.length) {
                const nextSrc = fallbacks[currentIndex++];
                console.log(`Trying fallback ${currentIndex}:`, nextSrc);
                imgElement.onerror = currentIndex < fallbacks.length ? tryNext : () => {
                    console.log('All image fallbacks failed, removing error handler');
                    imgElement.onerror = null;
                };
                imgElement.src = nextSrc;
            }
        };
        
        tryNext();
    }

}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.collectionView = new CollectionView();
});
