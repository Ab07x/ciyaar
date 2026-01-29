# Mobile Optimization Features

This document outlines all the mobile-specific optimizations implemented in the Fanbroj platform.

## Overview

The platform has been comprehensively optimized for mobile devices with a focus on:
- **Touch-first interactions** with proper touch targets (44x44px minimum)
- **Gesture controls** for video playback and navigation
- **Performance optimization** based on device capabilities
- **Network-aware features** that adapt to connection quality
- **iOS and Android specific** enhancements

---

## CSS Optimizations (`app/mobile-optimizations.css`)

### Safe Area Support
- **iOS Notch support** for iPhone X and newer
- CSS variables for safe area insets
- Classes: `.safe-top`, `.safe-bottom`, `.safe-left`, `.safe-right`

### Touch Optimizations
- **44x44px minimum touch targets** (iOS standard)
- Tap highlight color removed
- Text selection disabled on UI elements
- Touch action manipulation for instant response

### Video Player
- **Inline playback** on iOS (prevents fullscreen takeover)
- Custom controls only (native controls hidden)
- Better touch handling with `touch-action: none`

### Input Fields
- **16px font size** to prevent iOS zoom on focus
- Better touch scrolling in textareas
- Optimized for mobile keyboards

### Performance
- **Hardware acceleration** via translateZ(0)
- Smooth scrolling with `-webkit-overflow-scrolling: touch`
- Overscroll behavior containment
- Content visibility for lazy loading

### Landscape Mode
- Hide non-essential UI in landscape
- Full viewport for video
- Reduced padding
- Dynamic viewport height (dvh) support

### PWA Display Mode
- Special styles when installed as PWA
- Show/hide elements based on standalone mode

---

## React Components

### 1. MobileOptimizedLayout
**File:** `components/mobile/MobileOptimizedLayout.tsx`

Features:
- Pull-to-refresh functionality
- Overscroll prevention
- iOS-specific optimizations
- Touch event handling

Usage:
```tsx
<MobileOptimizedLayout enablePullToRefresh>
  {children}
</MobileOptimizedLayout>
```

### 2. MobileGestures
**File:** `components/player/MobileGestures.tsx`

Features:
- **Swipe left/right** to seek video (±30s max)
- **Swipe up/down** on right side to adjust volume
- **Swipe up/down** on left side for brightness (placeholder)
- Visual feedback with icons and values
- Smooth animations

### 3. OptimizedImage
**File:** `components/mobile/OptimizedImage.tsx`

Features:
- Lazy loading by default
- Blur placeholder
- Responsive sizes
- Error handling
- Loading states
- Automatic format optimization

Usage:
```tsx
<OptimizedImage
  src="/poster.jpg"
  alt="Movie poster"
  aspectRatio="2/3"
  fill
/>
```

### 4. TouchFeedback
**File:** `components/mobile/TouchFeedback.tsx`

Features:
- Visual feedback (scale, ripple)
- Haptic feedback (vibration)
- Double-tap detection
- Long press detection
- Better mobile UX

Usage:
```tsx
<TouchFeedback
  onTap={() => console.log('Tap')}
  onDoubleTap={() => console.log('Double tap')}
  onLongPress={() => console.log('Long press')}
  haptic
  ripple
>
  <button>Click me</button>
</TouchFeedback>
```

### 5. MobileVideoPlayer
**File:** `components/mobile/MobileVideoPlayer.tsx`

Features:
- Auto-fullscreen in landscape
- Inline playback (iOS)
- Better controls for mobile
- Orientation handling

### 6. BottomSheet
**File:** `components/mobile/BottomSheet.tsx`

Features:
- Swipe to dismiss
- Multiple snap points
- Backdrop blur
- iOS-style handle
- Safe area support

Usage:
```tsx
<BottomSheet
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Options"
  snapPoints={[50, 90]}
>
  {content}
</BottomSheet>
```

### 7. ConnectionIndicator
**File:** `components/mobile/OfflineIndicator.tsx`

Features:
- Shows offline banner when connection is lost
- Shows success banner when reconnected
- Auto-dismisses after 3 seconds

---

## Custom Hooks

### 1. useMobileDetection()
**File:** `hooks/useMobileDetection.ts`

Returns:
```ts
{
  isMobile: boolean;
  isIOS: boolean;
  isAndroid: boolean;
  isSafari: boolean;
  isChrome: boolean;
  supportsTouch: boolean;
  isStandalone: boolean; // PWA installed
  hasNotch: boolean;
  screenSize: 'small' | 'medium' | 'large';
  orientation: 'portrait' | 'landscape';
  connectionType: 'slow' | 'fast' | 'unknown';
}
```

### 2. useHaptic()
**File:** `hooks/useMobileDetection.ts`

Provides haptic feedback functions:
```ts
{
  vibrate: (pattern: number | number[]) => void;
  lightImpact: () => void;
  mediumImpact: () => void;
  heavyImpact: () => void;
}
```

### 3. useSwipe()
**File:** `hooks/useSwipe.ts`

Detects swipe gestures:
```ts
const swipeHandlers = useSwipe({
  onSwipeLeft: () => console.log('Left'),
  onSwipeRight: () => console.log('Right'),
  onSwipeUp: () => console.log('Up'),
  onSwipeDown: () => console.log('Down'),
  threshold: 50,
  velocityThreshold: 0.3
});

<div {...swipeHandlers}>Swipeable</div>
```

### 4. useMobilePerformance()
**File:** `hooks/useMobilePerformance.ts`

Returns device performance metrics:
```ts
{
  connectionSpeed: 'slow' | 'fast' | 'unknown';
  deviceMemory: number | null;
  hardwareConcurrency: number;
  isLowEndDevice: boolean;
  batteryLevel: number | null;
  isCharging: boolean | null;
  enableAnimations: boolean;
  enableAutoplay: boolean;
  preferredImageQuality: 'low' | 'medium' | 'high';
}
```

### 5. useOffline()
**File:** `hooks/useOffline.ts`

Detects online/offline status:
```ts
{
  isOnline: boolean;
  isOffline: boolean;
  downlink: number | null;
  effectiveType: string | null;
  saveData: boolean;
}
```

---

## StreamPlayer Mobile Features

### Landscape Auto-Fullscreen
- Automatically enters fullscreen when device rotates to landscape
- Exits fullscreen when rotated back to portrait
- Works on iOS and Android

### Mobile Gestures
- Integrated `MobileGestures` component
- Swipe to seek, adjust volume
- Visual feedback for all gestures

### Touch Targets
- **48x48px minimum** for all interactive elements
- Floating fullscreen button (top-right)
- Larger play/pause button
- Proper spacing for thumb-reach zones

### Mobile Detection
- Requires user interaction to play (browser policy)
- "Tap to play" hint shown
- `webkit-playsinline` attributes
- Controls always visible on mobile

---

## Layout Enhancements

### Viewport Meta Tags
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, minimum-scale=1.0, viewport-fit=cover, user-scalable=yes" />
```

### iOS Web App
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Fanbroj" />
```

### Android Web App
```html
<meta name="mobile-web-app-capable" content="yes" />
<meta name="theme-color" content="#000000" />
```

---

## Performance Optimizations

### Image Loading
- Lazy loading by default
- Blur placeholders
- Responsive sizes
- Automatic format selection (WebP support)

### JavaScript Bundle
- Code splitting
- Dynamic imports for mobile-only features
- Tree shaking

### CSS
- Hardware acceleration
- Will-change hints
- Contain property for layout optimization
- Content-visibility for off-screen elements

### Network Awareness
- Adaptive image quality based on connection
- Disable autoplay on slow connections
- Reduce animations on low-end devices
- Battery-aware features

---

## Browser Compatibility

### iOS Safari
✅ Inline video playback
✅ Safe area insets
✅ Webkit fullscreen APIs
✅ Touch events
✅ Orientation events
✅ PWA support

### Android Chrome
✅ Fullscreen APIs
✅ Touch events
✅ Orientation events
✅ PWA support
✅ Network Information API

### Mobile Firefox
✅ Most features supported
⚠️ Some APIs may vary

---

## Testing Checklist

### Basic Functionality
- [ ] Video plays on tap (not automatically)
- [ ] Fullscreen works
- [ ] Landscape auto-fullscreen works
- [ ] Gestures work (swipe to seek/volume)
- [ ] Controls are touchable (44x44px+)
- [ ] Pull-to-refresh works (if enabled)

### iOS Specific
- [ ] No zoom on input focus
- [ ] Safe area insets respected
- [ ] Inline playback (no fullscreen takeover)
- [ ] PWA install prompt works
- [ ] Notch devices handled correctly

### Android Specific
- [ ] Fullscreen works correctly
- [ ] Back button exits fullscreen
- [ ] PWA install prompt works

### Performance
- [ ] Images load progressively
- [ ] No jank on scroll
- [ ] Smooth animations
- [ ] Fast tap response (<100ms)

### Network
- [ ] Offline indicator shows
- [ ] Graceful degradation on slow connections
- [ ] Reconnection notification works

---

## Future Enhancements

### Planned Features
- [ ] Service Worker for offline support
- [ ] Background sync for watch history
- [ ] Push notifications
- [ ] Download for offline viewing
- [ ] Advanced gesture controls (pinch to zoom)
- [ ] Picture-in-Picture on mobile
- [ ] AirPlay/Chromecast support

### Accessibility
- [ ] VoiceOver/TalkBack support
- [ ] High contrast mode
- [ ] Larger text support
- [ ] Focus indicators
- [ ] ARIA labels

---

## Best Practices

### Touch Targets
- Minimum 44x44px (iOS guideline)
- Minimum 48x48px (Android guideline)
- We use **48x48px** for maximum compatibility

### Gestures
- Provide visual feedback immediately
- Use haptic feedback sparingly
- Don't override standard browser gestures
- Provide alternative methods (buttons)

### Performance
- Lazy load everything below the fold
- Use intersection observer
- Optimize images (WebP, responsive sizes)
- Minimize JavaScript
- Use CSS animations over JS when possible

### Network Awareness
- Check connection type before loading heavy resources
- Provide low-quality image fallbacks
- Disable autoplay on slow connections
- Show loading indicators

---

## Troubleshooting

### Video won't play on iOS
- Ensure `playsInline` is set
- Require user interaction
- Check `webkit-playsinline` attribute

### Fullscreen doesn't work
- Check for webkit prefixes
- Try both container and video element
- Require user interaction first

### Gestures not working
- Ensure `touch-action` is set correctly
- Check for event.preventDefault() conflicts
- Verify touch targets are large enough

### Layout issues on notch devices
- Use safe area insets
- Test on multiple device sizes
- Check `viewport-fit=cover`

---

## Resources

- [iOS Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/ios)
- [Android Material Design](https://material.io/design)
- [Web.dev Mobile Performance](https://web.dev/fast/)
- [MDN Touch Events](https://developer.mozilla.org/en-US/docs/Web/API/Touch_events)
- [Can I Use - Mobile Browser Support](https://caniuse.com/)
