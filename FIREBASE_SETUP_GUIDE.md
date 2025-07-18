# Firebase Setup Guide for Hot Wheels Collection

This guide will help you set up Firebase for your Hot Wheels Collection website to enable permanent data storage and real-time sync.

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Create a project"
3. Enter project name: `hotwheels-collection` (or your choice)
4. Disable Google Analytics (not needed)
5. Click "Create project"

### Step 2: Enable Firestore Database
1. In your Firebase project, click "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" (we'll secure it later)
4. Select a location close to you
5. Click "Done"

### Step 3: Enable Authentication
1. Click "Authentication" in the left sidebar
2. Click "Get started"
3. Go to "Sign-in method" tab
4. Enable "Email/Password"
5. Click "Save"

### Step 4: Enable Storage
1. Click "Storage" in the left sidebar
2. Click "Get started"
3. Accept the default security rules
4. Choose same location as Firestore
5. Click "Done"

### Step 5: Get Configuration
1. Click the gear icon (⚙️) → "Project settings"
2. Scroll down to "Your apps"
3. Click the web icon `</>`
4. Enter app nickname: `Hot Wheels Collection`
5. Click "Register app"
6. Copy the configuration values:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyD...",           // Copy this
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",   // Copy this
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

### Step 6: Configure in Your Website
1. Open your Hot Wheels Collection admin panel
2. Go to Settings tab
3. Fill in the Firebase configuration:
   - **API Key**: Your `apiKey` value
   - **Project ID**: Your `projectId` value
   - **Auth Domain**: Your `authDomain` value
   - **Storage Bucket**: Your `storageBucket` value
   - **Messaging Sender ID**: Your `messagingSenderId` value
   - **App ID**: Your `appId` value
4. Click "Test Connection" to verify
5. Click "Setup Firebase"

## 🔐 Security Rules (Important!)

After setup, secure your database:

### Firestore Rules
1. Go to Firestore Database → Rules
2. Replace with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules
1. Go to Storage → Rules
2. Replace with:
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only access their own car images
    match /cars/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 📊 Data Structure

Your data will be organized as:
```
users/
├── {userId}/
│   ├── profile (user settings)
│   ├── cars/{carId} (car collection)
│   └── wishlist/{itemId} (wishlist items)
```

## 🎯 Benefits

✅ **Real-time sync** across all devices  
✅ **Automatic backups** by Google  
✅ **Image storage** with CDN  
✅ **Offline support** (data cached locally)  
✅ **Free tier** (50K reads, 20K writes/day)  
✅ **Secure** (user-specific data access)  

## 🆘 Troubleshooting

### "Permission denied" errors
- Check that Firestore rules are set correctly
- Verify user is authenticated

### "Failed to load config"
- Ensure firebase-config.json has correct values
- Check for typos in configuration

### "Storage upload failed"
- Verify Storage rules allow user access
- Check file size (max 5MB per image)

### Connection issues
- Verify internet connection
- Check browser console for detailed errors
- Ensure Firebase project is active

## 💡 Tips

- **Free Quota**: 50K reads + 20K writes/day is plenty for personal use
- **Images**: Automatically optimized and served from CDN
- **Backup**: Export data regularly from admin panel
- **Multiple Users**: Each user gets their own isolated data
- **Real-time**: Changes sync instantly across devices

## 🔄 Migration from Git Storage

If you were using Git storage:
1. Complete Firebase setup
2. Export your data from the old system
3. Import it in the admin panel after Firebase is configured
4. Your images will be automatically migrated

---

**Need help?** Check the browser console for detailed error messages or create an issue on GitHub.
