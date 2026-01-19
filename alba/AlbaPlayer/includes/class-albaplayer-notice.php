<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * Admin notice
 *
 * Warning when plugin is not activated.
 *
 */
class AlbaPlayer_Notice {
	
	public function __construct($type = '') {

		if($type == 'php'){
			add_action( 'admin_notices', [$this,'php'] );
		}
		if($type == 'php82'){
			add_action( 'admin_notices', [$this,'php82'] );
		}
		if($type == 'ioncube'){
			add_action( 'admin_notices', [$this,'ioncube'] );
		}
		if($type == 'ioncube_11'){
			add_action( 'admin_notices', [$this,'ioncube_11'] );
		}

	}
	
	/**
	 *  Admin ioncube Notice .
	 */
    public static function ioncube() {
		?>
			<style>
			.tempupdate {
				line-height: 23px;
				font-family: tahoma;
				direction: rtl;
				text-align: right;
			}
		</style>
			<div class='notice notice-error tempupdate is-dismissible'>
			<ul>
				<li><div><b>خطأ بالسيرفر أثناء تفعيل اضافة AlbaPlayer</b></div></li>
				<li style="color: red;"><b>IonCube Loader</b> غير مفعل على السيرفر</li>
				<li><div>يجب الإتصال بالمستضيف لتفعيل <b>Ioncube Loader</b> على موقعكم.</div></li>
				<li><div>المستضيف هو شركة الإستضافة Hosting التي تقوم بإستضافة موقعكم على سيرفراتها.</div></li>
				<li><div>إذا كنت تعمل على سيرفر خاص، برجاء الإتصال بمسئول السيرفر لتفعيل <b>Ioncube Loader</b> على السيرفر.</div></li>
				<li> <div style="color: green;font-weight: 700;">اذا كنت من مستخدمي Cpanel يمكنك تفعيل IonCube Loader بخطوات بسيطة عبر اتباع الرابط التالي <a target="_blank" href="https://albaadani.com/%d9%83%d9%8a%d9%81%d9%8a%d8%a9-%d8%aa%d9%81%d8%b9%d9%8a%d9%84-ioncube-%d9%85%d9%86-%d9%84%d9%88%d8%ad%d8%a9-%d8%aa%d8%ad%d9%83%d9%85-cpanel/">كيفية تفعيل Ioncube من لوحة تحكم Cpanel</a> </div> </li>
			</ul>
			<footer class="footer" style="border-top: 1px solid #EEEEEE;padding: 10px;">
				<a href="https://albaadani.com/contact/" target="_blank" style="margin: 5px;display: inline-block;color: #FFFFFF !important;background-color: #5cb85c;border-color: #5cb85c;" class="button">الاتصال بالدعم الفني</a>
				<a href="<?php echo self::action_link( 'AlbaPlayer/albaplayer.php', 'deactivate' );?>" class="button" style="margin: 5px;display: inline-block;color: #FFFFFF !important;background-color: #d9534f;border-color: #d9534f;">تعطيل الاضافة لحين حل المشكلة</a>
			</footer>
		</div>
		<?php
	}

	/**
	 *  Admin ioncube Notice .
	 */
    public static function ioncube_11() {
		?>
			<style>
			.tempupdate {
				line-height: 23px;
				font-family: tahoma;
				direction: rtl;
				text-align: right;
			}
		</style>
			<?php 
			$ioncube_ver = function_exists( 'ioncube_loader_version' ) ? ioncube_loader_version() : 'none';
			?>
			<div class='notice notice-error tempupdate is-dismissible'>
			<ul>
				<li><div><b>خطأ بالسيرفر أثناء تفعيل اضافة AlbaPlayer</b></div></li>
				<li style="color: red;"><b>أنت تستخدم إصدار قديم من Ioncube Loader والذي هو <?php echo $ioncube_ver;?> </b></li>
				<li><div>يجب الإتصال بالمستضيف لترقية  <b>Ioncube Loader</b> الى الاصدار 11 </div></li>
				<li><div>المستضيف هو شركة الإستضافة Hosting التي تقوم بإستضافة موقعكم على سيرفراتها.</div></li>
				<li><div>إذا كنت تعمل على سيرفر خاص، برجاء الإتصال بمسئول السيرفر لتفعيل <b>Ioncube Loader</b> على السيرفر.</div></li>
			</ul>
			<footer class="footer" style="border-top: 1px solid #EEEEEE;padding: 10px;">
				<a href="https://albaadani.com/contact/" target="_blank" style="margin: 5px;display: inline-block;color: #FFFFFF !important;background-color: #5cb85c;border-color: #5cb85c;" class="button">الاتصال بالدعم الفني</a>
				<a href="<?php echo self::action_link( 'AlbaPlayer/albaplayer.php', 'deactivate' );?>" class="button" style="margin: 5px;display: inline-block;color: #FFFFFF !important;background-color: #d9534f;border-color: #d9534f;">تعطيل الاضافة لحين حل المشكلة</a>
			</footer>
		</div>
		<?php
	}

	
	/**
	 *  Admin php Notice .
	 */
    public static function php() {
		?>
		<style>
			.tempupdate {
				line-height: 23px;
				font-family: tahoma;
				direction: rtl;
				text-align: right;
			}
		</style>
		<div class='notice notice-error tempupdate is-dismissible'>
			<ul>
				<li><div><b>خطأ بالسيرفر أثناء تفعيل اضافة AlbaPlayer</b></div></li>
				<li style="color: red;"><b>أنت تستخدم إصدار قديم من PHP</b></li>
				<li> <div>يجب الإتصال بشركة الاستضافة الخاصه بموقعكم لترقية إصدار الـ <b>PHP</b></div> </li>
				<li> <div>أقل إصدار مدعوم من <b>PHP</b> هو الإصدار PHP 7.4.x</div> </li>
				<li> <div>أعلى إصدار مدعوم من <b>PHP</b> هو الإصدار PHP 8.1.x</div> </li>
				<li> <div>إذا كنت تعمل على سيرفر خاص، برجاء الإتصال بمسئول السيرفر لترقية إصدار الـ <b>PHP</b> على السيرفر.</div> </li>
				<li> <div style="color: green;font-weight: 700;">اذا كنت من مستخدمي Cpanel يمكنك تغيير اصدار php بخطوات بسيطة عبر اتباع الرابط التالي <a target="_blank" href="https://albaadani.com/how-to-change-php-version-in-cpanel/">كيفية تغيير إصدار PHP من لوحة تحكم Cpanel</a> </div> </li>
			</ul>
			<footer class="footer" style="border-top: 1px solid #EEEEEE;padding: 10px;">
				<a href="https://albaadani.com/contact/" target="_blank" style="margin: 5px;display: inline-block;color: #FFFFFF !important;background-color: #5cb85c;border-color: #5cb85c;" class="button">الاتصال بالدعم الفني</a>
				<a href="<?php echo self::action_link( 'AlbaPlayer/albaplayer.php', 'deactivate' );?>" class="button" style="margin: 5px;display: inline-block;color: #FFFFFF !important;background-color: #d9534f;border-color: #d9534f;">تعطيل الاضافة لحين حل المشكلة</a>
			</footer>
		</div>
		<?php
	}

	/**
	 *  Admin php82 Notice .
	 */
    public static function php82() {
		?>
		<style>
			.tempupdate {
				line-height: 23px;
				font-family: tahoma;
				direction: rtl;
				text-align: right;
			}
		</style>
		<div class='notice notice-error tempupdate is-dismissible'>
			<ul>
				<li><div><b>خطأ بالسيرفر أثناء تفعيل اضافة AlbaPlayer</b></div></li>
				<li style="color: red;"><b>أنت تستخدم إصداPHP لا يدعم تشفير الملفات الخاص بنا  </b></li>
				<li> <div>يجب الإتصال بشركة الاستضافة الخاصه بموقعكم لتغيير إصدار الـ <b>PHP</b> الى 8.1.x</div> </li>
				<li> <div>أقل إصدار مدعوم من <b>PHP</b> هو الإصدار PHP 7.4.x</div> </li>
				<li> <div>أعلى إصدار مدعوم من <b>PHP</b> هو الإصدار PHP 8.1.x</div> </li>
				<li> <div>إذا كنت تعمل على سيرفر خاص، برجاء الإتصال بمسئول السيرفر لترقية إصدار الـ <b>PHP</b> على السيرفر.</div> </li>
				<li> <div style="color: green;font-weight: 700;">اذا كنت من مستخدمي Cpanel يمكنك تغيير اصدار php بخطوات بسيطة عبر اتباع الرابط التالي <a target="_blank" href="https://albaadani.com/how-to-change-php-version-in-cpanel/">كيفية تغيير إصدار PHP من لوحة تحكم Cpanel</a> </div> </li>
			</ul>
			<footer class="footer" style="border-top: 1px solid #EEEEEE;padding: 10px;">
				<a href="https://albaadani.com/contact/" target="_blank" style="margin: 5px;display: inline-block;color: #FFFFFF !important;background-color: #5cb85c;border-color: #5cb85c;" class="button">الاتصال بالدعم الفني</a>
				<a href="<?php echo self::action_link( 'AlbaPlayer/albaplayer.php', 'deactivate' );?>" class="button" style="margin: 5px;display: inline-block;color: #FFFFFF !important;background-color: #d9534f;border-color: #d9534f;">تعطيل الاضافة لحين حل المشكلة</a>
			</footer>
		</div>
		<?php
	}

	/**
	 * deactive AlbaPlayer action .
	 */
	public static function action_link( $plugin, $action = 'activate' ) {

		if ( strpos( $plugin, '/' ) ) {
			$plugin = str_replace( '\/', '%2F', $plugin );
		}
		$url = sprintf( admin_url( 'plugins.php?action=' . $action . '&plugin=%s&plugin_status=all&paged=1&s' ), $plugin );
		$_REQUEST['plugin'] = $plugin;
		$url = wp_nonce_url( $url, $action . '-plugin_' . $plugin );
		return $url;
	}
}