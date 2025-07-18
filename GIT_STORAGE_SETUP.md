# Git Storage Setup Guide for Hot Wheels Collection

This guide will help you set up permanent data storage for your Hot Wheels Collection website using a private GitHub repository.

## 🔒 Security First

**Important**: Your data will be stored in a private GitHub repository. While the password is encrypted, it's still recommended to:
- Keep your repository private
- Use a strong, unique password for your collection
- Never share your GitHub access token
- Regularly review repository access

## 📋 Step-by-Step Setup

### Step 1: Create a Private Data Repository

1. **Go to GitHub** and log in to your account
2. **Click "New repository"** (green button)
3. **Repository settings**:
   - Name: `hotwheels-data` (or any name you prefer)
   - Description: `Private data storage for Hot Wheels Collection`
   - Visibility: **🔒 Private** (IMPORTANT!)
   - Initialize with README: ✅ (optional)
4. **Click "Create repository"**

### Step 2: Generate Personal Access Token

1. **Go to GitHub Settings**:
   - Click your profile picture → Settings
   - Scroll down to "Developer settings" (left sidebar)
   - Click "Personal access tokens" → "Tokens (classic)"

2. **Generate new token**:
   - Click "Generate new token (classic)"
   - Note: `Hot Wheels Collection Data Access`
   - Expiration: Choose your preference (90 days recommended)
   - Scopes: ✅ Check "repo" (Full control of private repositories)

3. **Copy the token**: Starts with `ghp_` - save it securely!

### Step 3: Configure in Admin Panel

1. **Open your Hot Wheels Collection website**
2. **Go to Admin panel** → Settings tab
3. **Find "Git Storage Configuration" section**
4. **Fill in the details**:
   - Repository Owner: Your GitHub username
   - Repository Name: `hotwheels-data` (or whatever you named it)
   - Access Token: Paste the `ghp_` token you copied

5. **Test Connection**: Click "Test Connection" button
6. **Setup Git Storage**: If test succeeds, click "Setup Git Storage"

## 🔄 How It Works

### Data Flow
```
Add Car in Admin → Save to Git Repository → Permanent Storage
                ↓
            Also saves to localStorage (backup)
```

### What Gets Stored
Your private repository will contain:
```
📁 data/
├── 📄 cars.json       (Your car collection data)
├── 📄 wishlist.json   (Your wishlist data)
└── 📄 config.json     (Encrypted settings & password)
```

### Automatic Backups
- Every time you add/edit/delete a car → Automatic commit to your repository
- Every wishlist change → Automatic commit
- Settings changes → Automatic commit

## 🌐 Multi-Device Access

Once set up, your data will be available on any device where you:
1. Access your Hot Wheels Collection website
2. Set up the same Git storage configuration
3. Your data will automatically sync!

## 🔧 Troubleshooting

### "Connection failed" Error
- ✅ Check repository name and owner are correct
- ✅ Verify access token has "repo" permissions
- ✅ Ensure repository is created and accessible
- ✅ Check token hasn't expired

### "Permission denied" Error
- ✅ Make sure token has "repo" scope selected
- ✅ Verify you're the owner of the repository
- ✅ Check repository is private (not public)

### Data Not Syncing
- ✅ Check browser console for errors (F12)
- ✅ Verify Git storage status shows "Connected"
- ✅ Test connection again in settings

## 🔐 Security Best Practices

1. **Repository Privacy**: Always keep your data repository private
2. **Token Security**: Never share your access token with anyone
3. **Regular Review**: Periodically check repository access logs
4. **Token Rotation**: Consider regenerating tokens every 90 days
5. **Strong Passwords**: Use a unique, strong password for your collection

## 📱 Backup Strategy

Even with Git storage, it's good to have multiple backups:

1. **Primary**: Git repository (automatic)
2. **Secondary**: Export data files monthly (Settings → Export Data)
3. **Tertiary**: Browser localStorage (automatic fallback)

## 🆘 Need Help?

If you encounter issues:
1. Check the browser console (F12) for error messages
2. Verify all setup steps were followed correctly
3. Test with a new access token if connection fails
4. Ensure your repository remains private

---

**Remember**: This setup gives you permanent, cross-device data storage while maintaining your privacy and security! 🚗✨
