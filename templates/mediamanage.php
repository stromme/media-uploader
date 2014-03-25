<?php
  global $template_params;
  $attachment_id = $template_params['attachment_id'];
  $media_type    = $template_params['media_type'];
  $taxonomy      = (isset($template_params['taxonomy']))?$template_params['taxonomy']:'';
?>

<li media-id="<?=$attachment_id?>" media-type="<?=$media_type?>" media-caption="<?=(isset($template_params['media_caption']))?$template_params['media_caption']:''?>" media-description="<?=(isset($template_params['media_description']))?$template_params['media_description']:''?>"<?=($taxonomy && $taxonomy!="")?'taxonomy="'.$taxonomy.'"':""?>>
  <span class="thumbnail">
    <img src="<?=$template_params['attachment_thumb']?>" id="thumb_<?=$attachment_id?>" />
    <a href="" class="thumb-trash"><i class="icon-trash"></i></a>
  </span>
  <div class="media-controls touch-check-media <?=($media_type=="video")?"show-video-play":""?>">
    <a href="<?=$template_params['attachment_large']?>" data-title="media-title-<?=$attachment_id?>" class="show-image colorbox-element" <?=($media_type=="video")?"data-video=\"1\"":""?> rel="gallery-<?=$attachment_id?>"><i class="<?=($media_type=="video")?"icon-media-play":"icon-media-expand"?>"></i></a>
  </div>
  <div id="media-title-<?=$attachment_id?>" style="display:none;"><?=($template_params['media_caption']!='')?'<strong>'.$template_params['media_caption'].'</strong>':''?><?=($template_params['media_caption']!='' && $template_params['media_description']!='')?'<br />':''?><?=($template_params['media_description']!='')?$template_params['media_description']:''?></div>
  <div class="pull-right">
    <a href="javascript:void(0);" class="action-tag-media preventDefault"><?=((isset($template_params['media_description']) && $template_params['media_description']!='') || (isset($template_params['media_caption']) && $template_params['media_caption']!=''))?'Edit description':'Add a description'?></a> <icon class="icon-tags"></icon>
  </div>
</li>