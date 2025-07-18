// Git-based Storage Manager for Hot Wheels Collection
class GitStorageManager {
    constructor() {
        this.dataRepo = null;
        this.accessToken = null;
        this.repoOwner = null;
        this.repoName = null;
        this.isConfigured = false;
    }

    // Validate configuration before setting up
    validateConfig(config) {
        const errors = [];
        
        if (!config.repoOwner || config.repoOwner.trim() === '') {
            errors.push('Repository Owner is required');
        }
        
        if (!config.repoName || config.repoName.trim() === '') {
            errors.push('Repository Name is required');
        }
        
        if (!config.accessToken || config.accessToken.trim() === '') {
            errors.push('Access Token is required');
        }
        
        // Basic token format validation
        if (config.accessToken && !config.accessToken.startsWith('ghp_') && !config.accessToken.startsWith('github_pat_')) {
            errors.push('Access Token should start with "ghp_" (classic) or "github_pat_" (fine-grained)');
        }
        
        return errors;
    }

    // Configure Git storage
    configure(config) {
        // Validate first
        const errors = this.validateConfig(config);
        if (errors.length > 0) {
            throw new Error(`Configuration errors: ${errors.join(', ')}`);
        }
        
        this.accessToken = config.accessToken.trim();
        this.repoOwner = config.repoOwner.trim();
        this.repoName = config.repoName.trim();
        this.isConfigured = true;
        
        // Store config in localStorage (encrypted)
        const encryptedConfig = this.encrypt(JSON.stringify({
            accessToken: this.accessToken,
            repoOwner: this.repoOwner,
            repoName: this.repoName
        }));
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
                this.accessToken = config.accessToken;
                this.repoOwner = config.repoOwner;
                this.repoName = config.repoName;
                this.isConfigured = true;
                console.log('Git storage config loaded:', this.repoOwner + '/' + this.repoName);
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
        
        const baseOptions = {
            method,
            headers: {
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json',
                'User-Agent': 'Hot-Wheels-Collection/1.0'
            }
        };

        if (data && (method === 'PUT' || method === 'POST')) {
            baseOptions.body = JSON.stringify(data);
        }

        // Try Bearer format first (newer)
        let options = {
            ...baseOptions,
            headers: {
                ...baseOptions.headers,
                'Authorization': `Bearer ${this.accessToken}`
            }
        };

        let response = await fetch(url, options);
        
        // If Bearer fails with 401, try token format (older)
        if (!response.ok && response.status === 401) {
            options.headers['Authorization'] = `token ${this.accessToken}`;
            response = await fetch(url, options);
        }
        
        if (!response.ok) {
            let errorMessage = `GitHub API Error (${response.status})`;
            try {
                const errorData = await response.json();
                errorMessage += `: ${errorData.message}`;
                if (errorData.documentation_url) {
                    console.log('Documentation:', errorData.documentation_url);
                }
            } catch {
                errorMessage += `: ${response.statusText}`;
            }
            throw new Error(errorMessage);
        }

        return response.json();
    }

    // Get file from repository
    async getFile(path) {
        try {
            const result = await this.githubAPI(`contents/${path}`);
            const content = atob(result.content.replace(/\s/g, ''));
            return {
                content: JSON.parse(content),
                sha: result.sha
            };
        } catch (error) {
            if (error.message.includes('404') || error.message.includes('Not Found')) {
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
            throw error;
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
            throw error;
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
            throw error;
        }
    }

    // Test connection to repository
    async testConnection() {
        try {
            if (!this.isConfigured) {
                throw new Error('Git storage not configured');
            }
            
            // Test by getting repository information
            const url = `https://api.github.com/repos/${this.repoOwner}/${this.repoName}`;
            
            // Try Bearer format first (newer)
            let response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${this.accessToken}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Hot-Wheels-Collection/1.0'
                }
            });
            
            // If Bearer fails with 401, try token format (older)
            if (!response.ok && response.status === 401) {
                console.log('Bearer auth failed, trying token format...');
                response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Authorization': `token ${this.accessToken}`,
                        'Accept': 'application/vnd.github.v3+json',
                        'User-Agent': 'Hot-Wheels-Collection/1.0'
                    }
                });
            }
            
            if (!response.ok) {
                let errorMessage;
                try {
                    const errorData = await response.json();
                    switch (response.status) {
                        case 401:
                            errorMessage = 'Invalid access token. Please verify your token is correct and has not expired.';
                            break;
                        case 403:
                            errorMessage = 'Access forbidden. Make sure your token has "repo" permissions for private repositories.';
                            break;
                        case 404:
                            errorMessage = `Repository not found. Check that "${this.repoOwner}/${this.repoName}" exists and is accessible to your token.`;
                            break;
                        default:
                            errorMessage = `GitHub API Error (${response.status}): ${errorData.message || response.statusText}`;
                    }
                    console.error('GitHub API Error Details:', errorData);
                } catch {
                    errorMessage = `GitHub API Error (${response.status}): ${response.statusText}`;
                }
                console.error('Git connection test failed:', errorMessage);
                throw new Error(errorMessage);
            }
            
            const repoData = await response.json();
            console.log('Repository connection successful:', repoData.name);
            return true;
        } catch (error) {
            console.error('Git connection test failed:', error);
            throw error; // Re-throw to let the calling function handle it
        }
    }

    // Upload image file to repository
    async uploadImage(file, fileName) {
        try {
            // Ensure images directory exists
            await this.ensureImagesDirectory();
            
            // Convert file to base64
            const base64Content = await this.fileToBase64(file);
            const content = base64Content.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            
            const path = `images/cars/${fileName}`;
            
            // Check if file already exists
            const existing = await this.getFile(path);
            
            const data = {
                message: `Upload image: ${fileName}`,
                content: content,
                sha: existing.sha // Include sha if updating existing file
            };
            
            // Remove sha if file doesn't exist
            if (!existing.sha) {
                delete data.sha;
            }
            
            await this.githubAPI(`contents/${path}`, 'PUT', data);
            console.log(`Image uploaded successfully: ${path}`);
            return path;
        } catch (error) {
            console.error('Failed to upload image:', error);
            throw error;
        }
    }
    
    // Helper to convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
        });
    }

    // Ensure images directory exists with a README
    async ensureImagesDirectory() {
        try {
            const readmePath = 'images/cars/README.md';
            
            // Check if README already exists
            try {
                await this.getFile(readmePath);
                console.log('Images directory already exists');
                return true;
            } catch (error) {
                if (!error.message.includes('404') && !error.message.includes('Not Found')) {
                    throw error;
                }
            }
            
            // Create README file to establish the directory
            const readmeContent = `# Car Images

This directory contains images for the Hot Wheels collection.

Images are automatically uploaded when adding cars through the admin panel.

## Supported Formats
- JPG/JPEG
- PNG
- GIF
- WebP

## Naming Convention
Images are automatically named with the pattern:
\`CarName_timestamp.extension\`

---
*Auto-generated by Hot Wheels Collection System*
`;
            
            // Encode content as base64
            const encodedContent = btoa(readmeContent);
            
            await this.githubAPI(`contents/${readmePath}`, 'PUT', {
                message: 'Create images directory with README',
                content: encodedContent
            });
            
            console.log('Images directory created successfully');
            return true;
        } catch (error) {
            console.error('Failed to create images directory:', error);
            return false;
        }
    }

    // Test function to verify Git storage
    async testGitStorageOperations() {
        console.log('Testing Git storage operations...');
        try {
            // Test directory creation
            await this.ensureImagesDirectory();
            
            // Test saving a simple file
            const testData = {
                test: true,
                timestamp: new Date().toISOString(),
                message: 'Git storage test'
            };
            
            await this.saveFile(
                'data/test.json',
                testData,
                'Test Git storage functionality',
                null
            );
            
            console.log('Git storage test completed successfully');
            return true;
        } catch (error) {
            console.error('Git storage test failed:', error);
            return false;
        }
    }
}

// Initialize Git storage manager
window.gitStorage = new GitStorageManager();
