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
        elmSettings.data_post_id = elm.attr('data-post-id');
        elmSettings.data_target_id = elm.attr('data-target-id');
        elmSettings.data_template = elm.attr('data-template');
        var target = $('#'+elmSettings.data_target_id);

        // Attach hidden uploader box
        var uploader_id = "uploader_"+elmSettings.data_target_id;
        var plupload_basic = "<div id='"+uploader_id+"'></div>";
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
            target.append('<li class="new_thumb_'+file.id+'"><a><span class="loader"></span></a></li>');
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
  $('button.add-media,input[type="button"].add-media').mediauploader();
});

})(jQuery);