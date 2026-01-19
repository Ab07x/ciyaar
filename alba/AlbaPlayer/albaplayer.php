<?php
/*
 * Plugin Name: AlbaPlayer مشغل ملفات البث المباشر
 * Plugin URI:  https://albaadani.com/item/albaplayer/
 * Description: اضافة AlbPlayer عبارة عن مشغلات متعددة لادارة وتشغيل سيرفرات البث المباشر 
 * Version:     11.1
 * Author:      Jalal Albaadani
 * Author URI:  https://albaadani.com
 * License:     Premium Multi-purpose Plugins
 * License URI: https://albaadani.com/item/albaplayer/
 * Text Domain: albaplayer
 * Domain Path: /languages
 * Requires at least: 6.0
 * Requires PHP: 7.4
 * Tested up to: 6.4.2
 *
 */
defined('ABSPATH') or die("No script kiddies please!");
define('ALBPLAYER_PATH'     , plugin_dir_path(__FILE__));
define('ALBPLAYER_URL'      , plugin_dir_url(__FILE__));
define('ALBPLAYER_BASENAME' , plugin_basename(__FILE__));
define('ALBPLAYER_TXTD'     , 'albaplayer');
add_action('plugins_loaded', 'albaplayer_translations');
function albaplayer_translations(){
    load_plugin_textdomain(ALBPLAYER_TXTD,false,dirname(plugin_basename(__FILE__)) . '/languages/');
}
add_filter( 'plugin_action_links_' . ALBPLAYER_BASENAME, 'AlbaPlayer_settings_link' );
function AlbaPlayer_settings_link( $links ){
    $links[]  = '<span class="settings"><a href="'.admin_url().'admin.php?page=AlbaPlayerPanel" style="color: #ff8300;font-weight: 700;">' . __( 'AlbaPlayer Settings',ALBPLAYER_TXTD ) . '</a> | </span>';
    $links[]  = '<span class="support"><a href="https://albaadani.com" target="_blank" style="color: green;font-weight: 700;">' . __( 'Support ',ALBPLAYER_TXTD ) . '</a></span>';
    return $links;
}
require_once( ALBPLAYER_PATH . '/includes/base.php' );