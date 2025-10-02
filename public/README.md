# FluxStack Public Directory

This directory serves static files via the static-files plugin.

## Available Routes:
- `/api/static/*` - Serves files from this directory
- `/api/uploads/*` - Serves uploaded files

## Example:
- Put `logo.png` here to access it at `/api/static/images/logo.png`

## Features:
- Automatic MIME type detection
- Cache headers (1 year default)
- Security headers
- Path traversal protection