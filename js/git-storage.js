// Git-based Storage Manager for Hot Wheels Collection
class GitStorageManager {
    constructor() {
        this.dataRepo = null;
        this.accessToken = null;
        this.repoOwner = null;
        this.repoName = null;
        this.isConfigured = false;
    }

    // Configure Git storage
    configure(config) {
        this.accessToken = config.accessToken;
        this.repoOwner = config.repoOwner;
        this.repoName = config.repoName;
        this.isConfigured = true;
        
        // Store config in localStorage (encrypted)
        const encryptedConfig = this.encrypt(JSON.stringify(config));
        localStorage.setItem('git_storage_config', encryptedConfig);
    }

    // Simple encryption for local storage
    encrypt(text) {
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

    // Load configuration from localStorage
    loadConfig() {
        const stored = localStorage.getItem('git_storage_config');
        if (stored) {
            try {
                const decrypted = this.decrypt(stored);
                const config = JSON.parse(decrypted);
                this.configure(config);
                return true;
            } catch {
                return false;
            }
        }
        return false;
    }

    // GitHub API helper
    async githubAPI(endpoint, method = 'GET', data = null) {
        if (!this.isConfigured) {
            throw new Error('Git storage not configured');
        }

        const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}/${endpoint}`;
        
        const options = {
            method,
            headers: {
                'Authorization': `token ${this.accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            }
        };

        if (data && (method === 'PUT' || method === 'POST')) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(`GitHub API Error: ${error.message}`);
        }

        return response.json();
    }

    // Get file from repository
    async getFile(path) {
        try {
            const result = await this.githubAPI(`contents/${path}`);
            const content = atob(result.content);
            return {
                content: JSON.parse(content),
                sha: result.sha
            };
        } catch (error) {
            if (error.message.includes('404')) {
                return { content: null, sha: null };
            }
            throw error;
        }
    }

    // Save file to repository
    async saveFile(path, content, message, sha = null) {
        const data = {
            message,
            content: btoa(JSON.stringify(content, null, 2))
        };

        if (sha) {
            data.sha = sha;
        }

        return await this.githubAPI(`contents/${path}`, 'PUT', data);
    }

    // Load cars from Git repository
    async loadCars() {
        try {
            const result = await this.getFile('data/cars.json');
            if (result.content && result.content.cars) {
                return result.content.cars;
            } else if (result.content && Array.isArray(result.content)) {
                return result.content;
            }
            return [];
        } catch (error) {
            console.error('Failed to load cars from Git:', error);
            return [];
        }
    }

    // Save cars to Git repository
    async saveCars(cars) {
        try {
            const existing = await this.getFile('data/cars.json');
            const data = {
                cars,
                lastUpdated: new Date().toISOString()
            };
            
            await this.saveFile(
                'data/cars.json',
                data,
                `Update cars collection - ${new Date().toLocaleString()}`,
                existing.sha
            );
            
            return true;
        } catch (error) {
            console.error('Failed to save cars to Git:', error);
            return false;
        }
    }

    // Load wishlist from Git repository
    async loadWishlist() {
        try {
            const result = await this.getFile('data/wishlist.json');
            if (result.content && result.content.wishlist) {
                return result.content.wishlist;
            } else if (result.content && Array.isArray(result.content)) {
                return result.content;
            }
            return [];
        } catch (error) {
            console.error('Failed to load wishlist from Git:', error);
            return [];
        }
    }

    // Save wishlist to Git repository
    async saveWishlist(wishlist) {
        try {
            const existing = await this.getFile('data/wishlist.json');
            const data = {
                wishlist,
                lastUpdated: new Date().toISOString()
            };
            
            await this.saveFile(
                'data/wishlist.json',
                data,
                `Update wishlist - ${new Date().toLocaleString()}`,
                existing.sha
            );
            
            return true;
        } catch (error) {
            console.error('Failed to save wishlist to Git:', error);
            return false;
        }
    }

    // Load config from Git repository
    async loadConfig() {
        try {
            const result = await this.getFile('data/config.json');
            return result.content || {};
        } catch (error) {
            console.error('Failed to load config from Git:', error);
            return {};
        }
    }

    // Save config to Git repository
    async saveConfig(config) {
        try {
            const existing = await this.getFile('data/config.json');
            
            await this.saveFile(
                'data/config.json',
                config,
                `Update configuration - ${new Date().toLocaleString()}`,
                existing.sha
            );
            
            return true;
        } catch (error) {
            console.error('Failed to save config to Git:', error);
            return false;
        }
    }

    // Test connection to repository
    async testConnection() {
        try {
            await this.githubAPI('');
            return true;
        } catch (error) {
            console.error('Git connection test failed:', error);
            return false;
        }
    }
}

// Initialize Git storage manager
window.gitStorage = new GitStorageManager();
