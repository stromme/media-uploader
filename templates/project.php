<?php global $attachment_link, $attachment_thumb, $attachment_id; ?>

<li>
  <a href="<?=$attachment_link?>" target="_blank" class="thumbnail">
    <img src="<?=$attachment_thumb?>" id="thumb_<?=$attachment_id?>" />
    <div class="thumb-favorite" rel="tooltip" data-placement="top" title="Mark the photo as your favorite.">
      <i class="icon-ok icon-white"></i>
    </div>
    <div class="thumb-trash"><i class="icon-trash"></i></div>
  </a>
</li>