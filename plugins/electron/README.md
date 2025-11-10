# 🖥️ FluxStack Electron Plugin

Build **cross-platform desktop applications** with Electron for Windows, macOS, and Linux using your FluxStack application.

## ✨ Features

- 🚀 **One Command Build** - Build executables for all platforms
- ⚡ **Hot Reload Dev Mode** - Develop with instant feedback
- 🔒 **Secure by Default** - Context isolation and preload scripts
- 📦 **Auto Packaging** - electron-builder integration
- 🎨 **Customizable** - Full control over window, build, and app settings
- 🛡️ **Type Safe** - Full TypeScript support with type inference
- 🔧 **Declarative Config** - Configure via environment variables

## 📦 Installation

The Electron plugin is included with FluxStack. To enable it:

### 1. Install Dependencies

```bash
cd plugins/electron
bun install
```

### 2. Enable the Plugin

Create a `.env` file in your project root (if not exists):

```bash
# Enable Electron
ELECTRON_ENABLED=true

# Application Settings
ELECTRON_PRODUCT_NAME="My FluxStack App"
ELECTRON_APP_ID=com.mycompany.myapp

# Window Settings
ELECTRON_WINDOW_WIDTH=1280
ELECTRON_WINDOW_HEIGHT=720
ELECTRON_MIN_WIDTH=800
ELECTRON_MIN_HEIGHT=600

# Build Settings
ELECTRON_OUTPUT_DIR=dist-electron
ELECTRON_ASAR=true
ELECTRON_COMPRESSION=normal

# Development
ELECTRON_DEV_TOOLS=true

# Security (recommended defaults)
ELECTRON_NODE_INTEGRATION=false
ELECTRON_CONTEXT_ISOLATION=true
ELECTRON_REMOTE_MODULE=false
```

### 3. Register the Plugin

In your `app/server/index.ts`:

```typescript
import { electronPlugin } from '@/plugins/electron'

const app = new Elysia()
  // ... your other plugins
  .use(electronPlugin)
  // ... rest of your app
```

## 🚀 Usage

### Development Mode

**One command to rule them all:**

```bash
# Start everything automatically (backend + Electron)
bun run dev:electron
```

That's it! This command will:
1. ✅ Check if FluxStack dev server is running
2. ✅ Start it automatically if needed (backend + embedded Vite)
3. ✅ Build Electron main process
4. ✅ Open Electron window with your app
5. ✅ Stop everything when you close Electron

**Alternative (if you want separate terminals):**

```bash
# Terminal 1: Start FluxStack dev server manually
bun run dev

# Terminal 2: Start Electron (detects server is already running)
bun run dev:electron
```

**Shortcuts:**

```bash
bun run cli dev:electron
bun run cli electron
```

**Important:** FluxStack runs Vite **embedded** on the backend port (default 3000), not standalone on 5173. Electron automatically connects to the correct port.

**Options:**
```bash
# Enable Node.js debugger
bun run dev:electron --inspect

# Custom port (if you changed FluxStack's PORT in .env)
bun run dev:electron --port=3001
```

### Build Desktop Application

Build executables for your platform:

```bash
bun run cli build:electron
```

**Platform-specific builds:**

```bash
# Build for Windows
bun run cli build:electron --platform=win32

# Build for macOS (Intel + Apple Silicon)
bun run cli build:electron --platform=darwin

# Build for Linux
bun run cli build:electron --platform=linux

# Build for all platforms
bun run cli build:electron --platform=all
```

**Architecture-specific builds:**

```bash
# Build for x64
bun run cli build:electron --arch=x64

# Build for ARM64 (Apple Silicon, ARM Windows)
bun run cli build:electron --arch=arm64

# Build for all architectures
bun run cli build:electron --arch=all
```

**Other options:**

```bash
# Build unpacked directory (faster for testing)
bun run cli build:electron --dir

# Publish build (requires publish config)
bun run cli build:electron --publish
```

### Output

Built applications are located in the `dist-electron/` directory:

```
dist-electron/
├── win-unpacked/           # Windows unpacked
├── mac/                    # macOS unpacked
├── linux-unpacked/         # Linux unpacked
├── My App Setup 1.0.0.exe  # Windows installer
├── My App-1.0.0.dmg        # macOS disk image
└── My App-1.0.0.AppImage   # Linux AppImage
```

## ⚙️ Configuration

### Environment Variables

All configuration is done via environment variables (`.env` file):

| Variable | Type | Default | Description |
|----------|------|---------|-------------|
| `ELECTRON_ENABLED` | boolean | `true` | Enable/disable plugin |
| `ELECTRON_PRODUCT_NAME` | string | `"FluxStack App"` | Application display name |
| `ELECTRON_APP_ID` | string | `"com.fluxstack.app"` | App ID (reverse domain) |
| `ELECTRON_WINDOW_WIDTH` | number | `1280` | Default window width |
| `ELECTRON_WINDOW_HEIGHT` | number | `720` | Default window height |
| `ELECTRON_MIN_WIDTH` | number | `800` | Minimum window width |
| `ELECTRON_MIN_HEIGHT` | number | `600` | Minimum window height |
| `ELECTRON_OUTPUT_DIR` | string | `"dist-electron"` | Output directory for builds |
| `ELECTRON_BUILD_DIR` | string | `"build"` | Build resources directory |
| `ELECTRON_DEV_TOOLS` | boolean | `true` | Enable DevTools |
| `ELECTRON_ASAR` | boolean | `true` | Package as ASAR archive |
| `ELECTRON_COMPRESSION` | enum | `"normal"` | Compression level: `store`, `normal`, `maximum` |
| `ELECTRON_NODE_INTEGRATION` | boolean | `false` | Enable Node.js in renderer (not recommended) |
| `ELECTRON_CONTEXT_ISOLATION` | boolean | `true` | Enable context isolation (recommended) |
| `ELECTRON_REMOTE_MODULE` | boolean | `false` | Enable remote module (not recommended) |
| `ELECTRON_MAC_CATEGORY` | string | `"public.app-category.developer-tools"` | macOS app category |
| `ELECTRON_WINDOWS_TARGET` | string | `"nsis"` | Windows target: `nsis`, `portable`, `msi` |
| `ELECTRON_LINUX_TARGET` | string | `"AppImage"` | Linux target: `AppImage`, `deb`, `rpm` |
| `ELECTRON_AUTO_UPDATE` | boolean | `false` | Enable auto-updater |
| `ELECTRON_UPDATE_CHANNEL` | enum | `"stable"` | Update channel: `stable`, `beta`, `alpha` |

### Build Resources

Place your app icons and assets in `build/`:

```
build/
├── icon.icns           # macOS icon (1024x1024)
├── icon.ico            # Windows icon (256x256)
├── icons/              # Linux icons (various sizes)
│   ├── 16x16.png
│   ├── 32x32.png
│   ├── 48x48.png
│   ├── 64x64.png
│   ├── 128x128.png
│   ├── 256x256.png
│   └── 512x512.png
└── resources/          # Extra resources
```

## 🔌 IPC Communication

Communicate between main and renderer processes securely using the preload API.

### In Your React Components

```typescript
// Check if running in Electron
if (window.electron) {
  // Get app version
  const version = await window.electron.invoke('app:version')

  // Get platform info
  const platform = await window.electron.invoke('app:platform')

  // Window controls
  window.electron.send('window:minimize')
  window.electron.send('window:maximize')
  window.electron.send('window:close')

  // Listen for updates
  window.electron.on('app:update', (info) => {
    console.log('Update available:', info)
  })
}
```

### Adding Custom IPC Handlers

#### 1. Add handler in `plugins/electron/electron/main.ts`:

```typescript
ipcMain.handle('my:custom:handler', async (event, arg) => {
  // Do something
  return { success: true, data: arg }
})
```

#### 2. Add channel to allowed list in `plugins/electron/electron/preload.ts`:

```typescript
const ALLOWED_CHANNELS = {
  invoke: ['app:version', 'app:platform', 'my:custom:handler'], // Add here
  send: ['window:minimize', 'window:maximize', 'window:close'],
  on: ['app:update', 'app:notification'],
}
```

#### 3. Use in your app:

```typescript
const result = await window.electron?.invoke('my:custom:handler', { foo: 'bar' })
```

## 🛡️ Security

The plugin follows Electron security best practices:

- ✅ **Context Isolation** enabled by default
- ✅ **Node Integration** disabled by default
- ✅ **Remote Module** disabled by default
- ✅ **Preload Script** with whitelisted IPC channels
- ✅ **Navigation Protection** prevents external navigation
- ✅ **Web View** disabled

### Security Checklist

- [ ] Keep `ELECTRON_CONTEXT_ISOLATION=true`
- [ ] Keep `ELECTRON_NODE_INTEGRATION=false`
- [ ] Keep `ELECTRON_REMOTE_MODULE=false`
- [ ] Only add necessary IPC channels to whitelist
- [ ] Validate all IPC inputs
- [ ] Use Content Security Policy (CSP)
- [ ] Keep Electron up to date
- [ ] Sign your application for distribution

## 📚 Advanced

### Custom electron-builder Configuration

Edit `plugins/electron/electron-builder.yml` for advanced packaging options:

```yaml
# Custom build configuration
mac:
  target:
    - target: dmg
      arch: [x64, arm64]
  hardenedRuntime: true
  entitlements: build/entitlements.mac.plist

win:
  target:
    - target: nsis
      arch: [x64, ia32]
  certificateFile: path/to/cert.pfx
  certificatePassword: ${CERT_PASSWORD}

linux:
  target:
    - target: AppImage
      arch: [x64]
  category: Development
```

### Auto-Updates

To enable auto-updates:

1. Set `ELECTRON_AUTO_UPDATE=true`
2. Configure a publish provider in `electron-builder.yml`:

```yaml
publish:
  - provider: github
    owner: your-username
    repo: your-repo
```

3. The app will check for updates on startup

### Code Signing

For distribution, you'll need to sign your application:

**macOS:**
```bash
# Set environment variables
export CSC_LINK=/path/to/cert.p12
export CSC_KEY_PASSWORD=your-password

bun run cli build:electron --platform=darwin
```

**Windows:**
```bash
# Set environment variables
export CSC_LINK=/path/to/cert.pfx
export CSC_KEY_PASSWORD=your-password

bun run cli build:electron --platform=win32
```

## 🐛 Troubleshooting

### Electron window is blank

- Make sure FluxStack dev server is running (`bun run dev`)
- Check if the frontend URL is correct in `main.ts`
- Open DevTools (Ctrl+Shift+I) to check for errors

### Build fails

- Run `bun run build` first to ensure the app builds correctly
- Check that all dependencies are installed: `cd plugins/electron && bun install`
- Ensure you have the latest Electron version

### TypeScript errors

- Make sure `window.electron` types are imported:
  ```typescript
  import type { ElectronPreloadAPI } from '@/plugins/electron/types'
  ```

### IPC not working

- Verify the channel is whitelisted in `preload.ts`
- Check that the handler exists in `main.ts`
- Look for errors in the Electron console

## 📖 Resources

- [Electron Documentation](https://www.electronjs.org/docs)
- [electron-builder Documentation](https://www.electron.build/)
- [Electron Security Best Practices](https://www.electronjs.org/docs/tutorial/security)

## 🤝 Contributing

Found a bug or want to improve the plugin? Contributions are welcome!

## 📄 License

MIT License - see the FluxStack LICENSE file for details.

---

**Made with ❤️ by the FluxStack Team**
