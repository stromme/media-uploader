<?php global $attachment_link, $attachment_thumb, $attachment_id; ?>

<li>
  <a href="<?=$attachment_link?>" target="_blank" class="thumbnail">
    <img src="<?=$attachment_thumb?>" id="thumb_<?=$attachment_id?>" />
    <div class="thumb-trash"><i class="icon-trash"></i></div>
  </a>
  <input type="text" name="description" value="Desc" />
</li>