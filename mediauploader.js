(function($){ // Open closure

/**
 * The media uploader jQuery plugin
 */
$.fn.mediauploader = function(options) {
  // Initialize our variables
  return this.each(function() {
    var elm = $(this);
    var elmSettings = {};
    // Copy settings for each button
    // Object has to be converted to string so it can be cloned otherwise it reference to the first object
    var elmBaseSettings = JSON.parse(JSON.stringify(plupload_base_settings));

    // Create commands
    var cmd = {
      // On button initialization
      init: function() {
        // Get attributes value
        elmSettings.data_post_id = (elm.attr('data-post-id'))?elm.attr('data-post-id'):'';
        elmSettings.data_target_id = elm.attr('data-target-id');
        elmSettings.data_template = elm.attr('data-template');
        var target = $('#'+elmSettings.data_target_id);

        // Attach hidden uploader box
        var uploader_id = "uploader_"+elmSettings.data_target_id;
        var plupload_basic = "<div id='"+uploader_id+"' style='display:none;visibility:hidden;'></div>";
        $(plupload_basic).insertAfter(elm);
        elmBaseSettings["browse_button"] = elm.attr('id');
        elmBaseSettings["container"] = uploader_id;
        elmBaseSettings["file_data_name"] = 'file_'+elm.attr('id');
        elmBaseSettings["multipart_params"]["img_id"] = elm.attr('id');
        elmBaseSettings["multipart_params"]["post_id"] = elmSettings.data_post_id;
        elmBaseSettings["multipart_params"]["template"] = elmSettings.data_template;
        var uploader = new plupload.Uploader(elmBaseSettings);
        //uploader.bind('Init', function(up){});
        uploader.init();

        // When a file was added in the queue
        uploader.bind('FilesAdded', function(up, files){
          $.each(files, function(i, file) {
            target.prepend('<li class="new_thumb_'+file.id+'"><a><span class="loader"></span></a></li>');
            $('.new_thumb_'+file.id+' .loader', target).spin('medium-left', '#000000');
          });
          up.refresh();
          up.start();
        });

        //uploader.bind('UploadProgress', function(up, file){});

        // a file was uploaded
        uploader.bind('FileUploaded', function(up, file, response){
          var json_response = JSON.parse(response["response"]);

          if(json_response["status_code"]==1){
            $('li.new_thumb_'+file.id, target).replaceWith(json_response["html"]);
          }
          else {
            cmd.showError(json_response["error"]);
            $('li.new_thumb_'+file.id, target).fadeOut(500, function(){$(this).remove();});
          }
        });

        uploader.bind('Error', function(up, e){
          // Show error
          cmd.showError(e.message);
        });
      },
      showError: function(error_string){
        $('<div class="upload_error" style="display:none;">'+error_string+'</div>').insertAfter(elm);
        var upload_err = $('.upload_error');
        upload_err.fadeIn(1000);
        // Then remove slowly
        setTimeout(function(){
          upload_err.animate({'opacity':0}, 1000, function(){
            $(this).hide(100, function(){$(this).remove();});
          });
        }, 2000);
      }
    };
    cmd.init();
  });
};

/**
 * Ready, set, go!
 */
$( document ).ready( function() {
  $('button.add-media,input[type="button"].add-media').filter(function(){return !$(this).hasClass('add-video');}).mediauploader();
});

})(jQuery);

function add_video(video_link, data_target, data_template, success_callback, failed_callback){
  if(video_link && video_link.length>0){
    var data = {
      action: 'add_video',
      'video_link': video_link,
      'template': data_template
    };
    var target = $('#'+data_target);
    target.prepend('<li class="new_thumb_video"><a><span class="loader"></span></a></li>');
    $('.new_thumb_video .loader', target).spin('medium-left', '#000000');
    $.post(ajaxurl, data, function(response) {
      var json_response = JSON.parse(response);
      console.log($('li.new_thumb_video', target)[0]);
      $('li.new_thumb_video', target).replaceWith(json_response.html);
      if(json_response.status==1){
        if(typeof(success_callback)=='function') success_callback();
      }
      else {
        bootstrap_alert(json_response.status_message, 'error');
        if(typeof(failed_callback)=='function') failed_callback();
      }
    });
  }
  else {
    bootstrap_alert('Please paste video embed URL', 'error');
    if(typeof(failed_callback)=='function') failed_callback();
  }
}

function show_delete_media_spinner(){
  $("#confirm-delete-media").parent().prepend('<span id="mailboxes-deletemedia-loader" class="button-side-loader"><span class="loader"></span></span>');
  $('#mailboxes-deletemedia-loader .loader').spin('medium-left', '#000000');
  $('#mailboxes-deletemedia-loader').fadeIn(300);
}

function show_media_tag_spinner(){
  $("#confirm-tag").parent().prepend('<span id="media-tag-loader" class="button-side-loader"><span class="loader"></span></span>');
  $('#media-tag-loader .loader').spin('medium-left', '#000000');
  $('#media-tag-loader').fadeIn(300);
}

function confirm_delete_media(media_id, media_type, callback){
  var data = {
    action: 'delete_media',
    'media_id': media_id,
    'media_type': media_type
  };
  show_delete_media_spinner();
  $.post(ajaxurl, data, function(response) {
    var json_response = JSON.parse(response);
    $('#mailboxes-deletemedia-loader').fadeOut(300, function(){
      $(this).remove();
      if(json_response.status==1){
        if(typeof(callback)=='function') callback();
      }
      else {
        bootstrap_alert(json_response.status_message, 'error');
      }
    });
  });
}

function confirm_tag_media(media_id, media_type, media_caption, media_description, success_callback, failed_callback){
  var exists = false;
  if(media_caption && media_caption.length>0){
    exists = true;
  }
  if(media_description && media_description.length>0){
    exists = true;
  }

  if(exists){
    show_media_tag_spinner();
    var data = {
      action: 'tag_media',
      'media_id': media_id,
      'media_type': media_type,
      'media_caption': media_caption,
      'media_description': media_description
    };
    $.post(ajaxurl, data, function(response) {
      var json_response = JSON.parse(response);
      $('#media-tag-loader').fadeOut(300, function(){
        $(this).remove();
        if(json_response.status==1){
          bootstrap_alert(json_response.status_message, 'success');
          // Do callback, which is close the modal when add tag success
          if(typeof(success_callback)=='function') success_callback();
        }
        else {
          bootstrap_alert(json_response.status_message, 'error');
          if(typeof(failed_callback)=='function') failed_callback();
        }
      });
    });
  }
  // else do nothing
}