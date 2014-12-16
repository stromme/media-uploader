<?php
  global $template_params;
  $attachment_id = $template_params['attachment_id'];
  $media_type    = $template_params['media_type'];
?>

<li media-id="<?=$attachment_id?>" media-type="<?=$media_type?>" media-caption="" media-description="">
  <span class="thumbnail">
    <img src="<?=$template_params['attachment_thumb']?>" id="thumb_<?=$attachment_id?>" />
    <a href="" class="thumb-trash"><i class="icon-trash"></i></a>
    <?php if($media_type!="image"){ ?><span class="filename"><?=$template_params['filename']?></span><?php } ?>
  </span>
  <?php if($template_params['attachment_large']!=''){ ?>
  <div class="media-controls touch-check-media">
    <a href="<?=$template_params['attachment_large']?>" data-title="media-title-<?=$attachment_id?>" <?=($media_type=="image")?'class="show-image colorbox-element"':'target="_blank"'?> rel="gallery-<?=$attachment_id?>"><i class="icon-media-expand"></i></a>
  </div>
  <?php } ?>
  <div class="pull-right">
    <a href="javascript:void(0);" class="action-tag-media preventDefault"><?=((isset($template_params['media_description']) && $template_params['media_description']!='') || (isset($template_params['media_caption']) && $template_params['media_caption']!=''))?'Edit description':'Add a description'?></a> <icon class="icon-tags"></icon>
  </div>
</li>