# Hot Wheels Collection - Image Setup Guide

This guide will help you set up permanent image storage for your Hot Wheels collection using GitHub.

## Prerequisites

1. A GitHub account
2. A private GitHub repository for your collection data
3. A personal access token with repository permissions

## Step 1: Create GitHub Repository

1. Go to https://github.com and sign in
2. Click "New repository" or go to https://github.com/new
3. Name your repository (e.g., "hotwheels-collection-data")
4. Make it **Private** (recommended for personal collections)
5. Initialize with README (optional)
6. Click "Create repository"

## Step 2: Generate Personal Access Token

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a descriptive name (e.g., "Hot Wheels Collection App")
4. Set expiration as needed (recommend 1 year)
5. Select these scopes:
   - `repo` (Full control of private repositories)
6. Click "Generate token"
7. **Copy the token immediately** (you won't see it again)

## Step 3: Configure Git Storage in Admin Panel

1. Open your Hot Wheels Collection website
2. Go to Admin Panel → Settings tab
3. In the "Git Storage Configuration" section:
   - **Repository Owner**: Your GitHub username
   - **Repository Name**: Name of the repository you created
   - **Access Token**: The token you generated
4. Click "Save Git Configuration"
5. Test the connection using the "Test Git Storage" button

## Step 4: Test Image Upload

1. Go to Admin Panel → Add Car tab
2. Fill in car details (Name and Brand are required)
3. Select an image file (JPEG, PNG, etc.)
4. Click "Add Car"
5. You should see a success message indicating the data was saved to Git repository

## Step 5: Verify Image Display

1. Go to the main Collection page
2. Your car should be displayed with the uploaded image
3. The image URL should be a GitHub raw URL (https://raw.githubusercontent.com/...)

## Troubleshooting

### Images not displaying
- Check that Git storage is properly configured in Settings
- Verify your access token has `repo` permissions
- Make sure the repository exists and is accessible
- Check browser console for error messages

### Image upload fails
- Verify internet connection
- Check that your access token is valid and not expired
- Ensure the repository name and owner are correct
- Try with a smaller image file (< 25MB GitHub limit)

### Configuration not saving
- Make sure you click "Save Git Configuration"
- Check that all fields (owner, repo, token) are filled
- Try refreshing the page and reconfiguring

## Image Storage Details

- Images are uploaded to `images/cars/` folder in your repository
- Filenames are automatically generated with timestamps
- Images are permanently stored in your private repository
- Displayed using GitHub's raw content URLs
- Works on both localhost and GitHub Pages deployment

## Security Notes

- Keep your access token private
- Use a private repository for personal collections
- Tokens can be revoked/regenerated if compromised
- Your collection data stays in your own repository

## Support

If you encounter issues, check the browser console for error messages and verify all configuration steps above.
