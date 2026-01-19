<?php
if ( ! defined( 'ABSPATH' ) ) exit;
/**
 * AlbaPlayer  :: AlbaPlayer_Option.
 *
 * @since   0.1.0
 * @package AlbaPlayer Plugin
 */
if ( ! class_exists("AlbaPlayer_Option") ) {
    
    class AlbaPlayer_Option {

        public static function options_fields(){

            $sections = [];
            $sections[] = [
                "id"        => "appearance_options",
                "title"     => __("Appearance", ALBPLAYER_TXTD),
                "class"     => "aplr-demo-field aplr-option-page",
                "demo_form"     => true ,
                
                "section_tabs"    => [
                    [
                        "id"        => "Servers",
                        "title"     => __("Servers", ALBPLAYER_TXTD),
                        "fields"    => [
                            [
                                'label'  =>  esc_html__('Text Under Player', ALBPLAYER_TXTD ),
                                "id"     => "sitename",
                                'type'   => 'text',
                                'row_class'  => 'aplr-mb-4 first-child last-child adplyr-form-floating',
                                'has_inner'  => false,
                                'std'    =>  get_bloginfo('name'),
                            
                            ],
                            [
                                'title' =>  esc_html__('Servers Buttons', ALBPLAYER_TXTD ),
                                //'before' =>  esc_html__('Servers Buttons Style', ALBPLAYER_TXTD ),
                                "id"    => "nav_btn",
                                'type'  => 'group',
                                'has_row'=> false,
                                'fields' => [
                                    [
                                        'title' =>  esc_html__('Servers Buttons', ALBPLAYER_TXTD ),
                                        "id"    => "pos-hd",
                                        'type'  => 'header',
                                
                                    ],
                                
        
                                    [
                                        'title' =>  esc_html__('Position', ALBPLAYER_TXTD ),
                                        "id"    => "pos",
                                        "class" => "aplyer-flex-inner",
                                        'type'  => 'select_button',
                                        'options' => array(
                                            't' =>  esc_html__('Top', ALBPLAYER_TXTD ),
                                            'b' =>  esc_html__('Bottom', ALBPLAYER_TXTD ),
                                        )
                                    ],
                                    [
                                        'title' =>  esc_html__('Style', ALBPLAYER_TXTD ),
                                        "class" => "aplyer-flex-inner",
                                        "id"    => "style",
                                        'type'  => 'select_button',
                                        'options' => array(
                                            '1' =>  esc_html__('Filled', ALBPLAYER_TXTD ),
                                            '2' =>  esc_html__('Outline', ALBPLAYER_TXTD ),
                                        )
                                    ],
                                    [
                                        'title' =>  esc_html__('Stretch Buttons', ALBPLAYER_TXTD ),
                                        "id"    => "stretch",
                                        "class" => "aplyer-flex-inner",
                                        'type'  => 'select_button',
                                        'options' => array(
                                            '1' => 'Stretch',
                                            '2' => 'Inline',
                                        )
                                    ],
                                    [
                                        'title'   =>  esc_html__('Corner Radius', ALBPLAYER_TXTD ),
                                        'id'      => 'radius',
                                        'type'    => 'small_btns',
                                        'class' => 'aplyer-flex-inner',
                                        'options' => [
                                            '1'  => '1',
                                            '6'  => '2',
                                            '40' => '3',
                                        ],
                    
                                    ],
                                    [
                                        'title'   =>  esc_html__('Buttons Size', ALBPLAYER_TXTD ),
                                        'id'      => 'size',
                                        'type'    => 'small_btns',
                                        'has_icons'   => false,
                                        'class' => 'aplyer-flex-inner',
                                        'options' => ['s' => 'S','m' => 'M','l' => 'L'],
                    
                                    ],
                                    [
                                        'title' =>  esc_html__('Primary Color', ALBPLAYER_TXTD ),
                                        "id"    => "color",
                                        'type'  => 'color',
                                        'atts'  => 'data-target=".aplr-player-wrapper,#albaplayer-nav_btn_style-option .alba-siblings.aplr-button-group" data-scss="--aplr-primary"',
                                        'default'   => '#552a86',
                                    ],
                                    [
                                        'title' =>  esc_html__('Secondary Color', ALBPLAYER_TXTD ),
                                        "id"    => "color_sec",
                                        'type'  => 'color',
                                        'class' => 'last-child',
                                        'atts'  => 'data-target=".aplr-player-wrapper" data-scss="--aplr-secondary"',
                                        'default'   => '#9e1414'
                                    ],
                                    
                                ]
                            
                            ],
                            [
                                'title' =>  esc_html__('Refresh Button', ALBPLAYER_TXTD ),
                                "id"    => "refresh_btn",
                                'type'  => 'group',
                                'class' => 'aplyer-flex-inner first-child last-child',
        
                                'has_row'=> false,
                                'fields' => [
                                    
                                    [
                                        "id"    => "stat",
                                        'title' =>  esc_html__('Refresh Button', ALBPLAYER_TXTD ),
                                        'type'  => 'switcher',
                                        'class' => 'first-child aplr-mt-4',
                                        'std'   => '',
                                        'toggle'=> '#aplr-refresh_btn-fields_options,#refresh'
                            
                                    ],
                                    [
                                        "id"    => "stat-html",
                                        'type'  => 'html',
                                        'content' => '<div id="aplr-refresh_btn-fields_options" class="aplr-mb-4">',
                                    ],
                                    [
                                        'title' =>  esc_html__('Background Color', ALBPLAYER_TXTD ),
                                        "id"    => "bg",
                                        'type'  => 'color',
                                        'atts'  => 'data-target=".aplr-m-icon#refresh .aplr-link" data-scss="background"',
                                        'default'   => '#162133',
                                    ],
                                    
                                    [
                                        'title'     =>  esc_html__('Position', ALBPLAYER_TXTD ),
                                        "id"        => "pos",
                                        'type'      => 'select_button',
                                        'class' => 'aplyer-flex-inner',                                        
                                        'options' => array(
                                            '1' => '1',
                                            '2' => '2',
                                            '3' => '3',
                                            '4' => '4',
                                        )
                                    ],
                                    [
                                        'title' =>  esc_html__('style', ALBPLAYER_TXTD ),
                                        "id"    => "layout",
                                        'type'  => 'select',
                                        'atts' => 'style="width:104px"', 
                                        'class' => 'last-child',
                                        'options' => array(
                                            '1' => esc_html__('Text + Icon', ALBPLAYER_TXTD ),
                                            '2' => esc_html__('Icon', ALBPLAYER_TXTD ),
                                            '3' => esc_html__('Text', ALBPLAYER_TXTD ),
                                        )
                                    ],
                                    
        
        
                                    [
                                        "id"    => "stat-html",
                                        'type'  => 'html',
                                        'content' => '</div>',
                                    ],
                                ]
                            
                            ],
                            [
                                'title' =>  esc_html__('Share Button', ALBPLAYER_TXTD ),
                                "id"    => "share_btn",
                                "class"    => 'aplyer-flex-inner first-child last-child',
                                'type'  => 'group',
                                'has_row'=> false,
                                'fields' => [
                                    [
                                        "id"    => "stat",
                                        'title' =>  esc_html__('Share Button', ALBPLAYER_TXTD ),
                                        'type'  => 'switcher',
                                        'class' => 'first-child last-child',
                                        'std'   => '',
                                        'toggle'=> '#aplr-share_btn-fields_options,.showshare'
                            
                                    ],
                                    [
                                        "id"    => "stat-html",
                                        'type'  => 'html',
                                        'content' => '<div id="aplr-share_btn-fields_options">',
                                    ],
                                    [
                                        'title' =>  esc_html__('Background', ALBPLAYER_TXTD ),
                                        "id"    => "bg",
                                        'type'  => 'color',
                                        'atts'  => 'data-target=".aplr-m-icon#showshare .aplr-link" data-scss="background"',
                                        'default'   => '#162133',
                                    ],
                                    [
                                        'title' =>  esc_html__('Position', ALBPLAYER_TXTD ),
                                        "id"    => "pos",
                                        'type'      => 'select_button',
                                        'class' => 'aplyer-flex-inner',                                        
                                        'options' => array(
                                            '1' => '1',
                                            '2' => '2',
                                            '3' => '3',
                                            '4' => '4',
                                        )
                                    ],
                                    [
                                        'title' =>  esc_html__('Style', ALBPLAYER_TXTD ),
                                        "id"    => "layout",
                                        'type'  => 'select',
                                        'atts' => 'style="width:104px"', 
                                        'class' => 'last-child',                                       
                                        'options' => array(
                                            '1' => esc_html__('Text + Icon', ALBPLAYER_TXTD ),
                                            '2' => esc_html__('Icon', ALBPLAYER_TXTD ),
                                            '3' => esc_html__('Text', ALBPLAYER_TXTD ),
                                        )
                                    ],
                                    [
                                        "id"    => "stat-html",
                                        'type'  => 'html',
                                        'content' => '</div>',
                                    ],
                                ]
                            ],
    
                           
                            
                        ]
                    ],
                    [
                        "id"        => "midea_tab",
                        "title"     => __("Logo & Poster", ALBPLAYER_TXTD),
                        "class"     => "aplr-normal-field aplr-option-page",
                        "fields"    => [
                            // Logo
                            [
                                'title' =>  esc_html__('Player Logo', ALBPLAYER_TXTD ),
                                "id"    => "logo",
                                "class"    => 'aplyer-flex-inner first-child',
                                'type'  => 'group',
                                'has_row'=> false,
                                'fields' => [
                                    [
                                        'label_title' =>  esc_html__('Player Logo', ALBPLAYER_TXTD ),
                                        "class"    => 'first-child',
                                        "id"    => "src",
                                        'type'  => 'image',
                                    ],
                                    [
                                        "id"    => "stat-html",
                                        'type'  => 'html',
                                        'content' => '<div id="aplr-logo-setup-fields_options" class="aplr-mb-5 aplr-hidden">',
                                    ],
                                    [
                                        'title' =>  esc_html__('Position', ALBPLAYER_TXTD ),
                                        "id"    => "position",
                                        'type'  => 'select',
                                        'options'  => [
                                            'top-right' => esc_html__('Top Right', ALBPLAYER_TXTD ),
                                            'top-left'  => esc_html__('Top Left', ALBPLAYER_TXTD ),
                                            'bottom-right' => esc_html__('Bottom Right', ALBPLAYER_TXTD ),
                                            'bottom-left'  => esc_html__('Bottom Left', ALBPLAYER_TXTD ),
                                        ],
                                        'std'   => 'top-right'
                                    ],
                                    [
                                        "id"    => "stat-html",
                                        'type'  => 'html',
                                        'content' => '</div>',
                                    ],
                                ]
                            ],
        
                            [
                                'label_title' =>  esc_html__('Player Poster', ALBPLAYER_TXTD ),
                                "id"    => "poster",
                                'type'  => 'image',
                                'class' => 'last-child aplr-mb-5',
        
                            ],
                            
                            
                        ]
                    ],
                    [
                        "id"        => "notification",
                        "title"     => __("Notification", ALBPLAYER_TXTD),
                        "fields"    => [
                            
                                ## Social Notification
                                [
                                'title' =>  esc_html__('Social Notification', ALBPLAYER_TXTD ),
                                "id"    => "notification",
                                "class"    => 'first-child last-child aplr-mb-5',
                                'type'  => 'group',
                                'has_row'=> false,
    
                                'fields' => [
                                    [
                                        'title' =>  esc_html__('Social Notification', ALBPLAYER_TXTD ),
                                        "id"    => "stat",
                                        'type'  => 'switcher',
                                        'class'  => 'first-child last-child',
                                        'toggle'=> '#aplr-Notification_stat-sup-fields,#aplr-notic-box',
                                    ],
                                    [
                                        "id"    => "stat-html",
                                        'type'  => 'html',
                                        'content' => '<div id="aplr-Notification_stat-sup-fields">',
                                    ],
                                    [
                                        'title' =>  esc_html__('Skin', ALBPLAYER_TXTD ),
                                        "id"    => "skin",
                                        'type'  => 'select_button',
                                        'class'  => 'aplyer-flex-inner',
                                        'options'   => [
                                            'light'  =>  esc_html__('Light', ALBPLAYER_TXTD ),
                                            'dark'   =>  esc_html__('Dark', ALBPLAYER_TXTD ),
                                        ],
                                    ],
                                    [
                                        'title' =>  esc_html__('Position', ALBPLAYER_TXTD ),
                                        "id"    => "pos",
                                        'type'  => 'select_button',
                                        'class'  => 'last-child aplyer-flex-inner',
                                        'options'   => [
                                            'right' =>  esc_html__('Right', ALBPLAYER_TXTD ),
                                            'left'  =>  esc_html__('Left', ALBPLAYER_TXTD ),
                                        ],
                                    ],
                                    [
                                        'title' =>  esc_html__('Buttun Type', ALBPLAYER_TXTD ),
                                        "id"    => "type",
                                        'type'  => 'select_svg',
                                        'has_inner'  => false,
                                        'has_popup'  => false,
                                        'row_class'  => 'aplr-clear-fx first-child aplr-mt-4 aplr-mb-4 has_title aplyer-field-select_svg aplr-editor-select-visual-group-three-cols',
                                        'class' => 'first-child aplr-mb-5',
                                        'options' => array(
                                            'telegram' => ['img' => 'telegram.svg' ,'label' => 'Telegram'],
                                            'facebook' => ['img' => 'facebook.svg' ,'label' => 'Facebook'],
                                            'x'        => ['img' => 'x.svg' ,'label' => 'x'],
                                            'youtube'  => ['img' => 'youtube.svg' ,'label'  => 'Youtube'],
                                            'whatsapp' => ['img' => 'whatsapp.svg' ,'label' => 'Whatsapp'],
                                            'apk'      => ['img' => 'apk.svg' ,'label' => 'Apk'],
                                            'ios'      => ['img' => 'ios.svg' ,'label' => 'Ios'],
                                        )
                                    ],
        
                                    [
                                        'content' =>  '<div class="aplr-field-title" style="margin-bottom: 6px;">'.esc_html__('Content', ALBPLAYER_TXTD ).'</div>',
                                        "id"     => "tile",
                                        'type'   => 'html',
                        
                                    
                                    ],
                                    [
                                        'label' =>  esc_html__('Title', ALBPLAYER_TXTD ),
                                        "id"     => "title",
                                        'type'   => 'text',
                                        'row_class'  => 'adplyr-form-floating first-child',
                                        'has_inner'  => false,
                                    
                                    ],
                                    [
                                        'label' =>  esc_html__('Content', ALBPLAYER_TXTD ),
                                        "id"    => "message",
                                        'type'  => 'textarea',
                                        'row_class'  => 'adplyr-form-floating',
                                        'has_inner'  => false,
                                        'atts'  => 'rows="3"',
                                    ],
                                    [
                                        'label' =>  esc_html__('Buttun title', ALBPLAYER_TXTD ),
                                        "id"     => "btn_title",
                                        'type'   => 'text',
                                        'row_class'  => 'adplyr-form-floating',
                                        'has_inner'  => false,
                                    
                                    ],
                                    
                                    [
                                        'label' =>  esc_html__('Buttun url', ALBPLAYER_TXTD ),
                                        "id"    => "url",
                                        'type'  => 'text',
                                        'row_class'  => 'adplyr-form-floating last-child',
                                        'has_inner'  => false,
                            
                                    ],
                                    [
                                        "id"    => "stat-html",
                                        'type'  => 'html',
                                        'content' => '</div>',
                                    ]
                                ]
                            ],
    
    
                        ]
                    ]
    
                ],
            ];
            // ads
            $sections[] = [
                "id"        => "e3lan_sittings",
                "title"     => __("Advertisements", ALBPLAYER_TXTD),
                "class"     => "aplr-normal-field aplr-option-page",
                "fields" => [
                    [
                        'title'  =>  esc_html__('Ads', ALBPLAYER_TXTD),
                        "id"    => "ads",
                        'type'  => 'group',
                        'has_row'=> false ,
                        'fields' => [
                            [
                                'title' =>  esc_html__('Advertisements', ALBPLAYER_TXTD),
                                "id"    => "adshd",
                                'type'  => 'header',
                                'class' => 'first-child',
                            ],
    
                            [
                                'title'  =>  esc_html__('Ads', ALBPLAYER_TXTD),
                                "id"    => "stat",
                                'type'  => 'switcher',
                                'class' => 'first-child last-child aplr-mb-4',
                                'toggle'=> '#aplr-a3lan_fields-setup-fields_options'
                            ],
                            [
                                "id"    => "stat-html",
                                'type'  => 'html',
                                'content' => '<div id="aplr-a3lan_fields-setup-fields_options">',
                            ],                    
                            [
                                'title' =>  esc_html__('Header Code', ALBPLAYER_TXTD),
                                "id"    => "head_cod",
                                'type'  => 'textarea',
                                'class' => 'code_ltr',
                                'desc' => esc_html__( 'Will add to the &lt;head&gt; tag. Useful if you need to add additional codes such as CSS or JS.', ALBPLAYER_TXTD ),
                                'atts'  => 'rows="4"',
                                'std'   => ''
                            ],
                            
                            [
                                'title' =>  esc_html__('Footer Code', ALBPLAYER_TXTD),
                                "id"    => "footer_cod",
                                'class' => 'code_ltr',
                                'type'  => 'textarea',
                                'desc'  => esc_html__( 'Will add to the footer before the closing  &lt;/body&gt; tag. Useful if you need to add Javascript.', ALBPLAYER_TXTD ),
                                'atts'  => 'rows="4"',
                                'std'   => ''
                            
                            ],
                            [
                                'title' =>  esc_html__('Ads', ALBPLAYER_TXTD),
                                "id"    => "banner",
                                "namea" => "albaplayer[ads][banner]",
                                'type'  => 'group',
                                'has_row'=> false ,
                                'fields' => [
                                    [
                                        'title' =>  esc_html__('Video Banner Ads', ALBPLAYER_TXTD),
                                        "id"    => "footer_hjcod",
                                        'type'  => 'header',
                                    ],
                                    [
                                        'title' =>  esc_html__('Skipping Timer', ALBPLAYER_TXTD),
                                        "id"    => "timer",
                                        'type'  => 'switcher',
                                        'toggle'=> '#albaplayer-ads-banner-timer_sec-option',
                                    ],
                                    
                                    [
                                        'title' =>  esc_html__('Show Close Button After', ALBPLAYER_TXTD),
                                        "id"    => "timer_sec",
                                        'type'  => 'number',
                                        'desc'    =>  esc_html__('seconds', ALBPLAYER_TXTD),
                                        'max'     => 60,
                                        'step'    => 1,
                                        'default' => 5,
                            
                                    ],
                
                    
                                    
                                    [
                                        'title' =>  esc_html__('Ad Code', ALBPLAYER_TXTD),
                                        "id"    => "ad",
                                        'class'  => 'code_ltr',
                                        'type'  => 'textarea',
                                        'atts'  => 'rows="4"',
            
                                    ],
                                    [
                                        "id"    => "stat-html",
                                        'type'  => 'html',
                                        'content' => '</div>',
                                    ]
                                ]
                            ],
                            
    
    
                        ]
                    ]
                ]
            ];
            // Protections
            $sections[] = [
                "id"        => "protections_sittings",
                "title"     => __("Protections", ALBPLAYER_TXTD),
                "class"     => "aplr-normal-field aplr-option-page",
                "fields"    => [
                    [
                        'title' =>  esc_html__('Protections', ALBPLAYER_TXTD),
                        "id"    => "protections",
                        'type'  => 'group',
                        'has_row'   => false,
                        "fields"    => [
                            [
                                'title' =>  esc_html__('Developer Tools Blocker', ALBPLAYER_TXTD),
                                "id"    => "block_inspect_element",
                                'type'  => 'header',
                            
                            ],

                            [
                                'title' =>  esc_html__('Developer Tools Blocker', ALBPLAYER_TXTD),
                                "id"    => "dev_tools",
                                "namea" => "albaplayer[protections][dev_tools]",
                                'type'  => 'group',
                                'has_row'   => false,
                                "fields"    => [
                                    [
                                        'title' =>  esc_html__('Developer Tools Protector (Inspect Element)', ALBPLAYER_TXTD),
                                        "id"    => "stat",
                                        'type'  => 'switcher',
                                        'desc'   => esc_html__("It is the most effective way to copy content from websites by using the developer tools of the browser. By enabling this protector, you block access to the browser's developer tools on your site.", ALBPLAYER_TXTD),
                                        'toggle'=> '#albaplayer-protections-dev_tools-options-fields'
                                    
                                    ],
                                    [
                                        "id"    => "block_iframedsd",
                                        'type'  => 'html',
                                        'content'=> '<div id="albaplayer-protections-dev_tools-options-fields">',
                                    ],
                                    [
                                        "title"    => esc_html__('Protection Protocol', ALBPLAYER_TXTD),
                                        "desc"    => esc_html__('Consider selecting a protocol that is secure, user-friendly, and offers the best protection.', ALBPLAYER_TXTD),
                                        "id"    => "protocol",
                                        'type'  => 'select',
                                        'options'=> [
                                            '1'  =>  __( 'Block and Disable Only HotKeys', ALBPLAYER_TXTD ),
                                            '2'  =>  __( 'Redirect To Custom Url After Opening Dev Tools', ALBPLAYER_TXTD ), 
                                        ],
                                        'toggle' => array(
                                            '1'         => '',
                                            '2'         => '#albaplayer-protections-dev_tools-redirect-option',
                
                                        ),
                                    ],
                                    [
                                        'title' =>  esc_html__('Redirect link', ALBPLAYER_TXTD),
                                        "id"    => "redirect",
                                        'type'  => 'text',
                                        'input_class'   => 'ltr regular-text',
                                        'class'   => 'albaplayer-protections-dev_tools-protocol-option-options',
                                        'desc'  => esc_html__('used to redirect the visitor to another page when he tries to open inspect element Developer tools', ALBPLAYER_TXTD),
                                    ],
                                    [
                                        'title' =>  esc_html__('Block Right Click', ALBPLAYER_TXTD),
                                        "id"    => "r_click",
                                        'type'  => 'switcher',
                                        'std'   => '0',
                                    ],
                                    [
                                        "id"    => "block_iframedsd",
                                        'type'  => 'html',
                                        'content'=> '</div>',
                                    ],

                                ]
                            
                            ],

                            //player_page
                            [
                                'title' =>  esc_html__('AlbaPlayer Page', ALBPLAYER_TXTD),
                                "id"    => "player_page",
                                "namea" => "albaplayer[protections][player_page]",
                                'type'  => 'group',
                                'has_row'   => false,
                                "fields"    => [
                                    [
                                        'title' =>  esc_html__('AlbaPlayer Page', ALBPLAYER_TXTD),
                                        "id"    => "block_dsd",
                                        'type'  => 'header',
                                        'class' => 'first-child',
                                    ],
                                    [
                                        'title' =>  esc_html__('Disable Streaming page and allow it to run on the iframe only', ALBPLAYER_TXTD),
                                        "id"    => "stat",
                                        'type'  => 'switcher',
                                        'toggle'=> '#albaplayer-protections-player_page-options-fields'
                                    
                                    ],
                                    [
                                        "id"    => "block_iframedsd",
                                        'type'  => 'html',
                                        'content'=> '<div id="albaplayer-protections-player_page-options-fields">',
                                    ],
                                    [
                                        "title"    => esc_html__('Protection Protocol', ALBPLAYER_TXTD),
                                        "desc"    => esc_html__('Consider selecting a protocol that is secure, user-friendly, and offers the best protection.', ALBPLAYER_TXTD),
                                        "id"    => "protocol",
                                        'type'  => 'select',
                                        'options'=> [
                                            '1'  =>  __( 'Block and Show a Blank Page', ALBPLAYER_TXTD ),
                                            '2'  =>  __( 'Show  Message in Page', ALBPLAYER_TXTD ),
                                            '3'  =>  __( 'Redirect to Custom Url', ALBPLAYER_TXTD ), 
                                        ],
                                        'toggle' => array(
                                            '1'         => '',
                                            '2'         => '#albaplayer-protections-player_page-msg-option',
                                            '3'         => '#albaplayer-protections-player_page-redirect-option',
                
                                        ),
                                    ],
                                    [
                                        'title' =>  esc_html__('Redirect link', ALBPLAYER_TXTD),
                                        "id"    => "redirect",
                                        'type'  => 'text',
                                        'input_class'   => 'ltr regular-text',
                                        'class'   => 'albaplayer-protections-player_page-protocol-option-options',
                                        'desc'  => esc_html__('used to redirect the visitor to another page when he tries to open inspect element Developer tools', ALBPLAYER_TXTD),
                                    ],
                                    [
                                        'title' =>  esc_html__('Message Text', ALBPLAYER_TXTD),
                                        "id"    => "msg",
                                        'type'  => 'textarea',
                                        'class'   => 'albaplayer-protections-player_page-protocol-option-options',
                                        'input_class'   => 'regular-text',
                                        'atts'  => 'rows="4"',
                
                                    ],
                                    [
                                        "id"    => "block_iframedsd",
                                        'type'  => 'html',
                                        'content'=> '</div>',
                                    ],

                                ]
                            ],
                             //iframe
                            [
                                'title' =>  esc_html__('AlbaPlayer Page', ALBPLAYER_TXTD),
                                "id"    => "iframe",
                                "namea" => "albaplayer[protections][iframe]",
                                'type'  => 'group',
                                'has_row'   => false,
                                "fields"    => [
                                    [
                                        "title"    => esc_html__('iFrame Hotlink Protector', ALBPLAYER_TXTD),
                                        "id"    => "block_dsd",
                                        'type'  => 'header',
                                        'class' => 'first-child',
                                    ],
                                    [
                                        "title"    => esc_html__('Prevent websites from running iframe streaming', ALBPLAYER_TXTD),
                                        "id"    => "stat",
                                        'type'  => 'switcher',
                                        'toggle'=> '#albaplayer-protections-iframe-options-fields'
                                    
                                    ],
                                    [
                                        "id"    => "iframeds",
                                        'type'  => 'html',
                                        'content'=> '<div id="albaplayer-protections-iframe-options-fields">',
                                    ],

                                    [
                                        "title"    => esc_html__('Protection Protocol', ALBPLAYER_TXTD),
                                        "desc"    => esc_html__('Consider selecting a protocol that is secure, user-friendly, and offers the best protection.', ALBPLAYER_TXTD),
                                        "id"    => "protocol",
                                        'type'  => 'select',
                                        'options'=> [
                                            '1'  =>  __( 'Block and Show a Blank Page in iFrames', ALBPLAYER_TXTD ),
                                            '2'  =>  __( 'Show Popup Message in iFrame Requests', ALBPLAYER_TXTD ),
                                            '3'  =>  __( 'Redirect iFrame Request to Custom Url', ALBPLAYER_TXTD ), 
                                        ],
                                        'toggle' => array(
                                            '1'         => '',
                                            '2'         => '#albaplayer-protections-iframe-msg-option',
                                            '3'         => '#albaplayer-protections-iframe-redirect-option',
                
                                        ),
                                    ],
                                    [
                                        'title' =>  esc_html__('Redirect link', ALBPLAYER_TXTD),
                                        "id"    => "redirect",
                                        'type'  => 'text',
                                        'input_class'   => 'ltr regular-text',
                                        'class'   => 'albaplayer-protections-iframe-protocol-option-options',
                                        'desc'  => esc_html__('used to redirect the visitor to another page when he tries to open inspect element Developer tools', ALBPLAYER_TXTD),
                                    ],
                                    [
                                        'title' =>  esc_html__('Message Text', ALBPLAYER_TXTD),
                                        "id"    => "msg",
                                        'type'  => 'textarea',
                                        'class'   => 'albaplayer-protections-iframe-protocol-option-options',
                                        'input_class'   => 'regular-text',
                                        'atts'  => 'rows="4"',
                
                                    ],
                                    [
                                        'title'         =>  esc_html__('Allowed Sites', ALBPLAYER_TXTD),
                                        "id"            => "allowedes",
                                        "type"          => "repeater",
                                        "empty"         => true,
                                        'button_class'  => '',
                                        'has_count'     => false,
                                        'class'         => 'last-child',
                                        'button_title'  => __('Add domain', ALBPLAYER_TXTD) ,
                                        "desc"    => esc_html__('قم باضافة دومينات المواقع الذي تحب ان تسمح لها بتشغيل ايفريم البث', ALBPLAYER_TXTD),

                                        "fields" => array(
                                            array(
                                                'title'	        => __('Domains', ALBPLAYER_TXTD),
                                                'has_row'       => false,
                                                "id"            => "url",
                                                "def_val"       => true ,
                                                "namea"         => "albaplayer[protections][iframe][allowedes][]",
                                                'input_class'   => 'regular-text',
                                                'type'          => 'url',
                                            )
                                        )
                                    ],
                                    [
                                        "id"    => "block_iframedsd",
                                        'type'  => 'html',
                                        'content'=> '</div>',
                                    ],
                                ]
                                    
                            ]

                        ]//fields

                        
                    ],
                ]
            ];
        
            $sections = apply_filters( "aplr_option_sections_hook", $sections);
        
            return $sections;
        }
        public static function default_values() {
    
            $default_values = array(
                "sitename"  => get_bloginfo('name'),
                "nav_btn" => [
                    "color"     => "#552a86",
                    "color_sec" => "#9e1414",
                    "pos"       => "t",
                    "stretch"   => "1",
                    "style"     => "1",
                    "radius"    => "1",
                    "size"      => "m",
                ],
                "refresh_btn" => [
                    "stat"      => "1",
                    "pos"       => "1",
                    "layout"    => "2",
                    "bg"        => "#162133",
                ],
                "share_btn" => [
                    "stat"      => "1",
                    "pos"       => "2",
                    "layout"    => "2",
                    "bg"        => "#162133",
                ],
                "logo"      => [
                    "src" => "", 
                    "position" => "top-right" 
                ],
                "poster"    => "",
                "notification" => [
                    "stat"      => "0",
                    "skin"      => "light",
                    "type"      => "telegram",
                    "pos"       => "right",
                    "url"       => "",
                    "title"     => __('Subscribe with us', ALBPLAYER_TXTD),
                    "btn_title" => __('Click to Subscribe', ALBPLAYER_TXTD),
                    "message"   => __("Our free service for watching today's matches broadcast live without interruption on Telegram", ALBPLAYER_TXTD),
                ],
                "ads"           => [
                    "stat"      => "",
                    "head_cod"  => "",
                    "footer_cod"=> "",
                    "banner"    => [
                        "timer"     => "",
                        "timer_sec" => "5",
                        "ad"        => "",
                    ]
                ],
                "protections"   => [
                    "dev_tools" => [
                        "stat"      => "",
                        "protocol"  => "1",
                        "r_click"   => "",
                        "redirect"  => "",
                    ],
                    "player_page" => [
                        "stat"      => "",
                        "protocol"  => "1",
                        "redirect"  => "",
                        "msg"       => "",
                    ],
                    "iframe"        => [
                        "stat"      => "",
                        "protocol"  => "1",
                        "redirect"  => "",
                        "msg"       => "",
                        "msg"       => "",
                        "allowedes" => []
                    ],
                ],
            );
    
            $values = apply_filters( "aplr_default_options_values_hook", $default_values);
    
            return $values;
    
        }
    }

}