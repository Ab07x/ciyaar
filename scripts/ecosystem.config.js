// ==============================================================================
// FANBROJ PM2 ECOSYSTEM CONFIGURATION
// ==============================================================================
// This file defines all channels to run with PM2.
// 
// Usage:
//   pm2 start ecosystem.config.js
//   pm2 start ecosystem.config.js --only ch-universal
//   pm2 restart ecosystem.config.js
//   pm2 stop ecosystem.config.js
//
// Edit the CHANNELS array below to add/remove channels.
// ==============================================================================

// IPTV Provider Configuration
const IPTV_CONFIG = {
    username: 'jUpu92sC',
    password: 'gEjWzKe',
    host: 'iptvtour.store'
};

// Build stream URL helper
const buildStreamUrl = (channelId) => {
    return `http://${IPTV_CONFIG.host}/live/${IPTV_CONFIG.username}/${IPTV_CONFIG.password}/${channelId}.ts`;
};

// ==============================================================================
// CHANNEL DEFINITIONS
// ==============================================================================
// Add your channels here. Format: { slug: 'name', id: 'channel_id' }
// 
// To find channel IDs, run:
//   ./scripts/find-channel.sh "channel name"
// ==============================================================================

const CHANNELS = [
    // Example channels - replace with your actual channel IDs
    // { slug: 'universal', id: '12345' },
    // { slug: 'sntv', id: '12346' },
    // { slug: 'bein-sports-1', id: '12347' },
    // { slug: 'somali-tv', id: '12348' },
];

// ==============================================================================
// PM2 APP CONFIGURATION
// ==============================================================================

const HOME = process.env.HOME || '/home/ubuntu';
const SCRIPT_PATH = `${HOME}/ciyaar/scripts/start-247-channel.sh`;
const LOG_DIR = `${HOME}/ciyaar/logs`;

// Generate PM2 apps from channel definitions
const apps = CHANNELS.map(channel => ({
    name: `ch-${channel.slug}`,
    script: SCRIPT_PATH,
    interpreter: '/bin/bash',
    args: `${channel.slug} "${buildStreamUrl(channel.id)}"`,

    // Logging
    out_file: `${LOG_DIR}/${channel.slug}-out.log`,
    error_file: `${LOG_DIR}/${channel.slug}-error.log`,
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,

    // Process management
    autorestart: true,
    max_restarts: 50,
    restart_delay: 5000,
    exp_backoff_restart_delay: 1000,

    // Resource limits
    max_memory_restart: '500M',

    // Environment
    env: {
        NODE_ENV: 'production',
        HLS_TIME: '4',
        HLS_LIST_SIZE: '6',
        USER_AGENT: 'VLC/3.0.18 LibVLC/3.0.18'
    },

    // Watch (disabled for streaming)
    watch: false,

    // Cluster mode (disabled - each channel is single process)
    instances: 1,
    exec_mode: 'fork'
}));

// Export configuration
module.exports = {
    apps: apps.length > 0 ? apps : [
        {
            name: 'placeholder',
            script: 'echo',
            args: '"No channels configured. Edit ecosystem.config.js to add channels."',
            autorestart: false
        }
    ]
};

// ==============================================================================
// QUICK REFERENCE
// ==============================================================================
// 
// Start all channels:
//   pm2 start ecosystem.config.js
//
// Start specific channel:
//   pm2 start ecosystem.config.js --only ch-universal
//
// Restart all:
//   pm2 restart ecosystem.config.js
//
// Stop all:
//   pm2 stop ecosystem.config.js
//
// View logs:
//   pm2 logs
//
// Monitor:
//   pm2 monit
//
// Save config (persist across reboots):
//   pm2 save
//
// ==============================================================================
