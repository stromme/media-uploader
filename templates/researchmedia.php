<?php global $attachment_link, $attachment_thumb, $attachment_id, $media_type, $media_caption, $media_description; ?>

<li media-id="<?=$attachment_id?>" media-type="<?=$media_type?>" media-caption="<?=$media_caption?>" media-description="<?=$media_description?>">
  <a href="#" class="thumbnail research-media">
    <img src="<?=$attachment_thumb?>" id="thumb_<?=$attachment_id?>" />
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