# Map UX Fixes

## Issues Fixed

### 1. Map Centering on Canada Issue
**Problem:** When navigating away from the map and back, it resets to a position near Canada instead of remembering the user's last view.

**Solution:**
- Added `localStorage` persistence for map position (center + zoom)
- Map now restores to the last viewed position when component remounts
- Position is saved automatically on every pan/zoom action

**Implementation:**
- Stored as JSON: `{ center: [lng, lat], zoom: number }`
- Key: `housing-pulse-map-position`
- Falls back to default US view `[-97, 39]` at zoom 3.8 if no saved position exists

### 2. Vertical Drag Issue
**Problem:** Map bounds were too restrictive, preventing smooth vertical panning.

**Solution:**
- Expanded `maxBounds` from `[[-170, 15], [-50, 72]]` to `[[-180, 10], [-40, 75]]`
- Disabled map rotation features for cleaner UX:
  - `dragRotate: false`
  - `touchZoomRotate: false`

### 3. Added Reset View Button
**Enhancement:** Users can now easily return to the full US view if they pan too far or get disoriented.

**Features:**
- Smooth flyTo animation (1.2s duration)
- Clears saved position so next visit starts fresh
- Positioned at top-left with hover effects
- Refresh icon for visual clarity

## Files Modified

- `housing-pulse/src/components/map/MapboxChoropleth.tsx`

## Testing Recommendations

1. **Test position persistence:**
   - Pan/zoom to a specific location
   - Navigate to another page
   - Return to map
   - Verify map restored to last position

2. **Test vertical dragging:**
   - Try panning vertically near the edges (Canada/Mexico borders)
   - Verify smooth dragging without resistance

3. **Test reset button:**
   - Pan to a zoomed-in location
   - Click "Reset View"
   - Verify smooth flyTo animation back to full US view

## Browser Compatibility

- Uses `localStorage` (supported in all modern browsers)
- Graceful fallback if localStorage is unavailable
- SSR-safe with `typeof window !== 'undefined'` checks

## Future Enhancements

Consider adding:
- User preference to disable auto-restore (always start at US view)
- Multiple saved positions (bookmarks)
- Keyboard shortcut for reset (e.g., `R` key)
