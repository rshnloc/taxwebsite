#!/bin/zsh
# ============================================================
# deploy.sh — Build and package taxwebsite for cPanel upload
# Usage: ./deploy.sh
# ============================================================

set -e

ROOT="$(cd "$(dirname "$0")" && pwd)"
FRONTEND="$ROOT/frontend"
BACKEND="$ROOT/backend-php"
DIST="$ROOT/dist"

echo ""
echo "🏗  Tax Website — Production Build"
echo "=================================="

# ── 1. Clean dist folder ──────────────────────────────────
rm -rf "$DIST"
mkdir -p "$DIST"

# ── 2. Build Frontend ─────────────────────────────────────
echo ""
echo "📦 Building Next.js frontend..."
echo "   API URL → https://tax.careerxera.com/api"
cd "$FRONTEND"
NEXT_PUBLIC_API_URL=https://tax.careerxera.com/api npm run build

# Copy .htaccess into out/ (next build may overwrite)
cp "$FRONTEND/public/.htaccess" "$FRONTEND/out/.htaccess"

echo "✅ Frontend built → frontend/out/"

# ── 3. Package Frontend zip ───────────────────────────────
echo ""
echo "📁 Packaging frontend..."
cd "$FRONTEND/out"
zip -r "$DIST/frontend.zip" . -x "*.DS_Store" -x "__MACOSX*"
echo "✅ frontend.zip → dist/frontend.zip"

# ── 4. Package Backend zip ────────────────────────────────
echo ""
echo "📁 Packaging backend..."
cd "$BACKEND"
zip -r "$DIST/backend.zip" . \
  -x "*.DS_Store" \
  -x "__MACOSX*" \
  -x ".git*" \
  -x "vendor/bin/*" \
  -x "*.log"
echo "✅ backend.zip  → dist/backend.zip"

# ── 5. Summary ────────────────────────────────────────────
echo ""
echo "🎉 Build complete!"
echo ""
echo "   dist/frontend.zip  → Upload contents to: public_html/  (root of tax.careerxera.com)"
echo "   dist/backend.zip   → Upload contents to: public_html/api/"
echo ""
echo "📋 cPanel Upload Steps:"
echo "   1. Login to cPanel → File Manager"
echo "   2. Navigate to public_html/"
echo "   3. Upload dist/backend.zip  → extract into public_html/api/"
echo "   4. Upload dist/frontend.zip → extract into public_html/"
echo "   5. Run DB migration (see README step below)"
echo ""
echo "🗄  DB Migration (run once via cPanel Terminal or phpMyAdmin):"
echo "   mysql -u <DB_USER> -p <DB_NAME> < public_html/api/schema.sql"
echo ""
