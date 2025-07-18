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
            console.error('Git storage not configured. Config state:', {
                isConfigured: this.isConfigured,
                hasToken: !!this.accessToken,
                hasOwner: !!this.repoOwner,
                hasName: !!this.repoName
            });
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

    // Get binary file (like images) from repository
    async getBinaryFile(path) {
        try {
            const result = await this.githubAPI(`contents/${path}`);
            return {
                content: result.content, // Keep as base64
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
        try {
            const data = {
                message,
                content: btoa(JSON.stringify(content, null, 2))
            };

            // If no SHA provided, try to get the current file's SHA
            if (!sha) {
                try {
                    const existing = await this.getFile(path);
                    if (existing.sha) {
                        data.sha = existing.sha;
                        console.log(`Found existing file at ${path}, using SHA: ${existing.sha}`);
                    }
                } catch (error) {
                    // File doesn't exist yet, which is fine for new files
                    console.log(`File ${path} doesn't exist yet, creating new file`);
                }
            } else {
                data.sha = sha;
            }

            return await this.githubAPI(`contents/${path}`, 'PUT', data);
        } catch (error) {
            console.error(`Failed to save file ${path}:`, error);
            throw error;
        }
    }

    // Load cars from Git repository
    async loadCars() {
        try {
            console.log('gitStorage.loadCars: Starting...');
            const result = await this.getFile('data/cars.json');
            console.log('gitStorage.loadCars: getFile result:', result);
            
            if (result.content && result.content.cars) {
                console.log('gitStorage.loadCars: Found cars array:', result.content.cars.length);
                return result.content.cars;
            } else if (result.content && Array.isArray(result.content)) {
                console.log('gitStorage.loadCars: Found direct array:', result.content.length);
                return result.content;
            }
            
            console.log('gitStorage.loadCars: No valid data found, returning empty array');
            return [];
        } catch (error) {
            console.error('Failed to load cars from Git:', error);
            return [];
        }
    }

    // Save cars to Git repository
    async saveCars(cars) {
        try {
            console.log(`gitStorage.saveCars: Saving ${cars.length} cars to Git repository`);
            const data = {
                cars,
                lastUpdated: new Date().toISOString()
            };
            
            console.log('gitStorage.saveCars: Preparing to save data:', JSON.stringify(data, null, 2).substring(0, 200) + '...');
            
            const result = await this.saveFile(
                'data/cars.json',
                data,
                `Update cars collection - ${new Date().toLocaleString()}`
            );
            
            console.log('gitStorage.saveCars: Save operation completed successfully', result);
            return true;
        } catch (error) {
            console.error('gitStorage.saveCars: Failed to save cars to Git:', error);
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
            const data = {
                wishlist,
                lastUpdated: new Date().toISOString()
            };
            
            await this.saveFile(
                'data/wishlist.json',
                data,
                `Update wishlist - ${new Date().toLocaleString()}`
            );
            
            return true;
        } catch (error) {
            console.error('Failed to save wishlist to Git:', error);
            throw error;
        }
    }

    // Load config from Git repository
    async loadSiteConfig() {
        try {
            const result = await this.getFile('data/config.json');
            return result.content || {};
        } catch (error) {
            console.error('Failed to load config from Git:', error);
            return {};
        }
    }

    // Save config to Git repository
    async saveSiteConfig(config) {
        try {
            await this.saveFile(
                'data/config.json',
                config,
                `Update configuration - ${new Date().toLocaleString()}`
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
            console.log(`Starting image upload: ${fileName}`);
            
            // Ensure images directory exists
            await this.ensureImagesDirectory();
            
            // Convert file to base64
            const base64Content = await this.fileToBase64(file);
            const content = base64Content.split(',')[1]; // Remove data:image/jpeg;base64, prefix
            
            const path = `images/cars/${fileName}`;
            console.log(`Uploading to path: ${path}`);
            
            // Check if file already exists (use binary file method for images)
            const existing = await this.getBinaryFile(path);
            
            const data = {
                message: `Upload image: ${fileName}`,
                content: content
            };
            
            // Include sha if updating existing file
            if (existing.sha) {
                data.sha = existing.sha;
            }
            
            const result = await this.githubAPI(`contents/${path}`, 'PUT', data);
            console.log(`Image uploaded successfully: ${path}`, result);
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
            if (!this.isConfigured) {
                throw new Error('Git storage not configured');
            }

            console.log('Step 1: Testing repository connection...');
            await this.testConnection();
            
            console.log('Step 2: Testing directory creation...');
            await this.ensureImagesDirectory();
            
            console.log('Step 3: Testing file operations...');
            // Test saving a simple file with unique name
            const timestamp = Date.now();
            const testFilePath = `data/test_${timestamp}.json`;
            const testData = {
                test: true,
                timestamp: new Date().toISOString(),
                message: 'Git storage test',
                id: timestamp
            };
            
            await this.saveFile(
                testFilePath,
                testData,
                `Test Git storage functionality - ${new Date().toLocaleString()}`,
                null
            );
            
            console.log('Step 4: Testing file reading...');
            const readBack = await this.getFile(testFilePath);
            if (!readBack.content || !readBack.content.test || readBack.content.id !== timestamp) {
                throw new Error('File read/write test failed - could not read back test data correctly');
            }
            
            console.log('Step 5: Testing file update...');
            const updatedData = {
                ...testData,
                updated: true,
                updateTime: new Date().toISOString()
            };
            
            await this.saveFile(
                testFilePath,
                updatedData,
                'Test file update functionality',
                readBack.sha
            );
            
            console.log('Git storage test completed successfully');
            return true;
        } catch (error) {
            console.error('Git storage test failed:', error);
            throw error; // Re-throw so admin panel can show the specific error
        }
    }

    // Test image upload functionality
    async testImageUpload() {
        try {
            // Create a small test image (1x1 pixel PNG)
            const testImageData = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
            
            // Convert data URL to blob
            const response = await fetch(testImageData);
            const blob = await response.blob();
            const file = new File([blob], 'test-image.png', { type: 'image/png' });
            
            console.log('Testing image upload...');
            const path = await this.uploadImage(file, `test_image_${Date.now()}.png`);
            console.log('Test image uploaded successfully to:', path);
            return { success: true, path };
        } catch (error) {
            console.error('Test image upload failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete image file from repository
    async deleteImage(imagePath) {
        try {
            if (!imagePath || !imagePath.startsWith('images/cars/')) {
                console.log('No image to delete or invalid path:', imagePath);
                return true; // Not an error, just no image to delete
            }

            console.log(`Attempting to delete image: ${imagePath}`);
            
            // Get the current file to get its SHA
            const existing = await this.getBinaryFile(imagePath);
            if (!existing.sha) {
                console.log('Image file not found in repository:', imagePath);
                return true; // File doesn't exist, which is fine
            }

            // Delete the file
            await this.githubAPI(`contents/${imagePath}`, 'DELETE', {
                message: `Delete image: ${imagePath}`,
                sha: existing.sha
            });

            console.log(`Image deleted successfully: ${imagePath}`);
            return true;
        } catch (error) {
            console.error('Failed to delete image:', error);
            // Don't throw error for image deletion failures, just log them
            return false;
        }
    }
}

// Initialize Git storage manager
window.gitStorage = new GitStorageManager();
