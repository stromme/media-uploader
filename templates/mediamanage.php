<?php global $attachment_link, $attachment_thumb, $attachment_id, $media_type; ?>

<li>
  <input type="hidden" class="media-id" value="<?=$attachment_id?>" />
  <input type="hidden" class="media-type" value="<?=$media_type?>" />
  <a class="thumbnail">
    <img src="<?=$attachment_thumb?>" id="thumb_<?=$attachment_id?>" />
    <div class="thumb-trash"><i class="icon-trash"></i></div>
  </a>
  <div class="pull-right">
    <a href="javascript:void(0);" class="action-tag-media preventDefault" >Describe this <?=$media_type?> </a><icon class="icon-tags"></icon>
  </div>
</li>