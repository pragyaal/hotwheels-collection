// Wishlist Page JavaScript
class WishlistView {
    constructor() {
        this.currentSort = 'name';
        this.currentQuery = '';
        this.init();
    }

    async init() {
        // Wait for data manager to load
        while (!window.dataManager) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        this.setupEventListeners();
        this.updateStatistics();
        this.displayWishlist();
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
        const searchInput = document.getElementById('wishlistSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentQuery = e.target.value;
                this.displayWishlist();
            });
        }

        // Sort functionality
        const sortBy = document.getElementById('wishlistSort');
        if (sortBy) {
            sortBy.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.displayWishlist();
            });
        }
    }

    updateStatistics() {
        const wishlist = window.dataManager.getWishlist();
        const totalItems = wishlist.length;
        const expectedCost = wishlist.reduce((sum, item) => sum + (parseFloat(item.expectedPrice) || 0), 0);

        const wishlistCountElement = document.getElementById('wishlistCount');
        const expectedCostElement = document.getElementById('expectedCost');

        if (wishlistCountElement) {
            wishlistCountElement.textContent = totalItems;
        }

        if (expectedCostElement) {
            expectedCostElement.textContent = `$${expectedCost.toFixed(2)}`;
        }
    }

    displayWishlist() {
        const wishlist = window.dataManager.getWishlist();
        const filteredWishlist = this.filterWishlist(wishlist);
        const sortedWishlist = this.sortWishlist(filteredWishlist);

        const gridContainer = document.getElementById('wishlistGrid');
        const noItemsMessage = document.getElementById('noWishlistItems');

        if (sortedWishlist.length === 0) {
            if (gridContainer) gridContainer.style.display = 'none';
            if (noItemsMessage) noItemsMessage.style.display = 'block';
            return;
        }

        if (gridContainer) gridContainer.style.display = 'grid';
        if (noItemsMessage) noItemsMessage.style.display = 'none';

        if (gridContainer) {
            gridContainer.innerHTML = sortedWishlist.map(item => this.createWishlistCard(item)).join('');
        }
    }

    filterWishlist(wishlist) {
        if (!this.currentQuery) return wishlist;

        const searchTerm = this.currentQuery.toLowerCase();
        return wishlist.filter(item =>
            item.name.toLowerCase().includes(searchTerm) ||
            (item.brand && item.brand.toLowerCase().includes(searchTerm)) ||
            (item.series && item.series.toLowerCase().includes(searchTerm)) ||
            (item.notes && item.notes.toLowerCase().includes(searchTerm))
        );
    }

    sortWishlist(wishlist) {
        return wishlist.sort((a, b) => {
            let aVal, bVal;

            switch (this.currentSort) {
                case 'name':
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
                    break;
                case 'brand':
                    aVal = (a.brand || '').toLowerCase();
                    bVal = (b.brand || '').toLowerCase();
                    break;
                case 'expectedPrice':
                    aVal = parseFloat(a.expectedPrice) || 0;
                    bVal = parseFloat(b.expectedPrice) || 0;
                    break;
                case 'dateAdded':
                    aVal = new Date(a.dateAdded);
                    bVal = new Date(b.dateAdded);
                    break;
                default:
                    aVal = a.name.toLowerCase();
                    bVal = b.name.toLowerCase();
            }

            if (aVal < bVal) return -1;
            if (aVal > bVal) return 1;
            return 0;
        });
    }

    createWishlistCard(item) {
        const expectedPrice = parseFloat(item.expectedPrice) || 0;
        const dateAdded = new Date(item.dateAdded).toLocaleDateString();

        return `
            <div class="wishlist-card">
                <div class="wishlist-card-header">
                    <div class="wishlist-priority">
                        <i class="fas fa-heart"></i>
                    </div>
                </div>
                <div class="wishlist-card-content">
                    <h3 class="wishlist-item-name">${item.name}</h3>
                    ${item.brand ? `<p class="wishlist-item-brand">${item.brand}</p>` : ''}
                    
                    <div class="wishlist-details">
                        ${item.series ? `
                            <div class="wishlist-detail">
                                <span class="detail-label">Series:</span>
                                <span class="detail-value">${item.series}</span>
                            </div>
                        ` : ''}
                        ${expectedPrice > 0 ? `
                            <div class="wishlist-detail">
                                <span class="detail-label">Expected Price:</span>
                                <span class="detail-value wishlist-price">$${expectedPrice.toFixed(2)}</span>
                            </div>
                        ` : ''}
                        <div class="wishlist-detail">
                            <span class="detail-label">Added:</span>
                            <span class="detail-value">${dateAdded}</span>
                        </div>
                    </div>
                    
                    ${item.notes ? `
                        <div class="wishlist-notes">
                            <i class="fas fa-sticky-note"></i>
                            <span>${item.notes}</span>
                        </div>
                    ` : ''}
                </div>
                <div class="wishlist-card-actions">
                    <button class="btn-icon" onclick="wishlistView.markAsFound(${item.id})" title="Mark as Found">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="btn-icon" onclick="wishlistView.editItem(${item.id})" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                </div>
            </div>
        `;
    }

    markAsFound(itemId) {
        const item = window.dataManager.getWishlist().find(w => w.id === itemId);
        if (!item) return;

        if (confirm(`Mark "${item.name}" as found? This will remove it from your wishlist.`)) {
            // In a real app, you might want to move this to collection instead
            window.dataManager.removeFromWishlist(itemId);
            this.updateStatistics();
            this.displayWishlist();
            this.showMessage(`"${item.name}" removed from wishlist!`, 'success');
        }
    }

    editItem(itemId) {
        // Redirect to admin panel for editing
        sessionStorage.setItem('editWishlistItem', itemId);
        window.location.href = 'admin.html#manageWishlist';
    }

    showMessage(message, type = 'info') {
        // Create a temporary message element
        const messageDiv = document.createElement('div');
        messageDiv.className = `message-toast message-${type}`;
        messageDiv.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check' : type === 'error' ? 'exclamation' : 'info'}-circle"></i>
            ${message}
        `;

        document.body.appendChild(messageDiv);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            messageDiv.remove();
        }, 3000);
    }
}

// Add CSS for wishlist
const wishlistStyles = `
<style>
.wishlist-stats {
    display: flex;
    justify-content: center;
    gap: 2rem;
    margin-top: 1rem;
}

.wishlist-container {
    padding: 2rem;
    min-height: 400px;
}

.wishlist-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 2rem;
}

.wishlist-card {
    background: white;
    border-radius: 15px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
    overflow: hidden;
    transition: transform 0.3s ease, box-shadow 0.3s ease;
    border-left: 4px solid #ff6b6b;
}

.wishlist-card:hover {
    transform: translateY(-5px);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
}

.wishlist-card-header {
    background: linear-gradient(135deg, #ff6b6b 0%, #ff8e8e 100%);
    padding: 1rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.wishlist-priority {
    color: white;
    font-size: 1.2rem;
}

.wishlist-card-content {
    padding: 1.5rem;
}

.wishlist-item-name {
    font-size: 1.3rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
    color: #333;
}

.wishlist-item-brand {
    color: #667eea;
    font-weight: 500;
    margin-bottom: 1rem;
}

.wishlist-details {
    display: grid;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.wishlist-detail {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.25rem 0;
}

.detail-label {
    color: #666;
    font-size: 0.9rem;
}

.detail-value {
    font-weight: 500;
    color: #333;
}

.wishlist-price {
    background: #4caf50;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 5px;
    font-size: 0.9rem;
}

.wishlist-notes {
    background: #f8f9fa;
    padding: 1rem;
    border-radius: 8px;
    border-left: 3px solid #667eea;
    display: flex;
    align-items: flex-start;
    gap: 0.5rem;
    margin-top: 1rem;
    font-size: 0.9rem;
    color: #555;
}

.wishlist-notes i {
    color: #667eea;
    margin-top: 0.1rem;
}

.wishlist-card-actions {
    padding: 1rem 1.5rem;
    background: #f8f9fa;
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    border-top: 1px solid #eee;
}

.btn-icon {
    background: none;
    border: 2px solid #ddd;
    color: #666;
    padding: 0.5rem;
    border-radius: 50%;
    cursor: pointer;
    transition: all 0.3s ease;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
}

.btn-icon:hover {
    border-color: #667eea;
    color: #667eea;
    background: rgba(102, 126, 234, 0.1);
}

.btn-icon:first-child:hover {
    border-color: #4caf50;
    color: #4caf50;
    background: rgba(76, 175, 80, 0.1);
}

.message-toast {
    position: fixed;
    top: 20px;
    right: 20px;
    background: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    z-index: 1000;
    animation: slideIn 0.3s ease;
}

.message-success {
    border-left: 4px solid #4caf50;
    color: #2e7d32;
}

.message-error {
    border-left: 4px solid #f44336;
    color: #c62828;
}

.message-info {
    border-left: 4px solid #2196f3;
    color: #1565c0;
}

@keyframes slideIn {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

@media (max-width: 768px) {
    .wishlist-stats {
        flex-direction: column;
        align-items: center;
    }
    
    .wishlist-grid {
        grid-template-columns: 1fr;
    }
    
    .wishlist-container {
        padding: 1rem;
    }
    
    .message-toast {
        right: 10px;
        left: 10px;
        right: 10px;
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', wishlistStyles);

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.wishlistView = new WishlistView();
});
