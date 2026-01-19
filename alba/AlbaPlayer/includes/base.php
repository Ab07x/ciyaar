<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * Admin init
 *
 */
require_once( ALBPLAYER_PATH . '/includes/class-albaplayer-notice.php' );
if ( version_compare( PHP_VERSION, '7.4', '<' ) ) {
	new AlbaPlayer_Notice('php');
} elseif ( version_compare( PHP_VERSION, '8.2', '>=' ) ) {
	new AlbaPlayer_Notice('php82');
}else {
	if ( extension_loaded( "IonCube Loader" ) ) {
		$ioncube_ver = function_exists( 'ioncube_loader_version' ) ? ioncube_loader_version() : 'none';
		if ( $ioncube_ver != 'none' && version_compare( $ioncube_ver, '11', '>=' ) ) {
			require_once( ALBPLAYER_PATH . '/includes/class-albaplayer-admin.php' );
		}else{
			new AlbaPlayer_Notice('ioncube_11');
		}
	} else {
		new AlbaPlayer_Notice('ioncube');
	}
}