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
    add_shortcode("media-uploader", array($this,"media_uploader_shortcode"));
    add_action('template_redirect', array($this, 'action_load_dependencies'));
    add_action('admin_menu', array($this, 'action_admin_menu'));
    add_action('wp_ajax_plupload_action', array($this, 'g_plupload_action'));
    add_action('wp_ajax_logo_plupload_action', array($this, 'g_logo_plupload_action'));
    add_action('wp_ajax_accolade_plupload_action', array($this, 'g_accolade_plupload_action'));
    /* Used in toolbox manage media module */
    add_action('wp_ajax_delete_media', array($this, 'delete_media_callback'));
    add_action('wp_ajax_tag_media', array($this, 'tag_media_callback'));
    add_action('wp_ajax_add_video', array($this, 'add_video_callback'));
  }

  /**
   * Load all required files for the plugin to run.
   *
   * @uses wp_enqueue_script, plugins_url, add_action, get_option, wp_localize_script, wp_enqueue_style, includes_url
   * @action template_redirect
   * @return null
   */
  function action_load_dependencies() {
    wp_enqueue_script('the-media-uploader-spinner', plugins_url('spinner.min.js', __FILE__), array('jquery'), '20121205');
    wp_enqueue_script('the-media-uploader', plugins_url('mediauploader.js', __FILE__), array('plupload-all'), '20121205');
    $settings = get_option('mediauploader_settings');
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
      'flash_swf_url' => includes_url('js/plupload/plupload.flash.swf'),
      'silverlight_xap_url' => includes_url('js/plupload/plupload.silverlight.xap'),
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

  /**
   * Saving current uploaded image into upload directory and add as attachment into library
   *
   * @uses wp_handle_upload, wp_generate_attachment_metadata, wp_update_attachment_metadata, get_attachment_link, wp_get_attachment_thumb_url
   * @action wp_ajax_plupload_action
   * @return null
   */
  function g_plupload_action() {
    // Globalize variable tobe able to access in the template
    global $attachment_id, $attachment_link, $attachment_thumb, $media_type;

    $img_id = $_POST["img_id"];
    $post_id = $_POST["post_id"];
    $template = $_POST["template"];
    if($post_id=='') $post_id=0;

    // Handle file upload
    $status = wp_handle_upload($_FILES['file_'.$img_id], array('test_form' => true, 'action' => 'plupload_action'));
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
      $attach_id = wp_insert_attachment($attachment_data, $path, $post_id);
      //Yes, you do "require" the following line of code
      require_once(ABSPATH."wp-admin".'/includes/image.php');
      $attach_data = wp_generate_attachment_metadata($attach_id, $path);
      wp_update_attachment_metadata($attach_id,$attach_data);
      // Get permalink (in case needed), this also creates many file with various sizes
      $attachment_id = $attach_id;
      $attachment_link = get_attachment_link($attach_id);
      $attachment_thumb = wp_get_attachment_thumb_url($attach_id); // Get thumbnail url
      $media_type = "photo";
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
    // Globalize variable tobe able to access in the template
    global $attachment_id, $attachment_link, $attachment_thumb, $media_type;

    $img_id = $_POST["img_id"];

    // Handle file upload
    $status = wp_handle_upload($_FILES['file_'.$img_id], array('test_form' => true, 'action' => 'logo_plupload_action'));
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
      $attachment_id = $attach_id;
      $attachment_link = get_attachment_link($attach_id);
      $image = wp_get_image_editor($status["file"]); // Return an implementation that extends <tt>WP_Image_Editor</tt>
      if(!is_wp_error($image)){
        $image->resize(250, 200, true);
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
      add_post_meta($attach_id, '_wp_attachment_context', 'custom-header');
      add_post_meta($attach_id, '_wp_attachment_is_custom_header', get_option('stylesheet'));
      
      // Set it as custom header image
      $args = array(
        'width'         => 250,
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
   * Removing existing accolade image and add new accolade image
   *
   * @uses wp_handle_upload, wp_generate_attachment_metadata, wp_update_attachment_metadata, get_attachment_link, wp_get_image_editor, get_post_meta, wp_delete_attachment
   * @action wp_ajax_accolade_plupload_action
   * @return null
   */
  function g_accolade_plupload_action() {
    // Globalize variable tobe able to access in the template
    global $attachment_id, $attachment_link, $attachment_thumb, $media_type;

    $img_id = $_POST["img_id"];
    $old_id = $_POST["current_id"];
    $post_id = $_POST["post_id"];

    // Handle file upload
    $status = wp_handle_upload($_FILES['file_'.$img_id], array('test_form' => true, 'action' => 'accolade_plupload_action'));
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
      //Yes, you do "require" the following line of code
      require_once(ABSPATH."wp-admin".'/includes/image.php');
      $attach_data = wp_generate_attachment_metadata($attach_id, $path);
      wp_update_attachment_metadata($attach_id,$attach_data);
      // Get permalink (in case needed), this also creates many file with various sizes
      $image = wp_get_image_editor($status["file"]); // Return an implementation that extends <tt>WP_Image_Editor</tt>

      // Resize it
      if(!is_wp_error($image)){
        $image->resize(50, 50, true);
        $image->save($status["file"]);
      }

      // Delete the old one
      if($old_id) wp_delete_attachment($old_id, true);

      $status["status_code"] = 1;
      // Return new attachment ID
      $status["id"] = $attach_id;

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
   * @action admin_menu
   * @return null
   */
  function action_admin_menu(){
    add_options_page('Media Uploader', 'Media Uploader', 'manage_options', __FILE__, array($this, 'media_uploader_admin'));
  }

  /**
   * The functions for media uploader admin
   *
   * @uses update_option, get_option, add_settings_error, settings_error, screen_icon
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
      update_option('mediauploader_settings', $new_settings);

      add_settings_error('general', 'settings_updated', __('Settings saved.'), 'updated');
    }
    else if(get_option('mediauploader_settings')){
      $settings = get_option('mediauploader_settings');
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
    global $attachment_id, $attachment_link, $attachment_thumb;
    
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
          $attachment_id = $attachment->ID;
          $attachment_link = get_attachment_link($attachment->ID);
          $attachment_thumb = wp_get_attachment_thumb_url($attachment->ID);
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
    global $attachment_id, $attachment_link, $attachment_thumb, $media_type, $media_caption, $media_description;
    $video_link = $_POST['video_link'];
    $template = $_POST['template'];
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
        $attachment_id = $post_id;
        $attachment_link = '';
        $attachment_thumb = $video_thumbnail;
        $media_type = 'video';
        $media_caption = '';
        $media_description = '';

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
   * Public function for pre loading exsisting media and show it on manage media module
   *
   * @uses get_posts, get_attachment_link, wp_get_attachment_thumb_url, get_post_permalink, get_post_meta, load_template, ob_start, ob_end_clean, ob_get_contents
   * @action
   * @return void
   */
  public function media_manage_list_media($template, $type=''){
    /* Set global for usage in template */
    global $attachment_link, $attachment_thumb, $attachment_id, $media_type, $media_caption, $media_description;
    $html = '';

    if($type=='photos') $post_type = array('attachment');
    else if($type=='videos') $post_type = array('videos');
    else $post_type = array('attachment', 'videos');
    
    // Load all items of these types of video with any post status
    $args = array(
      'post_type' => $post_type,
      'numberposts' => -1,
      'post_status' => 'any',
      'post_parent' => 0
    );
    // Do get it
    $posts = get_posts($args);

    // Post loaded
    if($posts){
      foreach ($posts as $post) {
        // FIlls variable content
        $attachment_id = $post->ID;
        $context = get_post_meta($post->ID, '_wp_attachment_context', true);
        if($context!="custom-header"){
          // Different type of post, different ways to load contents
          if($post->post_type=='attachment'){
            $attachment_link = get_attachment_link($post->ID);
            $attachment_thumb = wp_get_attachment_thumb_url($post->ID);
            $media_type = 'photo';
          }
          else {
            $attachment_link = get_post_permalink($post->ID);
            $video_thumbnail = get_post_meta($post->ID, 'video_thumbnail', true);
            $attachment_thumb = $video_thumbnail;
            $media_type = 'video';
          }
          // In our media, excerpt is caption
          $media_caption = $post->post_excerpt;
          // In our media, description is post content
          $media_description = $post->post_content;

          // Load template from file, redirect echo into string
          ob_start();
          load_template(plugin_dir_path(__FILE__).'templates/'.$template.'.php', false);
          $html .= ob_get_contents();
          ob_end_clean();
        }
      }
    }

    // Returns the html for list of media
    return $html;
  }
};

/**
 * Initialize The_Media_Uploader
 */
add_action( 'plugins_loaded', array( 'The_Media_Uploader', 'init'), 10);