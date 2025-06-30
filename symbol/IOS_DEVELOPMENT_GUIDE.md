# iOS Development Guide (Windows)

## 🍎 Running Your Symbol App on iOS from Windows

Since iOS development requires Xcode (macOS only), we use **Expo tunneling** for iOS testing on Windows.

## 🚀 Quick Start

### 1. Start Development Server

```bash
npx expo start --tunnel --clear
```

### 2. Install Expo Go

- Download from App Store on your iPhone
- Open the app and sign in (optional)

### 3. Connect Device

- **Option A**: Scan QR code with iPhone camera
- **Option B**: Scan QR code with Expo Go app
- **Option C**: Enter the tunnel URL manually in Expo Go

### 4. Development Workflow

- Make code changes in your editor
- App automatically reloads on iPhone
- Check console logs in terminal

## 🔧 Network Configuration

### Current Setup:

- **Socket Config**: Uses production server (`symbolgame.onrender.com`)
- **API Endpoints**: Points to production backend
- **Tunneling**: Enabled for Windows development

### Why Tunnel is Required:

- Windows doesn't support iOS Simulator
- Local network might block device connections
- Firewall/router configuration issues
- Different network segments

## 📱 Testing Features

### What Works via Tunnel:

✅ All React Native components  
✅ API calls to backend  
✅ Socket.IO real-time features  
✅ Navigation and routing  
✅ Authentication flow  
✅ Game functionality  
✅ Hot reloading

### Performance Notes:

- Slightly slower than local development
- Requires stable internet connection
- API calls work normally (using production server)

## 🛠️ Troubleshooting

### If QR Code Doesn't Work:

1. Ensure both devices have internet
2. Try manual URL entry in Expo Go
3. Restart tunnel with `--clear` flag
4. Check firewall settings

### If App Crashes:

1. Check terminal for error logs
2. Ensure all dependencies are installed
3. Clear Metro cache: `npx expo start --tunnel --clear`
4. Restart development server

### Common Commands:

```bash
# Start with tunnel
npx expo start --tunnel

# Clear cache and start
npx expo start --tunnel --clear

# Check for issues
npx expo-doctor

# Update dependencies
npx expo install --fix
```

## 🎯 Next Steps

For production iOS builds, you'll need:

- Apple Developer Account ($99/year)
- macOS machine or cloud service (like MacStadium)
- Xcode for final builds and App Store submission

For now, tunnel development gives you full testing capabilities! 🚀
