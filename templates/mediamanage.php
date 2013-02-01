<?php
  global $template_params;
  $attachment_id = $template_params['attachment_id'];
  $media_type    = $template_params['media_type'];
  $taxonomy      = $template_params['taxonomy'];
?>

<li media-id="<?=$attachment_id?>" media-type="<?=$media_type?>" media-caption="<?=$template_params['media_caption']?>" media-description="<?=$template_params['media_description']?>"<?=($taxonomy && $taxonomy!="")?'taxonomy="'.$taxonomy.'"':""?>>
  <a class="thumbnail">
    <img src="<?=$template_params['attachment_thumb']?>" id="thumb_<?=$attachment_id?>" />
    <div class="thumb-trash"><i class="icon-trash"></i></div>
  </a>
  <div class="pull-right">
    <a href="javascript:void(0);" class="action-tag-media preventDefault" >Describe this <?=$media_type?> </a><icon class="icon-tags"></icon>
  </div>
</li>