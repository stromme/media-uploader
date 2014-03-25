<?php
  global $template_params;
  $attachment_id = (isset($template_params['attachment_id']))?$template_params['attachment_id']:'';
  $media_type    = (isset($template_params['media_type']))?$template_params['media_type']:'';
  $taxonomy      = (isset($template_params['taxonomy']))?$template_params['taxonomy']:'';
  $attr_favorite = "";
  if(isset($template_params['favorite']) && $template_params['favorite']) $attr_favorite = ' data-favorite="1"';
?>

<li media-id="<?=$attachment_id?>" media-type="<?=$media_type?>" media-caption="<?=(isset($template_params['media_caption']))?$template_params['media_caption']:''?>" media-description="<?=(isset($template_params['media_description']))?$template_params['media_description']:''?>"<?=($taxonomy && $taxonomy!="")?' taxonomy="'.$taxonomy.'"':""?><?=$attr_favorite?>>
  <a class="thumbnail">
    <img src="<?=$template_params['attachment_thumb']?>" id="thumb_<?=$attachment_id?>" />
  </a>
  <div class="mobile-spacer"></div>
  <a href="" class="thumb-trash"><i class="icon-trash"></i></a>
  <?php
  if (isset($template_params['favorite']) && $template_params['favorite']) {
    echo '<a href="" class="thumb-favorite thumb-favorite-selected touch-check" data-target="'.$attachment_id.'" rel="tooltip" data-placement="top" title="Your favorite photo of this project."><i class="icon-ok icon-white"></i></a>';
  } else {
    echo '<a href="" class="thumb-favorite touch-check" data-target="'.$attachment_id.'" rel="tooltip" data-placement="top" title="Mark the photo as your favorite."><i class="icon-ok icon-white"></i></a>';
  }
  ?>
</li>