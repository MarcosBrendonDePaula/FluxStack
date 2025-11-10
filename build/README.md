# Build Resources

This directory contains resources needed for building Electron applications.

## 📦 Required Files

### Icons

Place your application icons here for each platform:

#### macOS
- `icon.icns` - macOS icon file (1024x1024)
- Can be generated from a PNG using tools like [png2icns](https://github.com/idesis-gmbh/png2icns)

#### Windows
- `icon.ico` - Windows icon file (256x256)
- Can be generated from a PNG using tools like [ImageMagick](https://imagemagick.org/)

#### Linux
Create an `icons/` directory with multiple sizes:
- `icons/16x16.png`
- `icons/32x32.png`
- `icons/48x48.png`
- `icons/64x64.png`
- `icons/128x128.png`
- `icons/256x256.png`
- `icons/512x512.png`

### Example Structure

```
build/
├── README.md (this file)
├── icon.icns           # macOS
├── icon.ico            # Windows
├── icons/              # Linux
│   ├── 16x16.png
│   ├── 32x32.png
│   ├── 48x48.png
│   ├── 64x64.png
│   ├── 128x128.png
│   ├── 256x256.png
│   └── 512x512.png
└── resources/          # Extra resources
```

## 🛠️ Generating Icons

### From a Single PNG

1. **Install dependencies**:
```bash
# macOS/Linux
brew install imagemagick

# Or download from: https://imagemagick.org/
```

2. **Generate all icons**:
```bash
# Create a 1024x1024 PNG first (icon.png)

# macOS (.icns)
mkdir icon.iconset
sips -z 16 16     icon.png --out icon.iconset/icon_16x16.png
sips -z 32 32     icon.png --out icon.iconset/icon_16x16@2x.png
sips -z 32 32     icon.png --out icon.iconset/icon_32x32.png
sips -z 64 64     icon.png --out icon.iconset/icon_32x32@2x.png
sips -z 128 128   icon.png --out icon.iconset/icon_128x128.png
sips -z 256 256   icon.png --out icon.iconset/icon_128x128@2x.png
sips -z 256 256   icon.png --out icon.iconset/icon_256x256.png
sips -z 512 512   icon.png --out icon.iconset/icon_256x256@2x.png
sips -z 512 512   icon.png --out icon.iconset/icon_512x512.png
sips -z 1024 1024 icon.png --out icon.iconset/icon_512x512@2x.png
iconutil -c icns icon.iconset

# Windows (.ico)
convert icon.png -define icon:auto-resize=256,128,96,64,48,32,16 icon.ico

# Linux (PNG)
mkdir -p icons
convert icon.png -resize 16x16 icons/16x16.png
convert icon.png -resize 32x32 icons/32x32.png
convert icon.png -resize 48x48 icons/48x48.png
convert icon.png -resize 64x64 icons/64x64.png
convert icon.png -resize 128x128 icons/128x128.png
convert icon.png -resize 256x256 icons/256x256.png
convert icon.png -resize 512x512 icons/512x512.png
```

### Using Online Tools

- [favicon.io](https://favicon.io/) - Generate icons from text, image, or emoji
- [icoconvert.com](https://icoconvert.com/) - Convert PNG to ICO
- [cloudconvert.com](https://cloudconvert.com/) - Convert to ICNS

## 📝 Notes

- Without custom icons, electron-builder will use default icons
- Icons should have transparent backgrounds
- High resolution (1024x1024) source recommended
- Square aspect ratio required

## 🔗 Resources

- [electron-builder Icons](https://www.electron.build/icons)
- [Electron Icon Guidelines](https://www.electronjs.org/docs/latest/tutorial/application-distribution#application-icon)
