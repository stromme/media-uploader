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

  /* Plugin Construction */
  function __construct() {
    add_shortcode("media-uploader", array($this,"media_uploader_shortcode"));
    add_action('template_redirect', array($this, 'action_load_dependencies'));
    add_action('admin_menu', array($this, 'action_admin_menu'));
    add_action('wp_ajax_plupload_action', array($this, 'g_plupload_action'));
  }

  /**
   * Load all required files for the plugin to run.
   *
   * @uses wp_enqueue_script, plugins_url, add_action, get_option, wp_localize_script, wp_enqueue_style, includes_url
   * @action template_redirect
   * @return null
   */
  function action_load_dependencies() {
    wp_enqueue_script('the-media-uploader', plugins_url('mediauploader.js', __FILE__), array('jquery','plupload-all'), '20121205');
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
      'filters' => array(array('title' => __('Images'), 'extensions' => 'jpg, jpeg, png')),
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
    $imgid = $_POST["img_id"];
    $postid = $_POST["post_id"];

    // Handle file upload
    $status = wp_handle_upload($_FILES[$imgid . '_image'], array('test_form' => true, 'action' => 'plupload_action'));

    // If status is containing minimum 3 parameter: url, uri, and type
    if(count($status)>1){
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
      $attach_id = wp_insert_attachment($attachment_data, $path, $postid);
      //Yes, you do "require" the following line of code
      require_once(ABSPATH."wp-admin".'/includes/image.php');
      $attach_data = wp_generate_attachment_metadata($attach_id, $path);
      wp_update_attachment_metadata($attach_id,$attach_data);
      $status["attachment_id"] = $attach_id;
      // Get permalink (in case needed), this also creates many file with various sizes
      $status["attachment_link"] = get_attachment_link($attach_id);
      $status["attachment_thumb"] = wp_get_attachment_thumb_url($attach_id); // Get thumbnail url
      $status["post_id"] = $postid;

      //DESTROY ALL THE THINGS
      unset($attach_id, $attach_data, $attachment_data, $file, $path, $wp_filetype);
    }
    echo json_encode($status);
    exit;
  }

  /**
   * Shows admin menu for the media uploader
   *
   * @uses
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
   * @uses 
   * @action init
   * @return shortcode string
   */
  function media_uploader_shortcode($atts){
    $string = 'You must login wordpress to see this code running. <a href="/wpmulti/wp-admin">Here</a>';
    if(is_user_logged_in()){
      $string = "<p>";
      $string .=
        "<button type='button' id='photo-add' class='btn add-media' type='file' ".
        "data-post-id='".$atts["post"]."' ".
        "data-target-id='".$atts["target"]."' ".
        "data-template='".$atts["template"]."'><i class=\"icon-camera\"></i>Add photo</button>".
        "<ul id=\"".$atts["target"]."\" class=\"media_container\"></ul>";
      $string .= "</p>";
    }
    return $string;
  }
};

/**
 * Initialize The_Media_Uploader
 */
function the_media_uploader_init(){
	new The_Media_Uploader;
}
add_action('init', 'the_media_uploader_init');