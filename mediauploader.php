<?php
/*
Plugin Name: The Media Uploader
Plugin URI: http://www.uzbuz.com
Description: Adds media uploader support to the front-end for themes.
Version: 1.0
Author: Josua Leonard
Author URI: http://www.uzbuz.com
License: GNU General Public License v2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html
*/

/**
 * Class: The_Media_Uploader
 */

class The_Media_Uploader {
  /* Global variables */
  static $default_max_upload_size = 5242880; // 5*1024*1024=5Mb
  static $default_max_width = 1200;
  static $default_max_height = 1200;
  static $default_image_quality = 100;

  // To initialize the class without global variable
  public static function init(){
    $class = __CLASS__;
    new $class;
  }

  /* Plugin Construction */
  function __construct() {
    //add_shortcode("media-uploader", array($this,"media_uploader_shortcode"));
    // Set priority lower than enqueue action in theme-settings,
    // so we can check if a script has been enqueued
    add_action('wp_enqueue_scripts', array($this, 'action_enqueue_scripts'), 11);
    add_action('network_admin_menu', array($this, 'action_network_admin_menu'));
    add_action('wp_ajax_plupload_action', array($this, 'g_plupload_action'));
    add_action('wp_ajax_logo_plupload_action', array($this, 'g_logo_plupload_action'));
    add_action('wp_ajax_user_photo_plupload_action', array($this, 'g_user_photo_plupload_action'));
    add_action('wp_ajax_accolade_plupload_action', array($this, 'g_accolade_plupload_action'));
    /* Used in toolbox manage media module */
    add_action('wp_ajax_delete_media', array($this, 'delete_media_callback'));
    add_action('wp_ajax_tag_media', array($this, 'tag_media_callback'));
    add_action('wp_ajax_add_video', array($this, 'add_video_callback'));
    add_action('wp_ajax_delete_media_taxonomy', array($this, 'delete_media_taxonomy_callback'));
    add_action('tb_new_media', array($this, 'tb_new_media'));
    add_action('tb_accolade_image_change', array($this, 'tb_accolade_image_change'));
  }

  /**
   * Load javascript for the plugin.
   *
   * @uses wp_script_is, wp_enqueue_script, plugins_url, add_action, get_site_option, get_blog_option, wp_localize_script, wp_enqueue_style, includes_url
   * @action template_redirect
   * @return null
   */
  function action_enqueue_scripts(){
    if(is_user_logged_in() && strstr($_SERVER['REQUEST_URI'], 'toolbox')){
      if(!wp_script_is('toolbox-spinner'))
        wp_enqueue_script('toolbox-spinner', plugins_url('spinner.min.js', __FILE__), array('jquery'), '20121205');
      wp_enqueue_script('custom-plupload-core', plugins_url('plupload/plupload.full.js', __FILE__), array(), '1.5.7');
      wp_enqueue_script('custom-plupload-html5', plugins_url('plupload/plupload.html5.js', __FILE__), array(), '1.5.7');
      wp_enqueue_script('custom-plupload-flash', plugins_url('plupload/plupload.flash.js', __FILE__), array(), '1.5.7');
      wp_enqueue_script('custom-plupload-silverlight', plugins_url('plupload/plupload.silverlight.js', __FILE__), array(), '1.5.7');
      wp_enqueue_script('custom-plupload-html4', plugins_url('plupload/plupload.html4.js', __FILE__), array(), '1.5.7');
      wp_enqueue_script('the-media-uploader', plugins_url('mediauploader.js', __FILE__), array(), '20121205');

      $settings = (get_site_option('mediauploader_settings'))?get_site_option('mediauploader_settings'):get_blog_option(1, 'mediauploader_settings');
      if(!$settings){
        $settings = array(
          "max_upload_size"=>self::$default_max_upload_size,
          "max_width"=>self::$default_max_width,
          "max_height"=>self::$default_max_height,
          "image_quality"=>self::$default_image_quality
        );
      }

      // Default settings for plupload
      $plupload_init = array(
        'runtimes' => 'html5,flash,html4,silverlight',
        'browse_button' => 'plupload-browse-button', // default, changed later
        'container' => 'plupload-upload-ui', // default, changed later
        'drop_element' => false,
        'file_data_name' => 'async-upload', // default, changed later
        'multiple_queues' => false,
        'max_file_size' => $settings["max_upload_size"].'b',
        'url' => admin_url('admin-ajax.php'),
        'flash_swf_url' => plugins_url('media-uploader/plupload/plupload.flash.swf'),
        'silverlight_xap_url' => plugins_url('media-uploader/plupload/plupload.silverlight.xap'),
        'filters' => array(array('title' => __('Image Files'), 'extensions' => "jpg,png,jpeg,gif")),
        'multipart' => true,
        'urlstream_upload' => true,
        'multi_selection' => false,
         // additional post data to send to our ajax hook
        'multipart_params' => array(
          '_ajax_nonce' => wp_create_nonce('pluloader'), // will be added per uploader
          'action' => 'plupload_action', // the ajax action name
          'imgid' => 0 // default, will be changed later
        ),
        'resize'=> array(
          'width'=> $settings["max_width"],
          'height'=> $settings["max_height"],
          'quality'=> $settings["image_quality"]
        )
      );
      // Load plupload settings into javascript
      wp_localize_script('the-media-uploader', 'plupload_base_settings',$plupload_init);
      wp_enqueue_style( 'the-media-uploader', plugins_url( 'mediauploader.css', __FILE__ ));
    }
  }

  /**
   * Saving current uploaded image into upload directory and add as attachment into library
   *
   * @uses wp_handle_upload, wp_generate_attachment_metadata, wp_update_attachment_metadata, get_attachment_link, wp_get_attachment_thumb_url
   * @action wp_ajax_plupload_action
   * @return null
   */
  function g_plupload_action() {
    // Globalize variable tobe able to access in the template
    global $template_params;

    $img_id = $_POST["img_id"];
    $post_id = $_POST["post_id"];
    $template = $_POST["template"];
    $page = $_POST["page"];
    if($post_id=='') $post_id=0;

    // Handle file upload
    $status = wp_handle_upload($_FILES['file_'.$img_id], array('test_form' => false, 'action' => 'plupload_action'));
    $status["status_code"] = 0;

    // If status is containing minimum 3 parameter: url, uri, and type
    if(count($status)>2){
      $image = $status["url"];
      $wp_upload_dir = wp_upload_dir(); // Get the wp upload dir
      $file = basename($image); // Grab just filename
      $path = $wp_upload_dir['path'].'/'.$file; // Create URI

      $image_size = getimagesize($path);
      //var_dump($image_size);
      //echo "\n\n";
      $this->image_fix_orientation($path);

      $image_size = getimagesize($path);
      //var_dump($image_size);
      //echo "\n\n";

      if($image_size[0]>=600 && $image_size[1]>=450){
        $wp_filetype = wp_check_filetype($file); // Get MIME type
        // Create attachment data
        $attachment_data = array(
          'guid' => $image,
          'post_mime_type' => $wp_filetype['type'],
          'post_title' => preg_replace('/\.[^.]+$/','', $file)
        );
        //These 4 lines actually insert the attachment into the Media Library using the attachment_data array created above.
        $attach_id = wp_insert_attachment($attachment_data, $path, $post_id);
        //Yes, you do "require" the following line of code
        require_once(ABSPATH."wp-admin".'/includes/image.php');
        $attach_data = wp_generate_attachment_metadata($attach_id, $path);
        wp_update_attachment_metadata($attach_id,$attach_data);
        // Get permalink (in case needed), this also creates many file with various sizes
        $template_params['attachment_id'] = $attach_id;
        $template_params['attachment_thumb'] = wp_get_attachment_thumb_url($attach_id); // Get thumbnail url
        $template_params['media_type'] = "photo";
        $image_src = wp_get_attachment_image_src($attach_id, 'full');
        apply_filters('tb_new_media', array(
          'type'  => $template_params['media_type'],
          'thumb' => $template_params['attachment_thumb'],
          'full'  => $image_src[0],
          'page'  => $page
        ));
        // Redirect echo into string
        ob_start();
        // Load those variables into our template
        load_template(plugin_dir_path(__FILE__).'templates/'.$template.'.php', true);
        $string = ob_get_contents();
        ob_end_clean();
        $status["status_code"] = 1;
        $status["html"] = $string;

        // Destroy used attachment variables
        unset($attach_id, $attach_data, $attachment_data, $file, $path, $wp_filetype);
      }
      else {
        unlink($path);
        $status["status_code"] = 0;
        $status["error"] = ' Image needs to be at least 600x450 px, this image is '.$image_size[0].'x'.$image_size[1].' px.';
      }
    }
    echo json_encode($status);
    exit;
  }

  /**
   * Removing existing logo image, add new uploaded image, and set it as default header image
   *
   * @uses wp_handle_upload, wp_generate_attachment_metadata, wp_update_attachment_metadata, get_attachment_link, wp_get_image_editor, wp_delete_attachment, add_post_meta, json_encode
   * @action wp_ajax_logo_plupload_action
   * @return null
   */
  function g_logo_plupload_action() {
    $img_id = $_POST["img_id"];

    // Handle file upload
    $status = wp_handle_upload($_FILES['file_'.$img_id], array('test_form' => false, 'action' => 'logo_plupload_action'));
    $status["status_code"] = 0;

    // If status is containing minimum 3 parameter: url, uri, and type
    if(count($status)>2){
      $image = $status["url"];
      $wp_upload_dir = wp_upload_dir(); // Get the wp upload dir
      $file = basename($image); // Grab just filename
      $path = $wp_upload_dir['path'].'/'.$file; // Create URI
      $wp_filetype = wp_check_filetype($file); // Get MIME type
      // Create attachment data
      $attachment_data = array(
        'guid' => $image,
        'post_mime_type' => $wp_filetype['type'],
        'post_title' => preg_replace('/\.[^.]+$/','', $file)
      );
      //These 4 lines actually insert the attachment into the Media Library using the attachment_data array created above.
      $attach_id = wp_insert_attachment($attachment_data, $path, 0);
      //Yes, you do "require" the following line of code
      require_once(ABSPATH."wp-admin".'/includes/image.php');
      $attach_data = wp_generate_attachment_metadata($attach_id, $path);
      wp_update_attachment_metadata($attach_id,$attach_data);
      // Get permalink (in case needed), this also creates many file with various sizes
      $image = wp_get_image_editor($status["file"]); // Return an implementation that extends <tt>WP_Image_Editor</tt>
      if(!is_wp_error($image)){
        $image->resize(300, 200, false);
        $image->save($status["file"]);
      }

      // Get all header images
      $args = array(
        'numberposts' => -1,
        'post_type' => 'attachment',
        'post_status' => 'any',
        'post_parent' => null,
        'meta_key' => '_wp_attachment_is_custom_header',
        'meta_value' => get_option('stylesheet')
      );
      $posts = get_posts($args);

      // Remove all existing header images
      if($posts){
        foreach ($posts as $post) {
          wp_delete_attachment($post->ID, true);
        }
      }

      // Make currently uploaded image as header image
      update_post_meta($attach_id, '_wp_attachment_context', 'custom-header');
      update_post_meta($attach_id, '_wp_attachment_is_custom_header', get_option('stylesheet'));
      
      // Set it as custom header image
      $args = array(
        'width'         => 300,
        'height'        => 200,
        'default-image' => $status["url"],
        'thumbnail_url' => $status['url'],
        'url'           => $status['url'],
      );
      add_theme_support('custom-header', $args);
      set_theme_mod( 'header_image', $status['url'] );
      set_theme_mod( 'header_image_data', $args );

      $status["status_code"] = 1;

      // Destroy used attachment variables
      unset($attach_id, $attach_data, $attachment_data, $file, $path);
    }
    echo json_encode($status);
    exit;
  }

  /**
   * Removing existing user photo, add new uploaded image, and set it as user photo
   *
   * @uses wp_handle_upload, wp_generate_attachment_metadata, wp_update_attachment_metadata, get_attachment_link, wp_get_image_editor, wp_delete_attachment, add_post_meta, json_encode
   * @action wp_ajax_logo_plupload_action
   * @return null
   */
  function g_user_photo_plupload_action() {
    $img_id = $_POST["img_id"];

    // Handle file upload
    $status = wp_handle_upload($_FILES['file_'.$img_id], array('test_form' => false, 'action' => 'user_photo_plupload_action'));
    $status["status_code"] = 0;

    // If status is containing minimum 3 parameter: url, uri, and type
    if(count($status)>2){
      $image = $status["url"];
      $wp_upload_dir = wp_upload_dir(); // Get the wp upload dir
      $file = basename($image); // Grab just filename
      $path = $wp_upload_dir['path'].'/'.$file; // Create URI
      $wp_filetype = wp_check_filetype($file); // Get MIME type
      // Create attachment data
      $attachment_data = array(
        'guid' => $image,
        'post_mime_type' => $wp_filetype['type'],
        'post_title' => preg_replace('/\.[^.]+$/','', $file)
      );
      //These 4 lines actually insert the attachment into the Media Library using the attachment_data array created above.
      $attach_id = wp_insert_attachment($attachment_data, $path, 0);
      //Yes, you do "require" the following line of code
      require_once(ABSPATH."wp-admin".'/includes/image.php');
      $attach_data = wp_generate_attachment_metadata($attach_id, $path);
      wp_update_attachment_metadata($attach_id,$attach_data);
      // Get permalink (in case needed), this also creates many file with various sizes
      $image = wp_get_image_editor($status["file"]); // Return an implementation that extends <tt>WP_Image_Editor</tt>
      if(!is_wp_error($image)){
        $image->resize(200, 200, true);
        $image->save($status["file"]);
      }

      $user_id = get_current_user_id();
      $current_photo = get_user_meta($user_id, 'attachment_id', true);
      // Remove all existing user photo
      if($current_photo!=''){
        wp_delete_attachment($current_photo, true);
      }

      delete_user_meta($user_id, 'attachment_id');
      update_user_meta($user_id, 'attachment_id', $attach_id);
      delete_user_meta($user_id, 'user_photo_type');
      update_user_meta($user_id, 'user_photo_type', 'upload');

      $status["status_code"] = 1;

      // Destroy used attachment variables
      unset($attach_id, $attach_data, $attachment_data, $file, $path);
    }
    echo json_encode($status);
    exit;
  }

  /**
   * Removing existing accolade image and add new accolade image
   *
   * @uses wp_handle_upload, wp_generate_attachment_metadata, wp_update_attachment_metadata, get_attachment_link, wp_get_image_editor, get_post_meta, wp_delete_attachment
   * @action wp_ajax_accolade_plupload_action
   * @return null
   */
  function g_accolade_plupload_action() {
    // Globalize variable tobe able to access in the template

    $img_id  = $_POST["img_id"];
    $old_id  = $_POST["current_id"];
    $post_id = $_POST["post_id"];
    $name    = $_POST["name"];
    $type    = $_POST["type"];

    // Handle file upload
    $status = wp_handle_upload($_FILES['file_'.$img_id], array('test_form' => false, 'action' => 'accolade_plupload_action'));
    $status["status_code"] = 0;

    // If status is containing minimum 3 parameter: url, uri, and type
    if(count($status)>2){
      $image = $status["url"];
      $wp_upload_dir = wp_upload_dir(); // Get the wp upload dir
      $file = basename($image); // Grab just filename
      $path = $wp_upload_dir['path'].'/'.$file; // Create URI
      $wp_filetype = wp_check_filetype($file); // Get MIME type
      // Create attachment data
      $attachment_data = array(
        'guid' => $image,
        'post_mime_type' => $wp_filetype['type'],
        'post_title' => preg_replace('/\.[^.]+$/','', $file)
      );
      //These 4 lines actually insert the attachment into the Media Library using the attachment_data array created above.
      if($post_id=="") $post_id = 0;
      $attach_id = wp_insert_attachment($attachment_data, $path, $post_id);
      set_post_thumbnail( $post_id, $attach_id );
      //Yes, you do "require" the following line of code
      require_once(ABSPATH."wp-admin".'/includes/image.php');
      $attach_data = wp_generate_attachment_metadata($attach_id, $path);
      wp_update_attachment_metadata($attach_id,$attach_data);
      // Get permalink (in case needed), this also creates many file with various sizes
      $image = wp_get_image_editor($status["file"]); // Return an implementation that extends <tt>WP_Image_Editor</tt>

      // Resize it
      if(!is_wp_error($image)){
        $image->resize(150, 150, true);
        $image->save($status["file"]);
      }

      // Delete the old one
      if($old_id) wp_delete_attachment($old_id, true);

      $status["status_code"] = 1;
      // Return new attachment ID
      $status["id"] = $attach_id;

      apply_filters('tb_accolade_image_change', array(
        'accolade_name'  => $name,
        'accolade_type'  => ucfirst($type)
      ));

      // Destroy used attachment variables
      unset($attach_id, $attach_data, $attachment_data, $file, $path);
    }
    echo json_encode($status);
    exit;
  }

  /**
   * Shows admin menu for the media uploader
   *
   * @uses add_options_page
   * @action network_admin_menu
   * @return null
   */
  function action_network_admin_menu(){
    add_submenu_page('settings.php', 'Media Uploader', 'Media Uploader', 'manage_options', 'mediaupload_setting', array($this, 'media_uploader_admin'));
  }

  /**
   * The functions for media uploader admin
   *
   * @uses update_option, get_site_option, get_blog_option, add_settings_error, settings_error, screen_icon
   * @action admin_menu
   * @return null
   */
  function media_uploader_admin(){
    // Create default settings
    $max_upload_size = self::$default_max_upload_size;
    $max_width = self::$default_max_width;
    $max_height = self::$default_max_height;
    $image_quality = self::$default_image_quality;

    if(isset($_POST['submit'])){
      if($_POST['max_upload_size']!='') $max_upload_size = $_POST['max_upload_size'];
      if($_POST['max_width']!='') $max_width = $_POST['max_width'];
      if($_POST['max_height']!='') $max_height = $_POST['max_height'];
      if($_POST['image_quality']!='') $image_quality = $_POST['image_quality'];
      
      $new_settings = array(
        'max_upload_size' => $max_upload_size,
        'max_width' => $max_width,
        'max_height' => $max_height,
        'image_quality' => $image_quality
      );
      update_site_option('mediauploader_settings', $new_settings);

      add_settings_error('general', 'settings_updated', __('Settings saved.'), 'updated');
    }
    else if((get_site_option('mediauploader_settings'))?get_site_option('mediauploader_settings'):get_blog_option(1, 'mediauploader_settings')){
      $settings = (get_site_option('mediauploader_settings'))?get_site_option('mediauploader_settings'):get_blog_option(1, 'mediauploader_settings');
      $max_upload_size = $settings['max_upload_size'];
      $max_width = $settings['max_width'];
      $max_height = $settings['max_height'];
      $image_quality = $settings['image_quality'];
    }
    settings_errors();

    ?>
      <div class="wrap">
        <?php screen_icon(); ?>
        <h2>Media Uploader Settings</h2>
        <form method="post" action="">
          <table class="form-table">
          <tr valign="top">
          <th scope="row">Maximum upload size</th>
          <td>
            <input type="text" name="max_upload_size" value="<?=$max_upload_size?>" /> bytes
            <p class="description">Maximum image file size in bytes</p>
          </td>
          </tr>
          <tr valign="top">
          <th scope="row">Image resolution</th>
          <td>
            <input type="text" name="max_width" class="small-text" value="<?=$max_width?>" /> x
            <input type="text" name="max_height" class="small-text" value="<?=$max_height?>" />
            <p class="description">Image resolution in pixels, width x height.</p>
          </td>
          </tr>
          <tr valign="top">
          <th scope="row">Image quality</th>
          <td>
            <input type="text" name="image_quality" class="small-text" value="<?=$image_quality?>" /> %
            <p class="description">Image quality in percent.</p>
          </td>
          </tr>
          </table>
          <?php submit_button(); ?>
        </form>
      </div>
      
    <?php
  }

  /**
   * Media uploader shortcode
   *
   * @uses is_user_logged_in, ob_start, ob_get_conents, ob_end_clean
   * @action init
   * @return shortcode string
   */
  function media_uploader_shortcode($atts){
    global $template_params;
    
    $string = 'You must login wordpress to see this code running. <a href="/wpmulti/wp-admin">Here</a>';
    if(is_user_logged_in()){
      $string = "<p>";
      $string .=
        "<button type='button' id='photo-add-".$atts["target"]."' class='btn add-media' type='file' ".
        "data-post-id='".$atts["post"]."' ".
        "data-target-id='".$atts["target"]."' ".
        "data-template='".$atts["template"]."'><i class=\"icon-camera\"></i>Add photo</button>".
        "<ul id=\"".$atts["target"]."\" class=\"thumbnails media-thumbnails\">";
      // Load post attachment, for debugging purposes
      $args = array(
        'post_type' => 'attachment',
        'numberposts' => 9,
        'post_status' => null,
        'post_parent' => $atts["post"]
      );
      $attachments = get_posts($args);
      if ($attachments) {
        foreach ($attachments as $attachment) {
          // FIlls variable content
          $template_params['attachment_id'] = $attachment->ID;
          $template_params['attachment_link'] = get_attachment_link($attachment->ID);
          $template_params['attachment_thumb'] = wp_get_attachment_thumb_url($attachment->ID);
          // Redirect echo into string
          ob_start();
          load_template(plugin_dir_path(__FILE__).'templates/'.$atts["template"].'.php', false);
          $string .= ob_get_contents();
          ob_end_clean();
        }
      }
      $string .= "</ul>";
      $string .= "</p>";
    }
    return $string;
  }

  /**
   * Ajax function for adding video on manage media module
   *
   * @uses wp_insert_post, load_template, add_post_meta, preg_match, ob_start, ob_end_clean, ob_get_contents, json_encode
   * @action wp_ajax_add_video
   * @return void
   */
  function add_video_callback(){
    /* Set global for usage in template */
    global $template_params;
    $video_link = $_POST['video_link'];
    $template = $_POST['template'];
    $page = $_POST['page'];
    $html = '';

    // Checks for any YouTube URL. After http(s) support a or v for Youtube Lyte and v or vh for Smart Youtube plugin
		if(!isset($matches[1])){
			preg_match('#(?:https?(?:a|vh?)?://)?(?:www\.)?youtube(?:\-nocookie)?\.com/watch\?.*v=([A-Za-z0-9\-_]+)#', $video_link, $matches);
		}
		// Checks for any shortened youtu.be URL. After http(s) a or v for Youtube Lyte and v or vh for Smart Youtube plugin
		if(!isset($matches[1])){
			preg_match('#(?:https?(?:a|vh?)?://)?youtu\.be/([A-Za-z0-9\-_]+)#', $video_link, $matches);
		}

    // If it is a youtube video
    if(isset($matches[1])){
      // Get youtube video thumbnail
			$video_thumbnail = 'http://img.youtube.com/vi/'.$matches[1].'/0.jpg';
      // Normalize youtube video link
      $video_link = 'http://www.youtube.com/watch?v='.$matches[1];

      // Create new post object with type videos
      $post_data = array(
        'post_title'    => $video_link,
        'post_content'  => '',
        'post_excerpt'  => '',
        'post_status'   => 'publish',
        'post_type'   => 'videos',
        'post_author'   => 1,
        'post_category' => array()
      );
      // Insert the post into the database, return post id if success
      $post_id = wp_insert_post($post_data);

      // Add post success
      if($post_id>0){
        // Now add thumbnail link to post meta
        add_post_meta($post_id, 'video_thumbnail', $video_thumbnail);

        // Fill variables value for template
        $template_params['attachment_id'] = $post_id;
        $template_params['attachment_thumb'] = $video_thumbnail;
        $template_params['media_type'] = 'video';
        $template_params['media_caption'] = '';
        $template_params['media_description'] = '';
        apply_filters('tb_new_media', array(
          'type'  => $template_params['media_type'],
          'thumb' => $template_params['attachment_thumb'],
          'full'  => $video_link,
          'page'  => $page
        ));

        // Get template, redirect echo into string
        ob_start();
        load_template(plugin_dir_path(__FILE__).'templates/'.$template.'.php', false);
        $html = ob_get_contents();
        ob_end_clean();

        // Set function return status and message
        $status_code = 1;
        $status_message = 'Successfully adding new video';
      }
      else {
        $status_code = 0;
        $status_message = 'Failed to add video';
      }
    }
    else {
      $status_code = 0;
      $status_message = 'Please add a valid video link';
    }

    // Return ajax response as json string
    die(json_encode(array('status'=>$status_code,'status_message'=>$status_message, 'html'=>$html)));
  }

  /**
   * Ajax function for delete photo (post type attachment) and video (post type videos) on manage media module
   *
   * @uses wp_delete_attachment, wp_delete_post, json_encode
   * @action wp_ajax_delete_media
   * @return void
   */
  function delete_media_callback(){
    $media_id = $_POST['media_id'];
    $media_type = $_POST['media_type'];

    $delete_status = 0;
    $media_post = get_post($media_id);

    // Different type, different ways of deleting post.
    // Delete photo as an attachment so wp will remove all the images files
    if($media_type=='photo'){
      // Delete attachment, attachment id = $media_id, force_delete = true
      $delete_status = wp_delete_attachment($media_id, true);
    }
    // Video is a post
    else if($media_type=='video'){
      // Delete post, post id = $media_id, force_delete = true
      $delete_status = wp_delete_post($media_id, true);
    }

    // Create status code and status message
    if($delete_status){
      $status_code = 1;
      $status_message = "Successfully deleting ".$media_type;
    }
    else {
      $status_code = 0;
      $status_message = "Failed to delete ".$media_type;
    }

    // It's already deleted, no need to hassle with it
    if(!$media_post) $status_code = -1;

    // Return ajax response as json string
    die(json_encode(array('status'=>$status_code,'status_message'=>$status_message)));
  }

  /**
   * Ajax function for tagging media caption and description on manage media module
   *
   * @uses wp_update_post, json_encode
   * @action wp_ajax_tag_media
   * @return void
   */
  function tag_media_callback(){
    $media_id = $_POST['media_id'];
    $media_type = $_POST['media_type'];
    $media_caption = $_POST['media_caption'];
    $media_description = $_POST['media_description'];

    // Create post data to be updated
    $post = array();
    $post['ID'] = $media_id;
    $post['post_excerpt'] = $media_caption;
    $post['post_content'] = $media_description;

    // Update the attachment into the database
    $update_status = wp_update_post($post);

    // Set status code and status message
    if($update_status){
        $status_code = 1;
        $status_message = "Successfully updating ".$media_type." tag";
    }
    else {
      $status_code = 0;
      $status_message = "Failed to update ".$media_type." tag";
    }

    // Return ajax response as json string
    die(json_encode(array('status'=>$status_code,'status_message'=>$status_message)));
  }

  /**
   * Ajax function to clear a media taxonomy
   *
   * @return void
   */
  public function delete_media_taxonomy_callback(){
    $post_id = $_POST['post_id'];
    $taxonomy = $_POST['taxonomy'];
    $args = array(
      'ID' => $post_id,
      'post_parent' => null
    );
    wp_update_post($args);
    wp_set_object_terms($post_id, array(), $taxonomy, FALSE);
    // Return ajax response as json string
    die(json_encode(array('status'=>1,'status_message'=>'Media term deleted')));
  }

  /**
   * Public function for pre loading exsisting media and show it on manage media module
   *
   * @uses get_posts, get_attachment_link, wp_get_attachment_thumb_url, get_post_permalink, get_post_meta, load_template, ob_start, ob_end_clean, ob_get_contents
   * @action
   * @return string
   */
  public function media_manage_list_media($template, $type='', $media_taxonomy=null, $media_terms=null, $parent=0){
    /* Set global for usage in template */
    global $template_params;
    $html = '';

    if($type=='photos') $post_type = array('attachment');
    else if($type=='videos') $post_type = array('videos');
    else $post_type = array('attachment', 'videos');
    
    // Load all items of these types of video with any post status
    $args = array(
      'post_type' => $post_type,
      'numberposts' => -1,
      'post_status' => 'any'
    );
    if($parent>-1){
      $args['post_parent'] = $parent;
    }
    if($media_taxonomy){
      if(!is_array($media_terms)) $args[$media_taxonomy] = $media_terms;
    }
    // Do get it
    $posts = get_posts($args);

    // Post loaded
    if($posts){
      foreach ($posts as $post) {
        $is_user_photo = get_post_meta($post->ID, 'is_photo', true);
        if((!isset($post->post_parent) || $post->post_parent==0 || !isset($args['post_parent'])) && $is_user_photo!=1){
          $attachment_id = $post->ID;
          $template_params['attachment_id'] = $post->ID;
          $context = get_post_meta($attachment_id, '_wp_attachment_context', true);
          if($context!="custom-header"){
            // Different type of post, different ways to load contents
            if($post->post_type=='attachment'){
              $template_params['attachment_thumb'] = wp_get_attachment_thumb_url($attachment_id);
              $template_params['media_type'] = 'photo';
            }
            else {
              $video_thumbnail = get_post_meta($attachment_id, 'video_thumbnail', true);
              $template_params['attachment_thumb'] = $video_thumbnail;
              $template_params['media_type'] = 'video';
            }
            // In our media, excerpt is caption
            $template_params['media_caption'] = $post->post_excerpt;
            // In our media, description is post content
            $template_params['media_description'] = $post->post_content;

            if($media_taxonomy && is_array($media_terms)){
              $terms = wp_get_post_terms($attachment_id, $media_taxonomy);
              $first_term_slug = (isset($terms[0]) && isset($terms[0]->slug))? $terms[0]->slug : '';
              if(in_array($first_term_slug, $media_terms)){
                // Load template from file, redirect echo into string
                ob_start();
                load_template(plugin_dir_path(__FILE__).'templates/'.$template.'.php', false);
                $html .= ob_get_contents();
                ob_end_clean();
              }
            }
            else {
              $template_params['taxonomy'] = '';
              if($media_taxonomy && !is_array($media_terms)) $template_params['taxonomy'] = $media_taxonomy;
              // Load template from file, redirect echo into string
              ob_start();
              load_template(plugin_dir_path(__FILE__).'templates/'.$template.'.php', false);
              $html .= ob_get_contents();
              ob_end_clean();
            }
          }
        }
      }
    }

    // Returns the html for list of media
    return $html;
  }

  /**
   * Get media template
   *
   * @uses load_template, ob_start, ob_end_clean, ob_get_contents
   * @action
   * @return void
   */
  public function get_media_template($template, $name){
    /* Set global for usage in template */
    global $template_params;
    $html = '';
    $template_params['attachment_id'] = 'template'.(($name)?'-'.$name:'');
    $template_params['attachment_thumb'] = '';
    $template_params['media_type'] = '';
    $template_params['media_caption'] = '';
    // In our media, description is post content
    $template_params['media_description'] = '';
    // Load template from file, redirect echo into string
    ob_start();
    load_template(plugin_dir_path(__FILE__).'templates/'.$template.'.php', false);
    $html .= ob_get_contents();
    ob_end_clean();

    // Returns the html for list of media
    return $html;
  }

  /**
   * Hook for newly uploaded media
   *
   * @param $media
   */
  function tb_new_media($media){
    do_action('notify_new_media', $media);
  }

  /**
   * Hook for accolade image change
   *
   * @param $media
   */
  function tb_accolade_image_change($media){
    do_action('notify_change_accolade_image', $media);
  }

  function image_fix_orientation($path){
    $exif = @exif_read_data($path);
    //var_dump($exif);
    $mime_type = $exif['MimeType'];
    $image = false;
    switch ( $mime_type ) {
      case 'image/jpeg':
        $image = imagecreatefromjpeg($path);
        break;
      case 'image/png':
        $image = imagecreatefrompng($path);
        break;
      case 'image/gif':
        $image = imagecreatefromgif($path);
        break;
    }
    $orientation = $exif['Orientation'];
    if($image){
      if (!empty($orientation)) {
        $rotated = false;
        switch ($orientation) {
          case 3:
            $image = imagerotate($image, 180, 0);
            $rotated = true;
            break;
          case 6:
            $image = imagerotate($image, -90, 0);
            $rotated = true;
            break;
          case 8:
            $image = imagerotate($image, 90, 0);
            $rotated = true;
            break;
        }
        if($rotated){
          switch ( $mime_type ) {
            case 'image/jpeg':
              imagejpeg($image, $path, 100);
              break;
            case 'image/png':
              imagepng($image, $path, 100);
              break;
            case 'image/gif':
              imagegif($image, $path, 100);
              break;
          }
        }
      }
    }
  }
};

/**
 * Initialize The_Media_Uploader
 */
add_action( 'plugins_loaded', array( 'The_Media_Uploader', 'init'), 10);