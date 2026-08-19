# EEG Dashboard Desktop App Setup

This guide explains how to create a downloadable desktop version of the EEG Dashboard.

## Option 1: Progressive Web App (PWA) - Recommended

The easiest way to install the EEG Dashboard as a desktop app:

### Installation Steps:
1. Open the EEG Dashboard in Chrome, Edge, or Safari
2. Look for the "Install" button in the address bar
3. Click "Install" to add it to your desktop
4. The app will now work offline and appear in your applications

### Features:
- Works offline after initial load
- Desktop shortcuts and app icon
- Native file system access for exports
- Background sync for data processing
- Push notifications for alerts

## Option 2: Electron Desktop App

For a full native desktop experience with Bluetooth support:

### Prerequisites:
- Node.js 18+ installed
- Git installed

### Build Instructions:

1. **Clone and Setup:**
\`\`\`bash
git clone <your-repo-url>
cd eeg-dashboard
npm install
\`\`\`

2. **Build the Next.js App:**
\`\`\`bash
npm run build
npm run export
\`\`\`

3. **Setup Electron:**
\`\`\`bash
cd electron
npm install
\`\`\`

4. **Development Mode:**
\`\`\`bash
# Terminal 1: Start Next.js dev server
npm run dev

# Terminal 2: Start Electron
cd electron
npm start
\`\`\`

5. **Build Desktop App:**
\`\`\`bash
cd electron

# Build for current platform
npm run build

# Build for specific platforms
npm run build-win    # Windows
npm run build-mac    # macOS
npm run build-linux  # Linux
\`\`\`

### Desktop App Features:
- Native file system access
- Bluetooth connectivity for real NeuroSky devices
- System tray integration
- Keyboard shortcuts
- Auto-updater support
- Offline functionality

## Option 3: Tauri (Lightweight Alternative)

For a more lightweight desktop app:

### Prerequisites:
- Rust installed
- Node.js 18+

### Setup:
\`\`\`bash
# Install Tauri CLI
cargo install tauri-cli

# Initialize Tauri
cargo tauri init

# Build desktop app
cargo tauri build
\`\`\`

## Hardware Connection

### NeuroSky Mindwave Mobile Setup:

1. **Pair Device:**
   - Turn on your NeuroSky Mindwave Mobile
   - Pair it with your computer via Bluetooth
   - Note the COM port (Windows) or device path (Mac/Linux)

2. **Desktop App Connection:**
   - Open the desktop app
   - Go to Settings > Bluetooth
   - Select your NeuroSky device
   - Click "Connect"

3. **Web App Simulation:**
   - The web version uses simulated data
   - Real hardware connection requires the desktop app

## File Structure

\`\`\`
eeg-dashboard/
├── electron/                 # Electron desktop app
│   ├── main.js              # Main Electron process
│   ├── preload.js           # Preload script
│   ├── package.json         # Electron dependencies
│   └── assets/              # App icons and resources
├── public/
│   ├── manifest.json        # PWA manifest
│   ├── sw.js               # Service worker
│   └── icons/              # PWA icons
└── hooks/
    └── use-desktop-features.ts # Desktop integration hook
\`\`\`

## Troubleshooting

### PWA Installation Issues:
- Ensure HTTPS is enabled
- Check browser compatibility
- Clear browser cache and try again

### Electron Build Issues:
- Verify Node.js version (18+)
- Clear node_modules and reinstall
- Check platform-specific build requirements

### Bluetooth Connection Issues:
- Ensure device is paired with OS first
- Check Bluetooth permissions
- Try restarting the Bluetooth service

## Distribution

### PWA:
- Deploy to any web server with HTTPS
- Users can install directly from browser

### Electron:
- Distribute .exe (Windows), .dmg (macOS), or .AppImage (Linux)
- Consider code signing for security
- Use auto-updater for seamless updates

## Support

For issues with the desktop app:
1. Check the troubleshooting section above
2. Review the console logs
3. Open an issue on GitHub with system details
