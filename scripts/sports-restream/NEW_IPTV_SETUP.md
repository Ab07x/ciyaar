# NEW IPTV SETUP - live78.online

## Your New Credentials

```
Username: 8cd579f4ea62
Password: 5168534cd5
Server:   live78.online
```

## Server URLs (Use these)

| Priority | URL |
|----------|-----|
| Primary | `http://live78.online/` |
| Alt 1 | `http://cf.hi-max.me/` |
| Alt 2 | `http://cf.live79.online/` |
| Alt 3 | `http://cf.live80.online/` |
| Alt 4 | `http://cf.cdn5.live/` |
| Alt 5 | `http://cf.eflue.me/` |

## M3U Playlist URL

```
http://live78.online/get.php?username=8cd579f4ea62&password=5168534cd5&type=m3u&output=ts
```

## Quick Test

```bash
# Download channel list
curl -s "http://live78.online/get.php?username=8cd579f4ea62&password=5168534cd5&type=m3u&output=ts" -o /tmp/new-channels.m3u

# Count channels
grep -c "#EXTINF" /tmp/new-channels.m3u

# Search for sports
grep -i "sport\|premier\|sky" /tmp/new-channels.m3u | head -20
```

## Update Scripts for New IPTV

### Option 1: Quick Update (2 channels)
```bash
# Stop old streams
~/ciyaar/scripts/STOP.sh

# Start with new IPTV - find channels first
~/ciyaar/scripts/find_channels.sh "sky sports"

# Then start (replace XXXXX with actual channel IDs from search)
~/ciyaar/scripts/START.sh XXXXX "Sky Sports 1" XXXXX "Sky Sports 2"
```

### Option 2: Create New Config

```bash
# Edit the start script to use new credentials
sed -i 's/iptvtour.store/live78.online/g' ~/ciyaar/scripts/START.sh
sed -i 's/d06HPCFR/8cd579f4ea62/g' ~/ciyaar/scripts/START.sh
sed -i 's/qEBJjW3/5168534cd5/g' ~/ciyaar/scripts/START.sh

# Also update other scripts
sed -i 's/iptvtour.store/live78.online/g' ~/ciyaar/scripts/find_channels.sh
sed -i 's/d06HPCFR/8cd579f4ea62/g' ~/ciyaar/scripts/find_channels.sh
sed -i 's/qEBJjW3/5168534cd5/g' ~/ciyaar/scripts/find_channels.sh
```

## Find Channels on New Server

```bash
# Make sure script is updated with new credentials, then:
~/ciyaar/scripts/find_channels.sh "premier league"
~/ciyaar/scripts/find_channels.sh "sky sports"
~/ciyaar/scripts/find_channels.sh "bein"
```

## Stream URL Format

```
http://live78.online/live/8cd579f4ea62/5168534cd5/CHANNEL_ID.ts
```

## Test Stream Quality

```bash
# Test a channel before starting
ffplay "http://live78.online/live/8cd579f4ea62/5168534cd5/CHANNEL_ID.ts"

# If smooth, start streaming
~/ciyaar/scripts/START.sh CHANNEL_ID "Channel Name"
```

## Important Notes

1. **Test first** - New IPTV may have different channel IDs
2. **Check stability** - Monitor for 10 minutes before going live
3. **Update watchdog** - Make sure watchdog.sh uses new credentials
4. **Keep old config** - Don't delete old iptvtour setup as backup

## One-Command Setup

```bash
# Pull latest scripts
cd ~/ciyaar && git pull origin main

# Update to new IPTV
sed -i 's/iptvtour.store/live78.online/g; s/d06HPCFR/8cd579f4ea62/g; s/qEBJjW3/5168534cd5/g' ~/ciyaar/scripts/*.sh

# Find sports channels
~/ciyaar/scripts/find_channels.sh "sky sports premier"

# Start streaming (use IDs from search above)
~/ciyaar/scripts/START.sh ID1 "Sky 1" ID2 "Sky 2"
```
