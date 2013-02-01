<?php
  global $template_params;
  $attachment_id = $template_params['attachment_id'];
  $media_caption = $template_params['media_caption'];
?>

<li media-id="<?=$attachment_id?>" media-type="<?=$template_params['media_type']?>" media-caption="<?=$media_caption?>" media-description="<?=$template_params['media_description']?>">
  <a href="#" class="thumbnail research-media">
    <img src="<?=$template_params['attachment_thumb']?>" id="thumb_<?=$attachment_id?>" class="fade in" />
    <?php
      if($template_params['media_type']=='photo'){
        echo '<div class="icon-camera-2x fade"></div>';
      }
      else {
        echo '<div class="icon-play-2x fade"></div>';
      }
    ?>
  </a>
  <div class="pull-left">
    <?php
     if($media_caption!=""){
       echo $media_caption;
     }
     else {
       echo "<em>No caption</em>";
     }
    ?>
  </div>
</li>