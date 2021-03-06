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
        elmSettings.data_page = elm.attr('data-page');
        var target = $('#'+elmSettings.data_target_id);

        if(elmSettings.data_target_id && elmSettings.data_target_id!=''){
          // Attach hidden uploader box
          var uploader_id = "uploader_"+elmSettings.data_target_id;
          var plupload_basic = "<div id='"+uploader_id+"' style='float:right;display:inline-block;width:0;height:0;overflow:hidden;' class='plupload-uploader-container'></div>";
          //$(plupload_basic).insertAfter(elm);
          $(plupload_basic).remove();
          $('body').append(plupload_basic);
          elmBaseSettings["browse_button"] = elm.attr('id');
          elmBaseSettings["container"] = uploader_id;
          elmBaseSettings["file_data_name"] = 'file_'+elm.attr('id');
          elmBaseSettings["multipart_params"]["img_id"] = elm.attr('id');
          elmBaseSettings["multipart_params"]["post_id"] = elmSettings.data_post_id;
          elmBaseSettings["multipart_params"]["template"] = elmSettings.data_template;
          if(elmSettings.data_page){
            elmBaseSettings["multipart_params"]["page"] = elmSettings.data_page;
          }

          // Only for old phone browser, such as android 2
          var ua = navigator.userAgent;
          if(ua.indexOf("Android")>=0){
            var androidversion = parseFloat(ua.slice(ua.indexOf("Android")+8));
            if(androidversion < 2.4){
              elmBaseSettings["runtimes"] = 'html4';
              elmBaseSettings["multipart_params"]["runtime"] = 'html4';
            }
            // Only for phone with code SGH and SCH
            else if (ua.indexOf("SGH-")>0 || ua.indexOf("SCH-")>0){
              elmBaseSettings["runtimes"] = 'html4';
              elmBaseSettings["multipart_params"]["runtime"] = 'html4';
            }
          }
          // Only for phone with netfront browser
          else if (ua.indexOf("NetFront")>0){
            elmBaseSettings["runtimes"] = 'html4';
            elmBaseSettings["multipart_params"]["runtime"] = 'html4';
          }
          //--oldphone
          // Max size 1280x1200px
          elmBaseSettings["resize"]["width"] = "1280";
          elmBaseSettings["resize"]["height"] = "1200";

          var uploader = new plupload.Uploader(elmBaseSettings);
          //uploader.bind('Init', function(up){});
          uploader.init();
          $('#'+uploader_id+' div').removeAttr('style');
          $('#'+uploader_id+' input').removeAttr('style');

          // When a file was added in the queue
          uploader.bind('FilesAdded', function(up, files){
            $.each(files, function(i, file) {
              var new_block = '<li class="new_thumb_'+file.id+'"><a class="thumbnail"><span class="upload-counter">0%</span><span class="upload-progress"><span class="fill"></span></span></a></li>';
              // Append only for showroom images
              if(elmSettings.data_template=='showroom') target.append(new_block);
              else target.prepend(new_block);
              //$('.new_thumb_'+file.id+' .loader', target).spin('medium-left', '#000000');
            });
            $('.photo_upload_error').fadeOut('fast', function(){ $(this).remove() });
            $('.project-publish').addClass('disabled');
            up.refresh();
            up.start();
          });

          // Upload progress
          var t = 0;
          uploader.bind('UploadProgress', function(up, file){
            var thumb = '.new_thumb_'+file.id;
            var thumb_progress = thumb+' .upload-progress';
            var thumb_fill_elm = $(thumb_progress+'>.fill', target);
            var thumb_progress_elm = $(thumb_progress, target);
            var thumb_counter_elm = $(thumb+' .upload-counter', target);
            thumb_fill_elm.css('width', file.percent+'%');
            if(file.percent>=100 && !thumb_progress_elm.hasClass('p100')){
              thumb_progress_elm.removeClass('p25 p50 p75');
              thumb_progress_elm.addClass('p100');
              thumb_counter_elm.html(file.percent+'%');
            }
            else if(file.percent>=75 && !thumb_progress_elm.hasClass('p75')){
              thumb_progress_elm.removeClass('p25 p50');
              thumb_progress_elm.addClass('p75');
            }
            else if(file.percent>=50 && !thumb_progress_elm.hasClass('p50')){
              thumb_progress_elm.removeClass('p25');
              thumb_progress_elm.addClass('p50');
            }
            else if(file.percent>=25 && !thumb_progress_elm.hasClass('p25')){
              thumb_progress_elm.addClass('p25');
            }
            if(file.percent>=100){
              if(t<=0){
                t = setTimeout(function(){
                  if(file.percent==100 && thumb_counter_elm.length>0){
                    thumb_counter_elm.html(file.percent+'%, crunching...');
                  }
                }, 2000);
              }
            }
            else {
              thumb_counter_elm.html(file.percent+'%');
            }
          });

          // When the file was uploaded
          uploader.bind('FileUploaded', function(up, file, response){
            $('.project-publish').removeClass('disabled');
            if(typeof(response=="Object") && response.status==0){
              setTimeout(function(){
                $('li.new_thumb_'+file.id, target).remove();
                cmd.showError({'code':0, 'message':"Connection error"});
              }, 100);
            }
            else {
              try {
                // For HTML4 runtime, because it reads rendered html content
                if(elmBaseSettings["multipart_params"]["runtime"]=='html4'){
                  response["response"] = response["response"].replace(/_lt_/g, '<');
                  response["response"] = response["response"].replace(/_rt_/g, '>');
                  response["response"] = response["response"].replace(/_src_/g, 'src=');
                  response["response"] = response["response"].replace(/\n/g, '');
                }

                var json_response = JSON.parse(response["response"]);
                if(json_response["status_code"]==1){
                  $('li.new_thumb_'+file.id, target).replaceWith(json_response["html"]);
                  if(typeof(bind_colorbox) == "function"){
                    bind_colorbox();
                  }
                }
                else {
                  cmd.showError({'code':0, 'message':json_response["error"]});
                  $('li.new_thumb_'+file.id, target).fadeOut(500, function(){$(this).remove();});
                }
              } catch (e) {
                bootstrap_alert('Connection error.', 'error');
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
          case -600: message = "File size too big. File must be less than 5MB.";
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
        /*setTimeout(function(){
          upload_err.animate({'opacity':0}, 'slow', function(){
            $(this).slideUp(100, function(){$(this).remove();});
          });
        }, 3000);*/
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
        var plupload_basic = "<div id='"+uploader_id+"' style='float:right;display:inline-block;width:0;height:0;overflow:hidden;'></div>";
        $('body').append(plupload_basic);
        elmBaseSettings["browse_button"] = elm.attr('id');
        elmBaseSettings["container"] = uploader_id;
        elmBaseSettings["file_data_name"] = 'file_'+elm.attr('id');
        elmBaseSettings["multipart_params"]["img_id"] = elm.attr('id');
        elmBaseSettings["multipart_params"]["action"] = "logo_plupload_action";

        // Only for old phone browser, such as android 2
        var ua = navigator.userAgent;
        if(ua.indexOf("Android")>=0){
          var androidversion = parseFloat(ua.slice(ua.indexOf("Android")+8));
          if(androidversion < 2.3){
            elmBaseSettings["runtimes"] = 'html4';
            elmBaseSettings["multipart_params"]["runtime"] = 'html4';
          }
        }
        //--oldphone

        elmBaseSettings["filters"][0]["extensions"] = 'png'; // Just png for logo
        if(typeof(logo_extension)!="undefined" && logo_extension!=''){
          elmBaseSettings["filters"][0]["extensions"] = logo_extension;
        }

        var logo_uploader = new plupload.Uploader(elmBaseSettings);
        logo_uploader.init();
        $('#'+uploader_id+' div').removeAttr('style');
        $('#'+uploader_id+' input').removeAttr('style');

        var logo_loader;
        // When a file was added in the queue
        logo_uploader.bind('FilesAdded', function(up, files){
          $.each(files, function(i, file){
            target.fadeOut(200, function(){
              $('<div class="new_logo_'+file.id+' logo-loader"><span class="upload-counter">0%</span><span class="upload-progress"><span class="fill"></span></span></div>').insertAfter(target);
              logo_loader = $('.new_logo_'+file.id, target.parent());
              //$('.loader', logo_loader).spin('medium-left', '#000000');
              logo_loader.css('visibility', 'visible');
            });
          });
          $('.photo_upload_error').fadeOut('fast', function(){ $(this).remove() });
          up.refresh();
          up.start();
        });

        // Upload progress
        logo_uploader.bind('UploadProgress', function(up, file){
          var thumb = '.new_logo_'+file.id;
          var thumb_progress = thumb+' .upload-progress';
          var thumb_fill_elm = $(thumb_progress+'>.fill');
          var thumb_progress_elm = $(thumb_progress);
          var thumb_counter_elm = $(thumb+' .upload-counter');
          thumb_fill_elm.css('width', file.percent+'%');
          if(file.percent>=100 && !thumb_progress_elm.hasClass('p100')){
            thumb_progress_elm.removeClass('p25 p50 p75');
            thumb_progress_elm.addClass('p100');
          }
          else if(file.percent>=75 && !thumb_progress_elm.hasClass('p75')){
            thumb_progress_elm.removeClass('p25 p50');
            thumb_progress_elm.addClass('p75');
          }
          else if(file.percent>=50 && !thumb_progress_elm.hasClass('p50')){
            thumb_progress_elm.removeClass('p25');
            thumb_progress_elm.addClass('p50');
          }
          else if(file.percent>=25 && !thumb_progress_elm.hasClass('p25')){
            thumb_progress_elm.addClass('p25');
          }
          thumb_counter_elm.html(file.percent+'%');
        });

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
            try {
              // For HTML4 runtime, because it reads rendered html content
              if(elmBaseSettings["multipart_params"]["runtime"]=='html4'){
                response["response"] = response["response"].replace(/_lt_/g, '<');
                response["response"] = response["response"].replace(/_rt_/g, '>');
                response["response"] = response["response"].replace(/_src_/g, 'src=');
                response["response"] = response["response"].replace(/\n/g, '');
              }

              var json_response = JSON.parse(response["response"]);
              logo_loader.fadeOut(200, function(){
                logo_loader.remove();
                if(json_response["status_code"]==1){
                  target.attr('src', json_response["url"]);
                  target.fadeIn(300);
                }
                else {
                  cmd.showError(json_response["error"]);
                }
              });
            } catch (e) {
              bootstrap_alert('Connection error', 'error');
            }
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
      showError: function(error){
        var message = error;
        switch(error.code){
          case -600: message = "File size too big. File must be less than 5MB.";
            break;
        }
        var target = $('#'+elmSettings.data_target_id);
        $('.photo_upload_error').remove();
        $('<div class="photo_upload_error" style="display:none;padding:0 12px 10px 12px;width:auto;"><div class="alert alert-error info-alert" style="margin-bottom:0;padding:5px;"><a class="close" style="margin-right:20px;margin-top:-5px;">×</a><span>'+message+'</span></div></div></div>').insertAfter(target.parent());
        var upload_err = $('.photo_upload_error');
        upload_err.fadeIn(1000);
        $('.close', upload_err).click(function(){
          upload_err.animate({'opacity':0}, 'fast', function(){
            upload_err.slideUp(100, function(){upload_err.remove();});
          });
        });
        // Then remove slowly
        setTimeout(function(){
          upload_err.animate({'opacity':0}, 'slow', function(){
            $(this).slideUp(100, function(){$(this).remove();});
          });
        }, 5000);
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
        var plupload_basic = "<div id='"+uploader_id+"' style='float:right;display:inline-block;width:0;height:0;overflow:hidden;'></div>";
        //$(plupload_basic).insertAfter(elm);
        $('body').append(plupload_basic);
        elmBaseSettings["browse_button"] = elm.attr('id');
        elmBaseSettings["container"] = uploader_id;
        elmBaseSettings["file_data_name"] = 'file_'+elm.attr('id');
        elmBaseSettings["multipart_params"]["img_id"] = elm.attr('id');
        elmBaseSettings["multipart_params"]["action"] = "user_photo_plupload_action";

        // Only for old phone browser, such as android 2
        var ua = navigator.userAgent;
        if(ua.indexOf("Android")>=0){
          var androidversion = parseFloat(ua.slice(ua.indexOf("Android")+8));
          if(androidversion < 2.3){
            elmBaseSettings["runtimes"] = 'html4';
            elmBaseSettings["multipart_params"]["runtime"] = 'html4';
          }
        }
        //--oldphone

        var logo_uploader = new plupload.Uploader(elmBaseSettings);
        logo_uploader.init();
        $('#'+uploader_id+' div').removeAttr('style');
        $('#'+uploader_id+' input').removeAttr('style');

        var logo_loader;
        // When a file was added in the queue
        logo_uploader.bind('FilesAdded', function(up, files){
          $.each(files, function(i, file){
            target.fadeOut(200, function(){
              $('<div class="new_photo_'+file.id+' photo-loader"><span class="upload-counter">0%</span><span class="upload-progress"><span class="fill"></span></span></div>').insertAfter(target);
              logo_loader = $('.new_photo_'+file.id, target.parent());
              //$('.loader', logo_loader).spin('medium-left', '#000000');
              logo_loader.css('visibility', 'visible');
            });
          });
          up.refresh();
          up.start();
        });

        // Upload progress
        logo_uploader.bind('UploadProgress', function(up, file){
          var thumb = '.new_photo_'+file.id;
          var thumb_progress = thumb+' .upload-progress';
          var thumb_fill_elm = $(thumb_progress+'>.fill');
          var thumb_progress_elm = $(thumb_progress);
          var thumb_counter_elm = $(thumb+' .upload-counter');
          thumb_fill_elm.css('width', file.percent+'%');
          if(file.percent>=100 && !thumb_progress_elm.hasClass('p100')){
            thumb_progress_elm.removeClass('p25 p50 p75');
            thumb_progress_elm.addClass('p100');
          }
          else if(file.percent>=75 && !thumb_progress_elm.hasClass('p75')){
            thumb_progress_elm.removeClass('p25 p50');
            thumb_progress_elm.addClass('p75');
          }
          else if(file.percent>=50 && !thumb_progress_elm.hasClass('p50')){
            thumb_progress_elm.removeClass('p25');
            thumb_progress_elm.addClass('p50');
          }
          else if(file.percent>=25 && !thumb_progress_elm.hasClass('p25')){
            thumb_progress_elm.addClass('p25');
          }
          thumb_counter_elm.html(file.percent+'%');
        });

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
            try {
              // For HTML4 runtime, because it reads rendered html content
              if(elmBaseSettings["multipart_params"]["runtime"]=='html4'){
                response["response"] = response["response"].replace(/_lt_/g, '<');
                response["response"] = response["response"].replace(/_rt_/g, '>');
                response["response"] = response["response"].replace(/_src_/g, 'src=');
                response["response"] = response["response"].replace(/\n/g, '');
              }

              var json_response = JSON.parse(response["response"]);
              logo_loader.fadeOut(200, function(){
                logo_loader.remove();
                if(json_response["status_code"]==1){
                  target.attr('src', json_response["url"]);
                  target.fadeIn(300);
                }
                else {
                  cmd.showError('Failed to upload new logo');
                }
              });
            } catch (e) {
              bootstrap_alert('Connection error', 'error');
            }
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
        var plupload_basic = "<div id='"+uploader_id+"' style='float:right;display:inline-block;width:0;height:0;overflow:hidden;'></div>";
        //$(plupload_basic).insertAfter(elm);
        $('body').append(plupload_basic);
        elmBaseSettings["browse_button"] = elm.attr('id');
        elmBaseSettings["container"] = uploader_id;
        elmBaseSettings["file_data_name"] = 'file_'+elm.attr('id');
        elmBaseSettings["multipart_params"]["img_id"] = elm.attr('id');
        elmBaseSettings["multipart_params"]["action"] = "accolade_plupload_action";

        // Only for old phone browser, such as android 2
        var ua = navigator.userAgent;
        if(ua.indexOf("Android")>=0){
          var androidversion = parseFloat(ua.slice(ua.indexOf("Android")+8));
          if(androidversion < 2.3){
            elmBaseSettings["runtimes"] = 'html4';
            elmBaseSettings["multipart_params"]["runtime"] = 'html4';
          }
        }
        //--oldphone

        var accolade_block = elm.closest('.accolade-item');
        var accolade_type = accolade_block.attr('data-type');
        if(accolade_type=='certifications'){
          elmBaseSettings["multipart_params"]["name"] = $('.accolade-authority', accolade_block).val();
        }
        else {
          elmBaseSettings["multipart_params"]["name"] = $('.accolade-name', accolade_block).val();
        }
        elmBaseSettings["multipart_params"]["type"] = accolade_type;
        elmBaseSettings["resize"]["width"] = "200";
        elmBaseSettings["resize"]["height"] = "200";
        var accolade_uploader = new plupload.Uploader(elmBaseSettings);
        accolade_uploader.init();
        $('#'+uploader_id+' div').removeAttr('style');
        $('#'+uploader_id+' input').removeAttr('style');

        var accolade_image_loader;
        // When a file was added in the queue
        accolade_uploader.bind('FilesAdded', function(up, files){
          up.settings.multipart_params["current_id"] = (target.attr('current-id'))?target.attr('current-id'):"";
          up.settings.multipart_params["post_id"] = (target.attr('post-id'))?target.attr('post-id'):"";
          $.each(files, function(i, file){
            target.fadeOut(200, function(){
              $('<div class="new_accolade_image_'+file.id+' accolade-image-loader"><span class="upload-counter">0%</span><span class="upload-progress"><span class="fill"></span></span></div>').insertAfter(target);
              accolade_image_loader = $('.new_accolade_image_'+file.id, target.parent());
              //$('.loader', accolade_image_loader).spin('medium-left', '#000000');
              accolade_image_loader.css('visibility', 'visible');
            });
          });
          up.refresh();
          up.start();
        });

        // Upload progress (not used at the moment)
        accolade_uploader.bind('UploadProgress', function(up, file){
          var thumb = '.new_accolade_image_'+file.id;
          var thumb_progress = thumb+' .upload-progress';
          var thumb_fill_elm = $(thumb_progress+'>.fill');
          var thumb_progress_elm = $(thumb_progress);
          var thumb_counter_elm = $(thumb+' .upload-counter');
          thumb_fill_elm.css('width', file.percent+'%');
          if(file.percent>=100 && !thumb_progress_elm.hasClass('p100')){
            thumb_progress_elm.removeClass('p25 p50 p75');
            thumb_progress_elm.addClass('p100');
          }
          else if(file.percent>=75 && !thumb_progress_elm.hasClass('p75')){
            thumb_progress_elm.removeClass('p25 p50');
            thumb_progress_elm.addClass('p75');
          }
          else if(file.percent>=50 && !thumb_progress_elm.hasClass('p50')){
            thumb_progress_elm.removeClass('p25');
            thumb_progress_elm.addClass('p50');
          }
          else if(file.percent>=25 && !thumb_progress_elm.hasClass('p25')){
            thumb_progress_elm.addClass('p25');
          }
          thumb_counter_elm.html(file.percent+'%');
        });

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
            try {
              // For HTML4 runtime, because it reads rendered html content
              if(elmBaseSettings["multipart_params"]["runtime"]=='html4'){
                response["response"] = response["response"].replace(/_lt_/g, '<');
                response["response"] = response["response"].replace(/_rt_/g, '>');
                response["response"] = response["response"].replace(/_src_/g, 'src=');
                response["response"] = response["response"].replace(/\n/g, '');
              }

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
            } catch (e) {
              bootstrap_alert('Connection error', 'error');
            }
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
 * The attachment uploader, this one is for attach file on edit site
 */
$.fn.attachmentuploader = function() {
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
          var plupload_basic = "<div id='"+uploader_id+"' style='float:right;display:inline-block;width:0;height:0;overflow:hidden;' class='plupload-uploader-container'></div>";
          //$(plupload_basic).insertAfter(elm);
          $(plupload_basic).remove();
          $('body').append(plupload_basic);
          elmBaseSettings["browse_button"] = elm.attr('id');
          elmBaseSettings["container"] = uploader_id;
          elmBaseSettings["file_data_name"] = 'file_'+elm.attr('id');
          elmBaseSettings["multipart_params"]["img_id"] = elm.attr('id');
          elmBaseSettings["multipart_params"]["post_id"] = elmSettings.data_post_id;
          elmBaseSettings["multipart_params"]["template"] = elmSettings.data_template;
          elmBaseSettings["multipart_params"]["action"] = "attachment_plupload_action";

          // Only for old phone browser, such as android 2
          var ua = navigator.userAgent;
          if(ua.indexOf("Android")>=0){
            var androidversion = parseFloat(ua.slice(ua.indexOf("Android")+8));
            if(androidversion < 2.4){
              elmBaseSettings["runtimes"] = 'html4';
              elmBaseSettings["multipart_params"]["runtime"] = 'html4';
            }
            // Only for phone with code SGH and SCH
            else if (ua.indexOf("SGH-")>0 || ua.indexOf("SCH-")>0){
              elmBaseSettings["runtimes"] = 'html4';
              elmBaseSettings["multipart_params"]["runtime"] = 'html4';
            }
          }
          // Only for phone with netfront browser
          else if (ua.indexOf("NetFront")>0){
            elmBaseSettings["runtimes"] = 'html4';
            elmBaseSettings["multipart_params"]["runtime"] = 'html4';
          }
          //--oldphone

          // Max size 1280x1200px
          elmBaseSettings["resize"]["width"] = "1280";
          elmBaseSettings["resize"]["height"] = "1200";

          elmBaseSettings["filters"][1] = {'title': 'Document', 'extensions': 'doc,docx,pdf'};

          var uploader = new plupload.Uploader(elmBaseSettings);
          //uploader.bind('Init', function(up){});
          uploader.init();
          $('#'+uploader_id+' div').removeAttr('style');
          $('#'+uploader_id+' input').removeAttr('style');

          // When a file was added in the queue
          uploader.bind('FilesAdded', function(up, files){
            $.each(files, function(i, file) {
              var new_block = '<li class="new_thumb_'+file.id+'"><a class="thumbnail"><span class="upload-counter">0%</span><span class="upload-progress"><span class="fill"></span></span></a></li>';
              // Append only for showroom images
              if(elmSettings.data_template=='showroom') target.append(new_block);
              else target.prepend(new_block);
              //$('.new_thumb_'+file.id+' .loader', target).spin('medium-left', '#000000');
            });
            $('.photo_upload_error').fadeOut('fast', function(){ $(this).remove() });
            $('.project-publish').addClass('disabled');
            up.refresh();
            up.start();
          });

          // Upload progress
          var t = 0;
          uploader.bind('UploadProgress', function(up, file){
            var thumb = '.new_thumb_'+file.id;
            var thumb_progress = thumb+' .upload-progress';
            var thumb_fill_elm = $(thumb_progress+'>.fill', target);
            var thumb_progress_elm = $(thumb_progress, target);
            var thumb_counter_elm = $(thumb+' .upload-counter', target);
            thumb_fill_elm.css('width', file.percent+'%');
            if(file.percent>=100 && !thumb_progress_elm.hasClass('p100')){
              thumb_progress_elm.removeClass('p25 p50 p75');
              thumb_progress_elm.addClass('p100');
              thumb_counter_elm.html(file.percent+'%');
            }
            else if(file.percent>=75 && !thumb_progress_elm.hasClass('p75')){
              thumb_progress_elm.removeClass('p25 p50');
              thumb_progress_elm.addClass('p75');
            }
            else if(file.percent>=50 && !thumb_progress_elm.hasClass('p50')){
              thumb_progress_elm.removeClass('p25');
              thumb_progress_elm.addClass('p50');
            }
            else if(file.percent>=25 && !thumb_progress_elm.hasClass('p25')){
              thumb_progress_elm.addClass('p25');
            }
            if(file.percent>=100){
              if(t<=0){
                t = setTimeout(function(){
                  if(file.percent==100 && thumb_counter_elm.length>0){
                    thumb_counter_elm.html(file.percent+'%, crunching...');
                  }
                }, 2000);
              }
            }
            else {
              thumb_counter_elm.html(file.percent+'%');
            }
          });

          // When the file was uploaded
          uploader.bind('FileUploaded', function(up, file, response){
            $('.project-publish').removeClass('disabled');
            if(typeof(response=="Object") && response.status==0){
              setTimeout(function(){
                $('li.new_thumb_'+file.id, target).remove();
                cmd.showError({'code':0, 'message':"Connection error"});
              }, 100);
            }
            else {
              try {
                // For HTML4 runtime, because it reads rendered html content
                if(elmBaseSettings["multipart_params"]["runtime"]=='html4'){
                  response["response"] = response["response"].replace(/_lt_/g, '<');
                  response["response"] = response["response"].replace(/_rt_/g, '>');
                  response["response"] = response["response"].replace(/_src_/g, 'src=');
                  response["response"] = response["response"].replace(/\n/g, '');
                }

                var json_response = JSON.parse(response["response"]);
                if(json_response["status_code"]==1){
                  $('li.new_thumb_'+file.id, target).replaceWith(json_response["html"]);
                  if(typeof(bind_colorbox) == "function"){
                    bind_colorbox();
                  }
                }
                else {
                  cmd.showError({'code':0, 'message':json_response["error"]});
                  $('li.new_thumb_'+file.id, target).fadeOut(500, function(){$(this).remove();});
                }
              } catch (e) {
                bootstrap_alert('Connection error', 'error');
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
          case -600: message = "File size too big. File must be less than 5MB.";
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
        /*setTimeout(function(){
          upload_err.animate({'opacity':0}, 'slow', function(){
            $(this).slideUp(100, function(){$(this).remove();});
          });
        }, 3000);*/
      }
    };
    cmd.init();
  });
};

/**
 * Ready, set, go!
 */
$( document ).ready( function() {
  $('.add-media').filter(function(){return (!$(this).hasClass('add-video') && $(this).closest('.project-template').length<=0);}).mediauploader();
  $('button.change-logo,input[type="button"].change-logo').logouploader();
  $('.upload-user-photo').userphotouploader();
  $('.attach-file').attachmentuploader();

  /* Delete media confirmation */
  default_thumb_trash_action();

  /* Open tag media form */
  $(document).on('click', '.action-tag-media', function(e) {
    e.preventDefault();
    var container = $('#tag-media');
    var tag_link = $(this);
    var button = $('.save', container);
    var list = $(this).closest('li');
    var media_id = list.attr('media-id');
    var media_type = list.attr('media-type');
    var media_caption = $('#media-caption');
    var media_description = $('#media-description');
    media_caption.val(list.attr('media-caption'));
    media_description.val(list.attr('media-description'));
    // Nested modal workaround
    jQuery().modal.Constructor.prototype.enforceFocus = function(){};
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
          $('#media-title-'+media_id).html(((media_caption.val()!='')?'<strong>'+media_caption.val()+'</strong>':'')+((media_description.val()!='' && media_description.val()!='')?'<br />':'')+((media_description.val()!='')?media_description.val():''));
          tag_link.html((media_caption.val()!='' || media_description.val()!='')?'Edit description':'Add a description');
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
  $(document)
    .off('click.mediauploader', '.thumb-trash')
    .on('click.mediauploader', '.thumb-trash', function(e) {
    e.preventDefault();
    var list = $(this).closest('li');
    if(list.attr('media-source')!='album-photo-container' && (!list.attr('taxonomy') || list.attr('taxonomy')=='')) {
      var container = $('#delete-media-confirm');
      var button = $('.action-confirm', container);
      var media_id = list.attr('media-id');
      var media_type = list.attr('media-type');
      //var show_modal = true;
      var on_showroom = false;

      if ($(this).closest('#toolbox-activity').length > 0) {
        on_showroom = true;
      }

      // Show modal or alert? Depend on where we are now: project modal or not
      // Nested modal workaround;
      jQuery().modal.Constructor.prototype.enforceFocus = function () {
      };
      container.modal();
      container.removeAttr('style');
      // If we are on showroom, give a little cleaner touch on nested modal
      if (on_showroom) {
        container.css('z-index', 1051);
        $('.modal-backdrop').last().css('z-index', 1050);
      }
      //--on-showroom
      button.unbind('click').click(function (e) {
        e.preventDefault();
        if (!button.hasClass('disabled')) {
          button.addClass('disabled');
          confirm_delete_media(media_id, media_type, false, function () {
            setTimeout(function () {
              list.fadeOut(300, function () {
                $(this).remove();
              });
            }, 600);
            container.modal('hide');
            button.removeClass('disabled');
          }, function () {
            button.removeClass('disabled');
          });
        }
      });
    }
  });
}

/**
 * Function for add video on manage media module
 *
 * @param video_link
 * @param data_target
 * @param data_template
 * @param data_page
 * @param success_callback
 * @param failed_callback
 */
function add_video(video_link, data_target, data_template, data_page, success_callback, failed_callback){
  // If video link is not empty (validate on server side later)
  var data = {
    action: 'add_video',
    'video_link': video_link,
    'template': data_template,
    'page': data_page
  };
  // Set target element list container
  var target = $('#'+data_target);

  var insert_method = (data_template=='showroom')?'append':'prepend';

  $('.project-publish').addClass('disabled');
  var post = new AjaxPost(data, {
    'spinner': new LoadingSpinner({
      'reference_elm': target,
      'insert_method': insert_method,
      'loader_tag': 'li',
      'loader_style': ' ',
      'spinner_style': ' ',
      'spinner_wrapping': '<a></a>',
      'no_hide': true
    })
  },
  // Ajax replied
  function(response){
    try {
      $('.project-publish').removeClass('disabled');
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
    } catch (e) {
      bootstrap_alert('Connection error', 'error');
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
 * @param no_parent // Only remove is parent is not exist
 * @param success_callback
 * @param failed_callback
 */
function confirm_delete_media(media_id, media_type, no_parent, success_callback, failed_callback){
  // Load ajax data
  var data = {
    action: 'delete_media',
    'media_id': media_id,
    'media_type': media_type,
    'no_parent': (no_parent)?1:0
  };
  var container = $("#delete-media-confirm");
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
    try {
      var json_response = JSON.parse(response);
      if(json_response.status==1){
        if(typeof(success_callback)=='function') success_callback();
      }
      else if(json_response.status>=0) {
        bootstrap_alert(json_response.status_message, 'error');
        if(typeof(failed_callback)=='function') failed_callback();
      }
    } catch (e) {
      bootstrap_alert('Connection error', 'error');
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
  var container = $('#tag-media');
  var button = $('.save', container);
  // If any of the content not empty (either caption or description)

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
    try {
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
    } catch (e) {
      bootstrap_alert('Connection error', 'error');
    }
  },
  function(){
    if(typeof(failed_callback)=='function') failed_callback();
  });
  post.doAjaxPost();
}

function bind_colorbox(){
  /* Colorbox element for manage media */
  var colorbox_elm = $('.colorbox-element');
  colorbox_elm.unbind('click');
  colorbox_elm.colorbox({
    iframe: function(){return ($(this).attr('data-video')=='1');},
    innerWidth  : function(){return ($(this).attr('data-video')=='1')?640:0;},
    innerHeight : function(){return ($(this).attr('data-video')=='1')?480:0;},
    title: function(){var title=$(this).data('title');if(title && $('#'+title).length>0 && $('#'+title).html()!=''){$('#cboxTitle').removeAttr('style');if($(this).attr('data-video')=='1'){$('#cboxTitle').css({'margin-bottom':40});}}else{$('#cboxTitle').css({'padding':0});}; return (title && $('#'+title).length>0 && $('#'+title).html()!='')?$('#'+title).html():''; }
  });
}