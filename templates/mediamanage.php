<?php global $attachment_link, $attachment_thumb, $attachment_id, $media_type, $media_caption, $media_description, $taxonomy; ?>

<li media-id="<?=$attachment_id?>" media-type="<?=$media_type?>" media-caption="<?=$media_caption?>" media-description="<?=$media_description?>"<?=($taxonomy && $taxonomy!="")?'taxonomy="'.$taxonomy.'"':""?>>
  <a class="thumbnail">
    <img src="<?=$attachment_thumb?>" id="thumb_<?=$attachment_id?>" />
    <div class="thumb-trash"><i class="icon-trash"></i></div>
  </a>
  <div class="pull-right">
    <a href="javascript:void(0);" class="action-tag-media preventDefault" >Describe this <?=$media_type?> </a><icon class="icon-tags"></icon>
  </div>
</li>