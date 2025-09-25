#!/bin/bash

# 🚀 FluxStack CLI Publication Script
# Este script automatiza a publicação do create-fluxstack no NPM

set -e

echo "⚡ FluxStack CLI Publication Setup"
echo "================================"

# Check if we're in the right directory
if [[ ! -f "create-fluxstack.ts" ]]; then
    echo "❌ create-fluxstack.ts not found. Run this script from FluxStack root directory."
    exit 1
fi

echo "📋 Pre-publication checklist:"
echo ""

# 1. Test CLI
echo "🧪 Testing CLI..."
if ./create-fluxstack.ts test-publish-app --no-install --no-git; then
    echo "✅ CLI test passed"
    rm -rf test-publish-app
else
    echo "❌ CLI test failed"
    exit 1
fi

# 2. Setup package.json for publication
echo "📦 Setting up package.json..."
cp package-cli.json package.json.publish
echo "✅ Package configuration ready"

# 3. Setup README for publication
echo "📖 Setting up README..."
cp README-CLI.md README.publish.md
echo "✅ README ready"

echo ""
echo "🎯 Ready to publish! Next steps:"
echo ""
echo "1. Review files:"
echo "   - package.json.publish"
echo "   - README.publish.md"
echo "   - create-fluxstack.ts"
echo ""
echo "2. Publish to NPM:"
echo "   cp package.json.publish package.json"
echo "   cp README.publish.md README.md"
echo "   npm login"
echo "   npm publish"
echo ""
echo "3. Or create GitHub release:"
echo "   git add ."
echo "   git commit -m 'feat: create-fluxstack CLI v1.0.0'"
echo "   git tag v1.0.0"
echo "   git push origin main --tags"
echo ""
echo "4. Test installation:"
echo "   bunx create-fluxstack my-test-app"
echo ""
echo "🚀 Ready to make FluxStack available to the world!"