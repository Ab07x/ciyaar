#!/usr/bin/env python3

"""
PERFORMANCE MONITORING DASHBOARD
Real-time monitoring of streaming server performance
"""

import os
import json
import time
import psutil
import subprocess
from datetime import datetime
from pathlib import Path

# Configuration
STREAM_BASE = "/var/streaming"
HLS_OUTPUT = f"{STREAM_BASE}/hls"
CONFIG_FILE = f"{STREAM_BASE}/config/channels.json"

class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    BOLD = '\033[1m'
    END = '\033[0m'

def clear_screen():
    os.system('clear' if os.name == 'posix' else 'cls')

def get_pm2_processes():
    """Get PM2 process list"""
    try:
        result = subprocess.run(['pm2', 'jlist'], capture_output=True, text=True)
        return json.loads(result.stdout)
    except:
        return []

def get_stream_stats(channel_id):
    """Get statistics for a specific channel"""
    output_dir = f"{HLS_OUTPUT}/channel-{channel_id}"
    playlist = f"{output_dir}/playlist.m3u8"

    stats = {
        'segments': 0,
        'playlist_size': 0,
        'total_size': 0,
        'last_update': 'N/A',
        'healthy': False
    }

    # Count segments
    try:
        segments = list(Path(output_dir).glob('*.ts'))
        stats['segments'] = len(segments)
        stats['total_size'] = sum(s.stat().st_size for s in segments)
    except:
        pass

    # Check playlist
    try:
        if os.path.exists(playlist):
            stats['playlist_size'] = os.path.getsize(playlist)
            mod_time = os.path.getmtime(playlist)
            age = time.time() - mod_time
            stats['last_update'] = f"{int(age)}s ago"
            stats['healthy'] = age < 30
    except:
        pass

    return stats

def format_bytes(bytes):
    """Format bytes to human readable"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if bytes < 1024.0:
            return f"{bytes:.1f} {unit}"
        bytes /= 1024.0
    return f"{bytes:.1f} PB"

def format_percent(value):
    """Format percentage with color"""
    if value > 90:
        return f"{Colors.RED}{value:.1f}%{Colors.END}"
    elif value > 70:
        return f"{Colors.YELLOW}{value:.1f}%{Colors.END}"
    else:
        return f"{Colors.GREEN}{value:.1f}%{Colors.END}"

def display_dashboard():
    """Display real-time dashboard"""
    while True:
        clear_screen()

        # Header
        print(f"{Colors.BOLD}{Colors.CYAN}╔═══════════════════════════════════════════════════════════════╗{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}║     STREAMING SERVER PERFORMANCE DASHBOARD                    ║{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}║     {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}                                        ║{Colors.END}")
        print(f"{Colors.BOLD}{Colors.CYAN}╚═══════════════════════════════════════════════════════════════╝{Colors.END}")
        print()

        # System Resources
        cpu_percent = psutil.cpu_percent(interval=1)
        mem = psutil.virtual_memory()
        disk = psutil.disk_usage(STREAM_BASE)
        net = psutil.net_io_counters()

        print(f"{Colors.BOLD}{Colors.BLUE}SYSTEM RESOURCES{Colors.END}")
        print(f"  CPU Usage:    {format_percent(cpu_percent)}")
        print(f"  Memory:       {format_bytes(mem.used)} / {format_bytes(mem.total)} ({format_percent(mem.percent)})")
        print(f"  Disk:         {format_bytes(disk.used)} / {format_bytes(disk.total)} ({format_percent(disk.percent)})")
        print(f"  Network RX:   {format_bytes(net.bytes_recv)}")
        print(f"  Network TX:   {format_bytes(net.bytes_sent)}")
        print()

        # CPU per core
        cpu_per_core = psutil.cpu_percent(interval=1, percpu=True)
        print(f"{Colors.BOLD}{Colors.BLUE}CPU CORES{Colors.END}")
        for i, percent in enumerate(cpu_per_core):
            print(f"  Core {i}: {format_percent(percent)}")
        print()

        # PM2 Processes
        processes = get_pm2_processes()
        print(f"{Colors.BOLD}{Colors.BLUE}ACTIVE STREAMS ({len(processes)}){Colors.END}")
        print(f"  {'ID':<4} {'Name':<15} {'Status':<12} {'CPU':<8} {'Mem':<10} {'Restarts':<10}")
        print(f"  {'-'*70}")

        for proc in processes:
            name = proc.get('name', 'N/A')
            status = proc['pm2_env'].get('status', 'N/A')
            cpu = proc['monit'].get('cpu', 0)
            mem = proc['monit'].get('memory', 0)
            restarts = proc['pm2_env'].get('restart_time', 0)

            # Color status
            if status == 'online':
                status_colored = f"{Colors.GREEN}{status}{Colors.END}"
            else:
                status_colored = f"{Colors.RED}{status}{Colors.END}"

            # Extract channel ID
            channel_id = name.replace('channel-', '') if 'channel-' in name else '?'

            print(f"  {channel_id:<4} {name:<15} {status_colored:<20} {cpu:<8.1f} {format_bytes(mem):<10} {restarts:<10}")

        print()

        # Stream Health
        print(f"{Colors.BOLD}{Colors.BLUE}STREAM HEALTH{Colors.END}")
        print(f"  {'Channel':<10} {'Segments':<10} {'Size':<12} {'Updated':<15} {'Status':<10}")
        print(f"  {'-'*70}")

        for proc in processes:
            name = proc.get('name', '')
            if not name.startswith('channel-'):
                continue

            channel_id = name.replace('channel-', '')
            stats = get_stream_stats(channel_id)

            health = f"{Colors.GREEN}HEALTHY{Colors.END}" if stats['healthy'] else f"{Colors.RED}STALE{Colors.END}"

            print(f"  {channel_id:<10} {stats['segments']:<10} {format_bytes(stats['total_size']):<12} {stats['last_update']:<15} {health:<18}")

        print()
        print(f"{Colors.YELLOW}Press Ctrl+C to exit{Colors.END}")

        # Refresh every 2 seconds
        time.sleep(2)

if __name__ == '__main__':
    try:
        display_dashboard()
    except KeyboardInterrupt:
        print(f"\n{Colors.GREEN}Dashboard closed{Colors.END}")
        exit(0)
