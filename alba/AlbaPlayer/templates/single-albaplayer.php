<?php
defined( 'ABSPATH' ) || exit; // Exit if accessed directly
/**
 * Hook: aplr/temp/before_html_tag
 */
do_action('aplr/temp/before_html_tag');
?><!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>" />
	<link rel="profile" href="http://gmpg.org/xfn/11" />
	<link rel="icon" type="image/x-icon" href="<?php echo get_site_icon_url();?>"/>
	<meta content='width=device-width,minimum-scale=1,initial-scale=1' name='viewport'/>
	<title><?php the_title();?></title>
	<link href="<?php echo ALBPLAYER_URL;?>/assets/css/style.css?v=<?php echo ALBPLAYER_VER;?>" rel="stylesheet">
	<?php
	/**
	 * Hook: aplr/temp/before_close_head_tag
	 */
	do_action('aplr/temp/before_close_head_tag');
	?><meta http-equiv="X-UA-Compatible" content="IE=edge">
</head>
<body>
	<?php 
		/**
		 * Hook: aplr/temp/after_open_body_tag
		 *
		 */
		do_action('aplr/temp/after_open_body_tag');
	?>
	<div <?php echo Alba_Player_Plugin()->helper->player_class('aplr-player-wrapper');?>>
		<?php 
			# loop
			while ( have_posts() ) : the_post();
			
				// Get servers data to render
				$aplr_data 	 = Alba_Player_Plugin()->prepare_servers_data_to_render();

				if( ! empty( $aplr_data['servers'] ) ) :
					// servers menu
					if( ! empty( $aplr_data['has_multi_server'] ) ) :
						
						echo '<ul class="aplr-menu">';
							// Refresh And Share button
							Alba_Player_Plugin()->nav_action_btns();
							// servers list
							$server_count   = 0 ;

							foreach( $aplr_data['servers'] as $key => $server ): 

								$server_count ++;
								$active_class = $key == $aplr_data['server_id'] ? ' active' : '';  

								echo '<li><a class="aplr-link'.$active_class.'" href="'.esc_url( Alba_Player_Plugin()->get_curent_url($server_count) ).'" role="button">'.$server['albaplayer_name'].'</a></li>';
							
							endforeach;

						echo '</ul>';

					endif; // has_multi_server

					?>

					<div class="aplr-player-content">

						<?php

							if( ! empty( $aplr_data['curent_server'] ) ){
								/**
								 * Hook: aplr/temp/before_player
								 */
								do_action('aplr/temp/before_player');

								Alba_Player_Plugin()->player->get_player( $aplr_data['curent_server'] );

								// Refresh And Share button inside player
								Alba_Player_Plugin()->nav_action_btns('inside' , $aplr_data['has_multi_server']);

								/**
								 * Hook: aplr/temp/after_player
								 */
								do_action('aplr/temp/after_player');

							}

							// Player Title
							$aplr_site_name  = Alba_Player_Plugin()->get_option('sitename');
							if( ! empty( $aplr_site_name ) ){
								echo '<div class="aplr-site-name">'.$aplr_site_name.'</div>';
							}

							// Social Boxe Notification
							$aplr_notic  = Alba_Player_Plugin()->helper->get_notic_data();
							if( ! empty( $aplr_notic['stat'] ) ) : 
								?>
								<div id="aplr-notic" class="notic-<?php echo $aplr_notic['type'];?>" pos="<?php echo $aplr_notic['pos'];?>" skin="<?php echo $aplr_notic['skin'];?>">
									<div class="aplr-notic-inner">
										<span class="aplr-notic-title"><?php echo $aplr_notic['title'];?></span>
										<div class="aplr-notic-msg">
											<p><?php echo $aplr_notic['message']; ?><?php if( ! empty( $aplr_notic['btn_title'] ) ) : ?><a href="<?php echo esc_url( $aplr_notic['url'] );?>" rel="nofollow" role="button" target="_blank" class="actionbtn"><?php echo $aplr_notic['btn_title'];?></a><?php endif; ?></p>
										</div>
										<button class="aplr-close" onclick='document.getElementById("aplr-notic").style.display="none";'><svg><use xlink:href="#aplr-close"></use></svg>	</button>
									</div>
									<div class="aplr-notic-icon"><?php echo Alba_Player_Plugin()->helper->get_svg_icon($aplr_notic['type']);?></div>
								</div>
								<?php 
							endif ; // Social Boxe Notification

							
							// share Embed Code
							$aplr_embed = Alba_Player_Plugin()->get_option("share_btn") ;
							if( ! empty( $aplr_embed['stat'] ) ){
								?>
								<div id='aplr-embed' class='aplr-embed-holder'>
									<div class='aplr-embed-holder-inner'>
										<div class='aplr-embed-data'>
											<div class="aplr-embed-title"><?php echo __('Embed Code', ALBPLAYER_TXTD);?></div>
											<div class="aplr-embed-box">
												<textarea id="aplr-embed-code" onclick="this.select()" onfocus="this.select()"><iframe allowfullscreen="true" frameborder="0" height="500px" scrolling="1" src="<?php echo Alba_Player_Plugin()->get_curent_url($aplr_data['server_id']); ?>" width="100%"></iframe></textarea>
												<button class="aplr-embed-copy" onclick="aplrClickToCopy(this)"><?php echo __('Copy', ALBPLAYER_TXTD);?></button>
											</div>
											<button class="aplr-close" onclick="AplrPopUp(false)"><svg><use xlink:href="#aplr-close"></use></svg></button>
										</div>
									</div>
								</div>
								<?php
							}// share Embed Code
							
							Alba_Player_Plugin()->helper->get_banner_ads();

						?>
					</div><!-- .aplr-player-content -->
					<?php 
				endif; //!empty servers
			endwhile;
		?>
	</div><!-- .aplr-player-wrapper -->

	<?php do_action('aplr/temp/before_close_body_tag'); ?>
	<svg class="aplrSvgIcons"><symbol id="aplr-close" viewBox="0 0 320 512"><path d="M207.6 256l107.72-107.72c6.23-6.23 6.23-16.34 0-22.58l-25.03-25.03c-6.23-6.23-16.34-6.23-22.58 0L160 208.4 52.28 100.68c-6.23-6.23-16.34-6.23-22.58 0L4.68 125.7c-6.23 6.23-6.23 16.34 0 22.58L112.4 256 4.68 363.72c-6.23 6.23-6.23 16.34 0 22.58l25.03 25.03c6.23 6.23 16.34 6.23 22.58 0L160 303.6l107.72 107.72c6.23 6.23 16.34 6.23 22.58 0l25.03-25.03c6.23-6.23 6.23-16.34 0-22.58L207.6 256z"></path></symbol></svg>
</body>
</html>