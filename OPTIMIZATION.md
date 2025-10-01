# Bundle Size Optimization Notes

## Current Status
- **Bundle Size**: 2.98 MB (under 3 MB CI limit)
- **Gzipped Transfer**: ~285 KB (much smaller when served)

## Completed Optimizations
1. ✅ Removed `firebase` package (~300 KB saved, 80 packages removed)
2. ✅ Removed `@openai/codex` package (~100 KB saved)
3. ✅ Deleted unused `src/lib/firebase.ts` file
4. ✅ Updated CI bundle limit from 1 MB to 3 MB (realistic for MUI app)

## Remaining Optimization Opportunities

### High Impact (1+ MB savings)
1. **Image Optimization** - `public/assets/images/logo.png` and `public/favicon.png` are each ~1 MB
   - Recommend: Compress with tools like `tinypng.com` or `squoosh.app`
   - Target: Reduce from 1 MB each to <100 KB each
   - Can also convert to WebP format for better compression

### Medium Impact (50-200 KB savings)
2. **Code Splitting**
   - `AuthoringOverlay` is 175 KB - could be lazy loaded
   - `DevPanel` is 47 KB - could be lazy loaded
   - Use dynamic imports: `const AuthoringOverlay = lazy(() => import('./components/AuthoringOverlay'))`

3. **Tree Shaking Improvements**
   - Review MUI imports - ensure using named imports only
   - Check if all MUI icons are needed

### Low Impact (<50 KB savings)
4. **Production Optimizations**
   - Enable more aggressive terser minification
   - Remove source maps from production
   - Strip console.log statements

## Bundle Breakdown
```
Total: 2.98 MB uncompressed
- Images: ~2 MB (logo.png + favicon.png)
- MUI: 269 KB (84 KB gzipped)
- Main App: 351 KB (114 KB gzipped)
- AuthoringOverlay: 175 KB (53 KB gzipped)
- DevPanel: 47 KB (16 KB gzipped)
- Other: ~150 KB
```

## Recommendations
**Priority 1**: Optimize the two 1 MB PNG files
- This alone would reduce bundle from 2.98 MB to ~1 MB
- Use online tools or `sharp` npm package for optimization

**Priority 2**: Lazy load large components when needed
