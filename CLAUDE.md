# MHAZ Development Guide

## Known Issues & Solutions

### Next.js Manifest Corruption (500 Errors)

**Problem**: Next.js development server occasionally corrupts build manifest files, causing 500 errors.

**Symptoms**:
- 500 error in browser
- Console errors about missing `_buildManifest.js` files or `app-build-manifest.json`
- ENOENT errors in terminal

**Solutions** (in order of preference):

1. **Quick Clean Restart**:
   ```bash
   npm run dev:clean
   ```

2. **Full Reset Script** (Stable Mode - Recommended):
   ```bash
   npm run dev:reset
   # or directly: ./dev-reset.sh
   ```

3. **Manual Reset**:
   ```bash
   pkill -f "next dev"
   rm -rf .next .swc
   npm run dev
   ```

4. **Nuclear Reset** (if persistent issues):
   ```bash
   rm -rf .next .swc node_modules
   npm install
   npm run dev
   ```

### Development Commands

- `npm run dev` - Standard dev server (stable mode - recommended)
- `npm run dev:turbo` - Turbopack dev server (experimental, prone to manifest corruption)
- `npm run dev:clean` - Clean restart (removes .next and .swc)
- `npm run dev:reset` - Full reset script (defaults to stable mode)
- `./dev-reset.sh turbo` - Reset and start with Turbopack (not recommended)
- `npm run build` - Production build
- `npm run lint` - Linting

### Project Structure

- **Fixed Navigation**: Top header and secondary navigation are position:fixed
- **Responsive Design**: Full width on mobile, max 1500px centered on desktop
- **Modal Layout**: Uses `.modal-container`, `.modal-content`, `.modal-footer` classes
- **Content Padding**: Main content has 128px top padding (64px header + 64px secondary nav)

### Business Rules

- **Alert Status**: Only Trail alerts have Active/Resolved status labels
- **LEO Alerts**: Law enforcement alerts have no status (they're informational)
- **Citation Alerts**: Citation alerts have no status (they're historical records)
- **Resolve Functionality**: Only Trail alerts can be marked as resolved
- **Show in Map View Button**: Only appears when viewing alert from list view (not from map view)

### Alert Resolution Process

1. "Mark as Resolved" button appears only for Active Trail alerts
2. Click shows confirmation dialog
3. "Resolve" button persists change to database with loading indicator
4. Local state updates only after successful database update
5. Alert status changes from "Active" to "Resolved"

### CSS Classes & Z-Index Hierarchy

- `.app-container` - Responsive container (full width mobile, max 1500px desktop)
- `.fixed-header` - Fixed top navigation (z-index: 1000)
- `.fixed-secondary-nav` - Fixed secondary navigation (z-index: 999)
- `.fixed-footer` - Fixed bottom navigation (z-index: 1000)
- `.main-content` - Main content area with proper padding
- `.modal-container` - Full-screen modal container (z-index: 1100)
- `.modal-content` - Scrollable modal content
- `.modal-footer` - Fixed modal footer (z-index: 1101)
- Dropdowns and overlays (z-index: 1050-1060) - Above fixed navigation
- User menu (z-index: 1055) - Above dropdowns

### Modal Navigation

- All modal headers have enhanced back buttons with better visibility
- Back buttons are larger (40x40px minimum) with rounded hover states
- Modal z-indexes are higher than fixed navigation to prevent overlap
- All modals support proper navigation flow

### Testing Commands

Always run these after making changes:
```bash
npm run build  # Test production build
npm run lint   # Check for linting issues
```