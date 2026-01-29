# FIX BUFFERING ISSUES - SMOOTH PLAYBACK

## Problem
Stream stops every 20 seconds with "Network error - trying to recover..."

## Root Causes
1. **Too small buffer**: Only 10 segments × 2s = 20 seconds total
2. **No reconnection**: `-re` flag without auto-reconnect causes failures
3. **Segments deleted too fast**: Players can't download before deletion
4. **No CORS/caching headers**: Browser blocks or re-fetches unnecessarily

## Solution

### Changes Made:

**1. HLS Settings (stream-5-channels-fixed.sh):**
- Segment duration: 2s → **6s** (more stable)
- Playlist size: 10 → **6 segments** (36 seconds buffer)
- Delete threshold: 15 → **1** (keep only current segments)
- Added **auto-reconnect** on network failures
- Added **timestamp-based segment names** (avoid overwrites)
- Removed `-re` flag (let source control speed)
- Added `-fflags +genpts+discardcorrupt` (handle bad frames)

**2. Nginx Config (nginx-cdnfly-fixed.conf):**
- M3U8: Cache for 1 second with must-revalidate
- TS segments: Cache for 30 seconds (immutable)
- TCP optimizations: `tcp_nopush`, `tcp_nodelay`, `sendfile`
- Range requests enabled for seeking
- Proper CORS headers for web players

## Deploy the Fix

### On the server, run:

```bash
# 1. Copy updated files
cp ~/ciyaar/scripts/cdnfly-production/stream-5-channels-fixed.sh ~/stream.sh
cp ~/ciyaar/scripts/cdnfly-production/nginx-cdnfly-fixed.conf ~/nginx-cdnfly.conf

# 2. Update nginx config
sudo cp ~/nginx-cdnfly.conf /etc/nginx/sites-available/cdnfly
sudo nginx -t
sudo systemctl reload nginx

# 3. Stop old streams
pm2 delete all
pm2 save

# 4. Clean old segments
rm -rf ~/ciyaar/hls/channel-*/

# 5. Start new streams with fixed settings
~/stream.sh on

# 6. Check status
~/stream.sh status
pm2 logs --lines 50
```

## Test

```bash
# Test locally
curl http://localhost/channel-1/stream.m3u8

# Should show 6 segments with 6-second duration each:
# #EXTINF:6.000000,
# seg12345.ts
# #EXTINF:6.000000,
# seg12346.ts
# ... (6 total)
```

## Expected Results

- **No more 20-second stops** - 36-second buffer
- **Auto-recovery** on network issues
- **Smooth playback** in web browsers and VLC
- **Faster startup** with better buffering
- **No segment gaps** with timestamp-based naming

## CloudFront URLs

Use these in your app:
```
https://stream.cdnfly.online/channel-1/stream.m3u8
https://stream.cdnfly.online/channel-2/stream.m3u8
https://stream.cdnfly.online/channel-3/stream.m3u8
```

## Monitor

```bash
# Watch logs for reconnection events
pm2 logs ch1 --lines 100

# Check segment counts (should have ~6 segments)
watch -n 1 'ls -lh ~/ciyaar/hls/channel-1/*.ts | wc -l'

# Check playlist updates
watch -n 1 'cat ~/ciyaar/hls/channel-1/stream.m3u8'
```
