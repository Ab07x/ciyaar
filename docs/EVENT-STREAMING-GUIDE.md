# Event Streaming Guide

This guide is for **short-duration live events** (e.g., 2-hour sports matches), not 24/7 streaming.

## Key Improvements Over Previous Setup

1. **Sequential segment numbering** (0, 1, 2...) instead of epoch-based (10264, 10265...)
2. **Fresh start each event** - No old segment confusion
3. **Short HLS window** - 40 seconds instead of 1 hour (better for unstable sources)
4. **Optimized for unstable sources** - Better error handling for corrupt streams
5. **Simple management** - Easy start/stop commands

## Quick Start

### On Server (ubuntu@ip-172-26-11-149)

```bash
cd ~/ciyaar

# Pull latest code
git pull origin main

# Make scripts executable
chmod +x scripts/start-event-stream.sh
chmod +x scripts/manage-event.sh

# Stop ALL old 24/7 streams first
pm2 delete all

# Clean all old HLS files
sudo rm -rf /var/www/html/hls/*/

# Start an event stream
./scripts/manage-event.sh start sky-action1 "YOUR_STREAM_URL_HERE"
```

## Usage Examples

### Start a stream
```bash
./scripts/manage-event.sh start sky-action "http://host/stream.ts"
```

### Check status
```bash
./scripts/manage-event.sh list
```

### View logs
```bash
pm2 logs event-sky-action
# or
tail -f ~/ciyaar/logs/sky-action.log
```

### Stop a stream
```bash
./scripts/manage-event.sh stop sky-action
```

### Clean up everything
```bash
./scripts/manage-event.sh clean sky-action
```

## Troubleshooting

### Looping/Freezing Issues

**Cause**: Old cached segments in CloudFront + browser cache

**Solution**:
```bash
# 1. Stop the stream
./scripts/manage-event.sh stop sky-action1

# 2. Clean everything
sudo rm -rf /var/www/html/hls/sky-action1/

# 3. Wait 60 seconds for CloudFront cache to expire

# 4. Restart
./scripts/manage-event.sh start sky-action1 "YOUR_URL"

# 5. Clear browser cache or test in incognito mode
```

### Source Stream Issues

If you see constant reconnections in logs:

```bash
# Check source is accessible
ffprobe -v error -show_streams "YOUR_STREAM_URL"

# If source is unstable, consider:
# 1. Using a proxy (set PROXY_URL in config/iptv.conf)
# 2. Trying a different source
# 3. Using a VPN on the server
```

### High Segment Numbers

If you still see segment numbers like 10264.ts:
- You're using the OLD script (start-247-channel.sh)
- Use the NEW script (start-event-stream.sh) via manage-event.sh

## Configuration

Edit `~/ciyaar/config/iptv.conf`:

```bash
# Proxy (optional - for better source access)
PROXY_URL="http://user:pass@proxy:port"

# HLS Settings (optional - defaults are optimized)
HLS_TIME=4              # Segment duration in seconds
HLS_LIST_SIZE=10        # Number of segments in playlist
HLS_DELETE_THRESHOLD=15 # Delete segments after this many
```

## Differences from 24/7 Setup

| Feature | 24/7 Setup | Event Setup |
|---------|-----------|-------------|
| Segment numbering | Epoch-based (10264) | Sequential (00001) |
| Playlist size | 900 segments (1 hour) | 10 segments (40s) |
| On restart | Preserve segments | Clean all segments |
| Use case | Continuous streaming | 2-hour events |
| Max retries | 1000 | 50 |
| Segment cleanup | Conservative | Aggressive |

## CloudFront Cache Notes

- CloudFront caches playlists for up to 1 hour
- Always clean segments before starting a new event
- If experiencing loops, wait 60 seconds after cleanup
- Consider creating invalidations for important events:
  ```bash
  aws cloudfront create-invalidation \
    --distribution-id YOUR_DIST_ID \
    --paths "/hls/sky-action1/*"
  ```

## Best Practices for Events

1. **Start fresh**: Always stop and clean before starting
2. **Test source first**: Verify stream URL works
3. **Monitor logs**: Use `pm2 logs` to watch for issues
4. **Stop when done**: Don't leave event streams running after match
5. **Clean up**: Run clean command after events

## Migration from Old Setup

```bash
# 1. Stop all old streams
pm2 delete all

# 2. Clean all HLS directories
sudo rm -rf /var/www/html/hls/*/

# 3. Update git repo
cd ~/ciyaar
git pull origin main

# 4. Make new scripts executable
chmod +x scripts/*.sh

# 5. Start using new event scripts
./scripts/manage-event.sh start channel-name "URL"
```
