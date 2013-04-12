(function($){ // Open closure

/**
 * The media uploader jQuery plugin, this one is for photo upload
 */
$.fn.mediauploader = function() {
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

        if(elmSettings.data_target_id && elmSettings.data_target_id!=''){
          // Attach hidden uploader box
          var uploader_id = "uploader_"+elmSettings.data_target_id;
          var plupload_basic = "<div id='"+uploader_id+"' style='display:none;visibility:hidden;' class='plupload-uploader-container'></div>";
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

          // Upload progress (not used at the moment)
          //uploader.bind('UploadProgress', function(up, file){});

          // When the file was uploaded
          uploader.bind('FileUploaded', function(up, file, response){
            if(typeof(response=="Object") && response.status==0){
              setTimeout(function(){
                $('li.new_thumb_'+file.id, target).remove();
                cmd.showError("Connection error");
              }, 100);
            }
            else {
              var json_response = JSON.parse(response["response"]);
              if(json_response["status_code"]==1){
                $('li.new_thumb_'+file.id, target).replaceWith(json_response["html"]);
              }
              else {
                cmd.showError(json_response["error"]);
                $('li.new_thumb_'+file.id, target).fadeOut(500, function(){$(this).remove();});
              }
            }
          });

          uploader.bind('Error', function(up, e){
            // Show error
            cmd.showError(e);
          });
        }
      },
      showError: function(error){
        var message = error.message;
        switch(error.code){
          case -600: message = "File size too big.";
            break;
        }
        var target = $('#'+elmSettings.data_target_id);
        $('.photo_upload_error').remove();
        $('<div class="photo_upload_error" style="display:none;padding:12px 12px 0 12px;width:auto;"><div class="alert alert-error info-alert" style="margin-bottom:0;"><a class="close">×</a><span>'+message+'</span></div></div></div>').insertBefore(target.parent());
        var upload_err = $('.photo_upload_error');
        upload_err.fadeIn(1000);
        $('.close', upload_err).click(function(){
          upload_err.animate({'opacity':0}, 'fast', function(){
            upload_err.slideUp(100, function(){upload_err.remove();});
          });
        });
        // Then remove slowly
        setTimeout(function(){
//          upload_err.animate({'opacity':0}, 'slow', function(){
//            $(this).slideUp(100, function(){$(this).remove();});
//          });
        }, 3000);
      }
    };
    cmd.init();
  });
};

/**
 * The media uploader jQuery plugin, this one is for logo upload
 */
$.fn.logouploader = function(options) {
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
      init: function(){
        // Get attributes value
        elmSettings.data_target_id = elm.attr('data-target-id');
        var target = $('#'+elmSettings.data_target_id);

        // Attach hidden uploader box
        var uploader_id = "uploader_"+elmSettings.data_target_id;
        var plupload_basic = "<div id='"+uploader_id+"' style='display:none;visibility:hidden;'></div>";
        $(plupload_basic).insertAfter(elm);
        elmBaseSettings["browse_button"] = elm.attr('id');
        elmBaseSettings["container"] = uploader_id;
        elmBaseSettings["file_data_name"] = 'file_'+elm.attr('id');
        elmBaseSettings["multipart_params"]["img_id"] = elm.attr('id');
        elmBaseSettings["multipart_params"]["action"] = "logo_plupload_action";
        var logo_uploader = new plupload.Uploader(elmBaseSettings);
        logo_uploader.init();

        var logo_loader;
        // When a file was added in the queue
        logo_uploader.bind('FilesAdded', function(up, files){
          $.each(files, function(i, file){
            target.fadeOut(200, function(){
              $('<div class="new_logo_'+file.id+' logo-loader"><span class="loader"></span></div>').insertAfter(target);
              logo_loader = $('.new_logo_'+file.id, target.parent());
              $('.loader', logo_loader).spin('medium-left', '#000000');
              logo_loader.css('visibility', 'visible');
            });
          });
          up.refresh();
          up.start();
        });

        // Upload progress (not used at the moment)
        //uploader.bind('UploadProgress', function(up, file){});

        // When the file was uploaded
        logo_uploader.bind('FileUploaded', function(up, file, response){
          if(typeof(response=="Object") && response.status==0){
            setTimeout(function(){
              $('.logo-loader', target.parent()).remove();
              target.fadeIn(300);
              cmd.showError("Connection error");
            }, 200);
          }
          else {
            var json_response = JSON.parse(response["response"]);

            logo_loader.fadeOut(200, function(){
              $(this).remove();
              if(json_response["status_code"]==1){
                target.attr('src', json_response["url"]);
              }
              else {
                cmd.showError('Failed to upload new logo');
              }
              target.fadeIn(300);
            });
          }
        });

        logo_uploader.bind('Error', function(up, e){
          // Show error
          if(logo_loader){
            logo_loader.fadeOut(200, function(){
              $(this).remove();
              target.fadeIn(300);
            });
          }
          cmd.showError(e.message);
        });
      },
      showError: function(error_string){
        $('.upload_error').remove();
        $('<div class="upload_error" style="display:inline-block;opacity:0;margin-top:0;margin-bottom:10px;text-align:center;width:238px;">'+error_string+'</div>').insertBefore(elm);
        var upload_err = $('.upload_error');
        upload_err.animate({'opacity':1}, 500);
        // Then remove slowly
        setTimeout(function(){
          upload_err.animate({'opacity':0}, 1000, function(){
            $(this).slideUp(100, function(){$(this).remove();});
          });
        }, 2000);
      }
    };
    cmd.init();
  });
};

/**
 * The media uploader jQuery plugin, this one is for user account photo upload
 */
$.fn.userphotouploader = function(options) {
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
      init: function(){
        // Get attributes value
        elmSettings.data_target_id = elm.attr('data-target-id');
        var target = $('#'+elmSettings.data_target_id);

        // Attach hidden uploader box
        var uploader_id = "uploader_"+elmSettings.data_target_id;
        var plupload_basic = "<div id='"+uploader_id+"' style='display:none;visibility:hidden;'></div>";
        $(plupload_basic).insertAfter(elm);
        elmBaseSettings["browse_button"] = elm.attr('id');
        elmBaseSettings["container"] = uploader_id;
        elmBaseSettings["file_data_name"] = 'file_'+elm.attr('id');
        elmBaseSettings["multipart_params"]["img_id"] = elm.attr('id');
        elmBaseSettings["multipart_params"]["action"] = "user_photo_plupload_action";
        var logo_uploader = new plupload.Uploader(elmBaseSettings);
        logo_uploader.init();

        var logo_loader;
        // When a file was added in the queue
        logo_uploader.bind('FilesAdded', function(up, files){
          $.each(files, function(i, file){
            target.fadeOut(200, function(){
              $('<div class="new_photo_'+file.id+' photo-loader"><span class="loader"></span></div>').insertAfter(target);
              logo_loader = $('.new_photo_'+file.id, target.parent());
              $('.loader', logo_loader).spin('medium-left', '#000000');
              logo_loader.css('visibility', 'visible');
            });
          });
          up.refresh();
          up.start();
        });

        // Upload progress (not used at the moment)
        //uploader.bind('UploadProgress', function(up, file){});

        // When the file was uploaded
        logo_uploader.bind('FileUploaded', function(up, file, response){
          if(typeof(response=="Object") && response.status==0){
            setTimeout(function(){
              $('.photo-loader', target.parent()).remove();
              target.fadeIn(300);
              cmd.showError("Connection error");
            }, 200);
          }
          else {
            var json_response = JSON.parse(response["response"]);

            logo_loader.fadeOut(200, function(){
              $(this).remove();
              if(json_response["status_code"]==1){
                target.attr('src', json_response["url"]);
              }
              else {
                cmd.showError('Failed to upload new logo');
              }
              target.fadeIn(300);
            });
          }
        });

        logo_uploader.bind('Error', function(up, e){
          // Show error
          if(logo_loader){
            logo_loader.fadeOut(200, function(){
              $(this).remove();
              target.fadeIn(300);
            });
          }
          cmd.showError(e.message);
        });
      },
      showError: function(error_string){
        $('.upload_error').remove();
        $('<div class="upload_error" style="display:inline-block;opacity:0;margin-top:0;margin-bottom:10px;text-align:center;width:180px">'+error_string+'</div>').insertBefore(elm.closest('.btn-group'));
        var upload_err = $('.upload_error');
        upload_err.animate({'opacity':1}, 500);
        // Then remove slowly
        setTimeout(function(){
          upload_err.animate({'opacity':0}, 1000, function(){
            $(this).slideUp(100, function(){$(this).remove();});
          });
        }, 2000);
      }
    };
    cmd.init();
  });
};

/**
 * The media uploader jQuery plugin, this one is for photo upload
 */
$.fn.accoladeuploader = function() {
  // Initialize our variables
  return this.each(function(){
    var elm = $(this);
    var elmSettings = {};
    // Copy settings for each button
    // Object has to be converted to string so it can be cloned otherwise it reference to the first object
    var elmBaseSettings = JSON.parse(JSON.stringify(plupload_base_settings));

    // Create commands
    var cmd = {
      // On button initialization
      init: function(){
        // Get attributes value
        elmSettings.data_target_id = elm.attr('data-target-id');
        var target = $('#'+elmSettings.data_target_id);

        // Attach hidden uploader box
        var uploader_id = "uploader_"+elmSettings.data_target_id;
        var plupload_basic = "<div id='"+uploader_id+"' style='display:none;visibility:hidden;'></div>";
        $(plupload_basic).insertAfter(elm);
        elmBaseSettings["browse_button"] = elm.attr('id');
        elmBaseSettings["container"] = uploader_id;
        elmBaseSettings["file_data_name"] = 'file_'+elm.attr('id');
        elmBaseSettings["multipart_params"]["img_id"] = elm.attr('id');
        elmBaseSettings["multipart_params"]["action"] = "accolade_plupload_action";
        elmBaseSettings["resize"]["width"] = "200";
        elmBaseSettings["resize"]["height"] = "200";
        var accolade_uploader = new plupload.Uploader(elmBaseSettings);
        accolade_uploader.init();

        var accolade_image_loader;
        // When a file was added in the queue
        accolade_uploader.bind('FilesAdded', function(up, files){
          up.settings.multipart_params["current_id"] = (target.attr('current-id'))?target.attr('current-id'):"";
          up.settings.multipart_params["post_id"] = (target.attr('post-id'))?target.attr('post-id'):"";
          $.each(files, function(i, file){
            target.fadeOut(200, function(){
              $('<div class="new_accolade_image_'+file.id+' accolade-image-loader"><span class="loader"></span></div>').insertAfter(target);
              accolade_image_loader = $('.new_accolade_image_'+file.id, target.parent());
              $('.loader', accolade_image_loader).spin('medium-left', '#000000');
              accolade_image_loader.css('visibility', 'visible');
            });
          });
          up.refresh();
          up.start();
        });

        // Upload progress (not used at the moment)
        //uploader.bind('UploadProgress', function(up, file){});

        // When the file was uploaded
        accolade_uploader.bind('FileUploaded', function(up, file, response){
          if(typeof(response=="Object") && response.status==0){
            setTimeout(function(){
              accolade_image_loader.remove();
              target.fadeIn(300);
              cmd.showError("Connection error");
            }, 200);
          }
          else {
            var json_response = JSON.parse(response["response"]);
            accolade_image_loader.fadeOut(200, function(){
              $(this).remove();
              if(json_response["status_code"]==1){
                target.attr('src', json_response["url"]);
                target.attr('current-id', json_response["id"]);
                $('.change-accolade-image', target.parent()).html('Change image');
              }
              else {
                cmd.showError('Failed to upload new logo');
              }
              target.fadeIn(300);
            });
          }
        });

        accolade_uploader.bind('Error', function(up, e){
          // Show error
          if(accolade_image_loader){
            accolade_image_loader.fadeOut(200, function(){
              $(this).remove();
              target.fadeIn(300);
            });
          }
          cmd.showError(e.message);
        });
      },
      showError: function(error_string){
        $('.upload_error').remove();
        $('<div class="upload_error" style="width:86%;margin: 0 0 5px 0;padding:0 12px;">'+error_string+'</div>').insertAfter(elm);
        var upload_err = $('.upload_error');
        upload_err.animate({'opacity':1}, 500);
        // Then remove slowly
        setTimeout(function(){
          upload_err.animate({'opacity':0}, 1000, function(){
            $(this).slideUp(100, function(){$(this).remove();});
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
  $('.add-media').filter(function(){return !$(this).hasClass('add-video');}).mediauploader();
  $('button.change-logo,input[type="button"].change-logo').logouploader();
  $('.upload-user-photo').userphotouploader();

  /* Delete media confirmation */
  default_thumb_trash_action();

  /* Open tag media form */
  $('.action-tag-media').live('click', function(e) {
    e.preventDefault();
    var container = $('#tag-media');
    var button = $('.save', container);
    var list = $(this).closest('li');
    var media_id = list.attr('media-id');
    var media_type = list.attr('media-type');
    var media_caption = $('#media-caption');
    var media_description = $('#media-description');
    media_caption.val(list.attr('media-caption'));
    media_description.val(list.attr('media-description'))
    // Nested modal workaround
    jQuery().modal.Constructor.prototype.enforceFocus = function(){};;
    container.modal();
    /* Do save media tag */
    button.unbind('click').click(function(e) {
      e.preventDefault();
      if (!button.hasClass('disabled')) {
        button.addClass('disabled');
        confirm_tag_media(media_id, media_type, media_caption.val(), media_description.val(), function() {
          container.modal('hide');
          list.attr('media-caption', media_caption.val());
          list.attr('media-description', media_description.val());
          // Reset the form
          media_caption.val('');
          media_description.val('');
          button.removeClass('disabled');
        }, function() {
          button.removeClass('disabled');
        });
      }
    });
  });
});

})(jQuery);

function default_thumb_trash_action(){
  $('.thumb-trash')
    .die('click.mediauploader')
    .live('click.mediauploader', function(e) {
    e.preventDefault();
    var container  = $('#delete-confirm');
    var button     = $('.action-confirm', container);
    var list       = $(this).closest('li');
    var media_id   = list.attr('media-id');
    var media_type = list.attr('media-type');
    // Nested modal workaround;
    jQuery().modal.Constructor.prototype.enforceFocus = function(){};
    container.modal();
    button.unbind('click').click(function(e) {
      e.preventDefault();
      if (!button.hasClass('disabled')) {
        button.addClass('disabled');
        confirm_delete_media(media_id, media_type, function() {
          setTimeout(function(){
            list.fadeOut(300, function() {
              $(this).remove();
            });
          }, 600);
          container.modal('hide');
          button.removeClass('disabled');
        }, function() {
          button.removeClass('disabled');
        });
      }
    });
  });
}

/**
 * Function for add video on manage media module
 *
 * @param video_link
 * @param data_target
 * @param data_template
 * @param success_callback
 * @param failed_callback
 * @return void
 */
function add_video(video_link, data_target, data_template, success_callback, failed_callback){
  // If video link is not empty (validate on server side later)
  var data = {
    action: 'add_video',
    'video_link': video_link,
    'template': data_template
  };
  // Set target element list container
  var target = $('#'+data_target);

  var post = new AjaxPost(data, {
    'spinner': new LoadingSpinner({
      'reference_elm': target,
      'insert_method': 'prepend',
      'loader_tag': 'li',
      'loader_style': ' ',
      'spinner_style': ' ',
      'spinner_wrapping': '<a></a>',
      'no_hide': true
    })
  },
  // Ajax replied
  function(response){
    var json_response = JSON.parse(response);
    if(json_response.status==1){
      // If success, replace our newly created list with real content
      post.spinner.spinner.replaceWith(json_response.html);
      if(typeof(success_callback)=='function') success_callback();
    }
    else {
      // If failed remove our newly created list
      post.spinner.spinner.fadeOut(300, function(){$(this).remove();});
      bootstrap_alert(json_response.status_message, 'error');
      if(typeof(failed_callback)=='function') failed_callback();
    }
  },
  function(){
    post.spinner.spinner.remove();
  });
  post.doAjaxPost();
}

/**
 * Function to confirm deleting media by ajax post, run success_callback if success, and failed_callback if otherwise
 *
 * @param media_id
 * @param media_type
 * @param success_callback
 * @param failed_callback
 */
function confirm_delete_media(media_id, media_type, success_callback, failed_callback){
  // Load ajax data
  var data = {
    action: 'delete_media',
    'media_id': media_id,
    'media_type': media_type
  };
  var container = $("#delete-confirm");
  var button = $('.action-confirm', container);
  var spinner = false;
  if(container && button && button.length>0){
    spinner = new LoadingSpinner({
      'reference_elm': button,
      'insert_method': 'prepend',
      'in_parent': true
    })
  }
  var post = new AjaxPost(data, {
    'spinner': spinner
  },
  // Ajax replied
  function(response){
    var json_response = JSON.parse(response);
    if(json_response.status==1){
      if(typeof(success_callback)=='function') success_callback();
    }
    else {
      bootstrap_alert(json_response.status_message, 'error');
      if(typeof(failed_callback)=='function') failed_callback();
    }
  });
  post.doAjaxPost();
}

/**
 * Function to save media tag by ajax post
 *
 * @param media_id
 * @param media_type
 * @param media_caption
 * @param media_description
 * @param success_callback
 * @param failed_callback
 */
function confirm_tag_media(media_id, media_type, media_caption, media_description, success_callback, failed_callback){
  // Input validation
  var exists = false;
  if(media_caption && media_caption.length>0){
    exists = true;
  }
  if(media_description && media_description.length>0){
    exists = true;
  }
  var container = $('#tag-media');
  var button = $('.save', container);
  // If any of the content not empty (either caption or description)
  if(exists){
    var data = {
      action: 'tag_media',
      'media_id': media_id,
      'media_type': media_type,
      'media_caption': media_caption,
      'media_description': media_description
    };
    var post = new AjaxPost(data, {
      'spinner': new LoadingSpinner({
        'reference_elm': button,
        'insert_method': 'prepend',
        'in_parent': true
      })
    },
    // Ajax replied
    function(response){
      var json_response = JSON.parse(response);
      if(json_response.status==1){
        bootstrap_alert(json_response.status_message, 'success');
        // Do success callback if updating is success
        if(typeof(success_callback)=='function') success_callback();
      }
      else {
        bootstrap_alert(json_response.status_message, 'error');
        if(typeof(failed_callback)=='function') failed_callback();
      }
    },
    function(){
      if(typeof(failed_callback)=='function') failed_callback();
    });
    post.doAjaxPost();
  }
  else {
    if(typeof(failed_callback)=='function') failed_callback();
  }
  // else do nothing if both inputs are empty
}