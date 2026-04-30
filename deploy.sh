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
echo "🏗  Helpshack Tax — Production Build"
echo "======================================"

rm -rf "$DIST"
mkdir -p "$DIST"

echo ""
echo "📦 Building Next.js frontend..."
cd "$FRONTEND"
NEXT_PUBLIC_API_URL=https://tax.careerxera.com npm run build
[ -f "$FRONTEND/public/.htaccess" ] && cp "$FRONTEND/public/.htaccess" "$FRONTEND/out/.htaccess"
echo "✅ Frontend built"

echo ""
echo "📁 Packaging frontend..."
cd "$FRONTEND/out"
zip -r "$DIST/frontend.zip" . -x "*.DS_Store" -x "__MACOSX*"
echo "✅ frontend.zip  ($(du -sh "$DIST/frontend.zip" | cut -f1))"

echo ""
echo "📁 Packaging backend..."
cd "$BACKEND"
zip -r "$DIST/backend.zip" . \
  -x "*.DS_Store" -x "__MACOSX*" -x ".git*" \
  -x "vendor/bin/*" -x "*.log" -x "Archive*" -x "logs/*"
echo "✅ backend.zip   ($(du -sh "$DIST/backend.zip" | cut -f1))"

cp "$BACKEND/production.sql" "$DIST/production.sql"
echo "✅ production.sql → dist/"

cat > "$DIST/DEPLOY_INSTRUCTIONS.txt" << 'INSTRUCTIONS'
====================================================
  Helpshack Tax — cPanel Deployment Instructions
====================================================

STEP 1 — Create MySQL database in cPanel
  cPanel -> MySQL Databases
  • DB Name:  helpshack
  • DB User:  helpshack_user (strong password)
  • Assign user ALL PRIVILEGES

STEP 2 — Import database
  phpMyAdmin: Select DB -> Import -> production.sql -> Go
  OR Terminal: mysql -u <USER> -p <DBNAME> < production.sql

  Includes: 5 roles, 37 permissions, 3 client types
  Default admin: admin@helpshack.com / Admin@123
  CHANGE PASSWORD ON FIRST LOGIN!

STEP 3 — Upload & extract backend
  File Manager -> public_html/api/
  Upload backend.zip -> Extract here

STEP 4 — Configure backend
  Edit public_html/api/config.php:
    DB_HOST      = localhost
    DB_NAME      = <your_db_name>
    DB_USER      = <your_db_user>
    DB_PASS      = <your_db_password>
    JWT_SECRET   = <random 64-char string>
    APP_URL      = https://tax.careerxera.com
  Create: public_html/api/uploads/  (chmod 755)

STEP 5 — Upload & extract frontend
  File Manager -> public_html/
  Upload frontend.zip -> Extract here

STEP 6 — Test
  https://tax.careerxera.com             -> Homepage
  https://tax.careerxera.com/api/health  -> {"status":"ok"}
  https://tax.careerxera.com/login       -> Login
====================================================
INSTRUCTIONS

echo "✅ DEPLOY_INSTRUCTIONS.txt written"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Build complete! Files in: dist/"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
ls -lh "$DIST"
echo ""
echo "📋 Upload order:"
echo "   1. Import  production.sql  -> phpMyAdmin"
echo "   2. Extract backend.zip     -> public_html/api/"
echo "   3. Edit    config.php      (DB creds + JWT_SECRET)"
echo "   4. Extract frontend.zip    -> public_html/"
echo "   5. Open https://tax.careerxera.com/api/health"
echo ""
echo "   Default admin: admin@helpshack.com / Admin@123"
echo "   CHANGE THIS PASSWORD IMMEDIATELY!"
echo ""

# legacy vars kept for compatibility — actual logic above replaced
FRONTEND_DUMMY="$ROOT/frontend"
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
NEXT_PUBLIC_API_URL=https://tax.careerxera.com npm run build

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
