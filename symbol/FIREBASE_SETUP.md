# 🔥 Firebase Storage Setup Guide

## 📋 Overview

This guide helps you setup Firebase Storage for video recording uploads in the Symbol Mobile App.

## 🚀 Setup Steps

### 1. Create `.env` file in symbol folder

Create a `.env` file in the `symbol/` directory with your Firebase credentials:

```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=YOUR_ACTUAL_API_KEY_HERE
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=mern-blog-b3bb7.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=mern-blog-b3bb7
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=mern-blog-b3bb7.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=487857685902
EXPO_PUBLIC_FIREBASE_APP_ID=1:487857685902:web:33a3a38b0bea9a201010df

# Backend API URL
EXPO_PUBLIC_API_URL=https://symbolgame.onrender.com
```

### 2. Get Firebase API Key

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project (`mern-blog-b3bb7`)
3. Go to Project Settings (gear icon)
4. Scroll down to "Your apps" section
5. Find your web app config
6. Copy the `apiKey` value
7. Replace `YOUR_ACTUAL_API_KEY_HERE` in `.env` file

### 3. Setup Firebase Storage Rules

In Firebase Console > Storage > Rules, update to:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload videos to their folder
    match /videos/{userId}/{fileName} {
      allow read, write: if request.auth != null;
    }

    // Allow public read access to videos (for playback)
    match /videos/{allPaths=**} {
      allow read;
    }
  }
}
```

### 4. Initialize Firebase in your app

The Firebase configuration is already setup in:

- `symbol/config/firebase.js` - Firebase initialization
- `symbol/services/firebaseStorage.js` - Video upload service

## 📱 How it Works

### Video Upload Flow

1. **Record Video**: User records gameplay video (max 10 seconds)
2. **Upload to Firebase**: Video uploaded to `videos/{userId}/game_recording_{sessionId}_{timestamp}.mp4`
3. **Get URL**: Firebase returns download URL
4. **Save to Database**: URL saved in game completion API call

### File Organization

```
Firebase Storage Structure:
└── videos/
    └── {userId}/
        ├── game_recording_123_1641234567890.mp4
        ├── game_recording_456_1641234567891.mp4
        └── ...
```

## 🔧 Storage Optimization

### Video Compression Settings

- **Max Duration**: 10 seconds (configurable)
- **Format**: MP4 only
- **Max Size**: ~3-5MB per video (auto-compressed)
- **Cleanup**: Auto-delete videos older than 6 months

### Cost Estimation (Firebase Storage)

- **Free Tier**: 5GB storage, 1GB/day download
- **Paid Tier**: $0.026/GB/month storage, $0.12/GB download
- **Estimated**: ~100,000 videos (3MB each) = 300GB = ~$8/month

## 🚨 Troubleshooting

### Common Issues

1. **"Firebase access denied"**

   - Check Storage Rules are correctly set
   - Ensure user is authenticated
   - Verify API key in `.env`

2. **"Upload failed"**

   - Check internet connection
   - Verify Firebase project ID
   - Check storage quota (5GB free limit)

3. **"Invalid video format"**
   - Ensure video is MP4 format
   - Check video duration < 10 seconds
   - Verify file size < 5MB

### Debug Commands

```bash
# Check Firebase config
npx expo start --clear

# Check environment variables
console.log(process.env.EXPO_PUBLIC_FIREBASE_API_KEY)

# Check Firebase connection
console.log(firebase.apps.length) // Should be > 0
```

## 📊 Benefits vs Local Storage

| Feature         | Local Storage | Firebase Storage |
| --------------- | ------------- | ---------------- |
| **Server Load** | High          | Zero             |
| **Disk Usage**  | 2TB limit     | Unlimited (paid) |
| **CDN**         | No            | Global CDN       |
| **Backup**      | Manual        | Automatic        |
| **Cost**        | Server costs  | $8-20/month      |
| **Scalability** | Limited       | Unlimited        |

## 🎯 Next Steps

1. ✅ Setup Firebase config
2. ✅ Create `.env` file
3. ✅ Test video upload
4. 🔲 Monitor storage usage
5. 🔲 Setup automated cleanup
6. 🔲 Configure CDN caching

For support, check the Firebase [documentation](https://firebase.google.com/docs/storage) or contact the development team.
