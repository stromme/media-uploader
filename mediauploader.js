(function($){ // Open closure

/**
 * The media uploader jQuery plugin
 */
$.fn.mediauploader = function(options) {
  // Initialize our variables
  return this.each(function() {
    var elm = $(this);
    var elmSettings = {};

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
        plupload_base_settings["browse_button"] = elm.attr('id');
        plupload_base_settings["container"] = uploader_id;
        plupload_base_settings["file_data_name"] = elm.attr('id')+'_image';
        plupload_base_settings["multipart_params"]["img_id"] = elm.attr('id');
        plupload_base_settings["multipart_params"]["post_id"] = elmSettings.data_post_id;
        var uploader = new plupload.Uploader(plupload_base_settings);
        uploader.bind('Init', function(up){});
        uploader.init();

        // When a file was added in the queue
        uploader.bind('FilesAdded', function(up, files){
          $.each(files, function(i, file) {
            target.append('<li class="thumb_'+file.id+'"><a><span class="loader"></span></a></li>');
            $('.thumb_'+file.id+' .loader', target).spin('medium-left', '#000000');
          });
          up.refresh();
          up.start();
        });

        uploader.bind('UploadProgress', function(up, file){
          //$('.thumb_'+file.id+" .uploaded").html('('+plupload.formatSize(parseInt(file.size*file.percent/100))+'/'+plupload.formatSize(file.size)+')');
          //$('.thumb_'+file.id+" .percent").html(file.percent+'%');
        });

        // a file was uploaded
        uploader.bind('FileUploaded', function(up, file, response){
          response = JSON.parse(response["response"]);
          var image = response.url;
          var attachment_id = response.attachment_id;
          var attachment_thumb = response.attachment_thumb;
          // Replace current thumb content
          $('li.thumb_'+file.id, target).html(
            '<a id="'+ file.id +'" href="'+image+'" target="_blank" class="thumbnail" alt="'+file.name+' title="'+file.name+'">' +
            '<img src="'+attachment_thumb+'" id="thumb_'+attachment_id+'" />' +
            '<div class="thumb-favorite" rel="tooltip" data-placement="top" title="Mark the photo as your favorite."><i class="icon-ok icon-white"></i></div>' +
            '<div class="thumb-trash"><i class="icon-trash"></i></div>' +
            '</a>'
          );
          // Clear current thumb class
          $('li.thumb_'+file.id, target).removeAttr('class');
        });

        uploader.bind('Error', function(up, e){
          // Show error
          $('<div class="upload_error" style="display:none;">'+e.message+'</div>').insertAfter(elm);
          var upload_err = $('.upload_error');
          upload_err.fadeIn(1000);
          // Then remove slowly
          setTimeout(function(){
            upload_err.animate({'opacity':0}, 1000, function(){
              $(this).hide(100, function(){$(this).remove();});
            });
          }, 2000);
        });
      }
    };
    cmd.init();
  });
}

/**
 * Ready, set, go!
 */
$( document ).ready( function() {
  $('button#photo-add,input[type="button"]#photo-add').mediauploader();
});

})(jQuery); // Close closure


// Move spinner here

//fgnass.github.com/spin.js#v1.2.4
(function(window, document, undefined) {

/**
 * Copyright (c) 2011 Felix Gnass [fgnass at neteye dot de]
 * Licensed under the MIT license
 */

	var prefixes = ['webkit', 'Moz', 'ms', 'O']; /* Vendor prefixes */
	var animations = {}; /* Animation rules keyed by their name */
	var useCssAnimations;

	/**
	 * Utility function to create elements. If no tag name is given,
	 * a DIV is created. Optionally properties can be passed.
	 */
	function createEl(tag, prop) {
		var el = document.createElement(tag || 'div');
		var n;

		for(n in prop) {
			el[n] = prop[n];
		}
		return el;
	}

	/**
	 * Appends children and returns the parent.
	 */
	function ins(parent /* child1, child2, ...*/) {
		for (var i=1, n=arguments.length; i<n; i++) {
			parent.appendChild(arguments[i]);
		}
		return parent;
	}

	/**
	 * Insert a new stylesheet to hold the @keyframe or VML rules.
	 */
	var sheet = function() {
		var el = createEl('style');
		ins(document.getElementsByTagName('head')[0], el);
		return el.sheet || el.styleSheet;
	}();

	/**
	 * Creates an opacity keyframe animation rule and returns its name.
	 * Since most mobile Webkits have timing issues with animation-delay,
	 * we create separate rules for each line/segment.
	 */
	function addAnimation(alpha, trail, i, lines) {
		var name = ['opacity', trail, ~~(alpha*100), i, lines].join('-');
		var start = 0.01 + i/lines*100;
		var z = Math.max(1-(1-alpha)/trail*(100-start) , alpha);
		var prefix = useCssAnimations.substring(0, useCssAnimations.indexOf('Animation')).toLowerCase();
		var pre = prefix && '-'+prefix+'-' || '';

		if (!animations[name]) {
			sheet.insertRule(
				'@' + pre + 'keyframes ' + name + '{' +
				'0%{opacity:'+z+'}' +
				start + '%{opacity:'+ alpha + '}' +
				(start+0.01) + '%{opacity:1}' +
				(start+trail)%100 + '%{opacity:'+ alpha + '}' +
				'100%{opacity:'+ z + '}' +
				'}', 0);
			animations[name] = 1;
		}
		return name;
	}

	/**
	 * Tries various vendor prefixes and returns the first supported property.
	 **/
	function vendor(el, prop) {
		var s = el.style;
		var pp;
		var i;

		if(s[prop] !== undefined) return prop;
		prop = prop.charAt(0).toUpperCase() + prop.slice(1);
		for(i=0; i<prefixes.length; i++) {
			pp = prefixes[i]+prop;
			if(s[pp] !== undefined) return pp;
		}
	}

	/**
	 * Sets multiple style properties at once.
	 */
	function css(el, prop) {
		for (var n in prop) {
			el.style[vendor(el, n)||n] = prop[n];
		}
		return el;
	}

	/**
	 * Fills in default values.
	 */
	function merge(obj) {
		for (var i=1; i < arguments.length; i++) {
			var def = arguments[i];
			for (var n in def) {
				if (obj[n] === undefined) obj[n] = def[n];
			}
		}
		return obj;
	}

	/**
	 * Returns the absolute page-offset of the given element.
	 */
	function pos(el) {
		var o = {x:el.offsetLeft, y:el.offsetTop};
		while((el = el.offsetParent)) {
			o.x+=el.offsetLeft;
			o.y+=el.offsetTop;
		}
		return o;
	}

	var defaults = {
		lines: 12,            // The number of lines to draw
		length: 7,            // The length of each line
		width: 5,             // The line thickness
		radius: 10,           // The radius of the inner circle
		color: '#000',        // #rgb or #rrggbb
		speed: 1,             // Rounds per second
		trail: 100,           // Afterglow percentage
		opacity: 1/4,         // Opacity of the lines
		fps: 20,              // Frames per second when using setTimeout()
		zIndex: 2e9,          // Use a high z-index by default
		className: 'spinner', // CSS class to assign to the element
		top: 'auto',          // center vertically
		left: 'auto'          // center horizontally
	};

	/** The constructor */
	var Spinner = function Spinner(o) {
		if (!this.spin) return new Spinner(o);
		this.opts = merge(o || {}, Spinner.defaults, defaults);
	};

	Spinner.defaults = {};
	Spinner.prototype = {
		spin: function(target) {
			this.stop();
			var self = this;
			var o = self.opts;
			var el = self.el = css(createEl(0, {className: o.className}), {position: 'relative', zIndex: o.zIndex});
			var mid = o.radius+o.length+o.width;
			var ep; // element position
			var tp; // target position

			if (target) {
				target.insertBefore(el, target.firstChild||null);
				tp = pos(target);
				ep = pos(el);
				css(el, {
					left: (o.left == 'auto' ? tp.x-ep.x + (target.offsetWidth >> 1) : o.left+mid) + 'px',
					top: (o.top == 'auto' ? tp.y-ep.y + (target.offsetHeight >> 1) : o.top+mid)  + 'px'
				});
			}

			el.setAttribute('aria-role', 'progressbar');
			self.lines(el, self.opts);

			if (!useCssAnimations) {
				// No CSS animation support, use setTimeout() instead
				var i = 0;
				var fps = o.fps;
				var f = fps/o.speed;
				var ostep = (1-o.opacity)/(f*o.trail / 100);
				var astep = f/o.lines;

				!function anim(){
					i++;
					for (var s=o.lines; s; s--) {
						var alpha = Math.max(1-(i+s*astep)%f * ostep, o.opacity);
						self.opacity(el, o.lines-s, alpha, o);
					}
					self.timeout = self.el && setTimeout(anim, ~~(1000/fps));
				}();
			}
			return self;
		},
		stop: function() {
			var el = this.el;
			if (el) {
				clearTimeout(this.timeout);
				if (el.parentNode) el.parentNode.removeChild(el);
				this.el = undefined;
			}
			return this;
		},
		lines: function(el, o) {
			var i = 0;
			var seg;

			function fill(color, shadow) {
				return css(createEl(), {
					position: 'absolute',
					width: (o.length+o.width) + 'px',
					height: o.width + 'px',
					background: color,
					boxShadow: shadow,
					transformOrigin: 'left',
					transform: 'rotate(' + ~~(360/o.lines*i) + 'deg) translate(' + o.radius+'px' +',0)',
					borderRadius: (o.width>>1) + 'px'
				});
			}
			for (; i < o.lines; i++) {
				seg = css(createEl(), {
					position: 'absolute',
					top: 1+~(o.width/2) + 'px',
					transform: o.hwaccel ? 'translate3d(0,0,0)' : '',
					opacity: o.opacity,
					animation: useCssAnimations && addAnimation(o.opacity, o.trail, i, o.lines) + ' ' + 1/o.speed + 's linear infinite'
				});
				if (o.shadow) ins(seg, css(fill('#000', '0 0 4px ' + '#000'), {top: 2+'px'}));
				ins(el, ins(seg, fill(o.color, '0 0 1px rgba(0,0,0,.1)')));
			}
			return el;
		},
		opacity: function(el, i, val) {
			if (i < el.childNodes.length) el.childNodes[i].style.opacity = val;
		}
	};

	/////////////////////////////////////////////////////////////////////////
	// VML rendering for IE
	/////////////////////////////////////////////////////////////////////////

	/**
	 * Check and init VML support
	 */
	!function() {
		var s = css(createEl('group'), {behavior: 'url(#default#VML)'});
		var i;

		if (!vendor(s, 'transform') && s.adj) {

			// VML support detected. Insert CSS rules ...
			for (i=4; i--;) sheet.addRule(['group', 'roundrect', 'fill', 'stroke'][i], 'behavior:url(#default#VML)');

			Spinner.prototype.lines = function(el, o) {
				var r = o.length+o.width;
				var s = 2*r;

				function grp() {
					return css(createEl('group', {coordsize: s +' '+s, coordorigin: -r +' '+-r}), {width: s, height: s});
				}

				var margin = -(o.width+o.length)*2+'px';
				var g = css(grp(), {position: 'absolute', top: margin, left: margin});

				var i;

				function seg(i, dx, filter) {
					ins(g,
						ins(css(grp(), {rotation: 360 / o.lines * i + 'deg', left: ~~dx}),
							ins(css(createEl('roundrect', {arcsize: 1}), {
									width: r,
									height: o.width,
									left: o.radius,
									top: -o.width>>1,
									filter: filter
								}),
								createEl('fill', {color: o.color, opacity: o.opacity}),
								createEl('stroke', {opacity: 0}) // transparent stroke to fix color bleeding upon opacity change
							)
						)
					);
				}

				if (o.shadow) {
					for (i = 1; i <= o.lines; i++) {
						seg(i, -2, 'progid:DXImageTransform.Microsoft.Blur(pixelradius=2,makeshadow=1,shadowopacity=.3)');
					}
				}
				for (i = 1; i <= o.lines; i++) seg(i);
				return ins(el, g);
			};
			Spinner.prototype.opacity = function(el, i, val, o) {
				var c = el.firstChild;
				o = o.shadow && o.lines || 0;
				if (c && i+o < c.childNodes.length) {
					c = c.childNodes[i+o]; c = c && c.firstChild; c = c && c.firstChild;
					if (c) c.opacity = val;
				}
			};
		}
		else {
			useCssAnimations = vendor(s, 'animation');
		}
	}();

	window.Spinner = Spinner;

})(window, document);

/*
 * Matt Husby https://github.com/matthusby/spin.js
 * Based on the jquery plugin by Bradley Smith
 * https://gist.github.com/1290439
 */

/*
Add spin to the jQuery object
If color is not passed the spinner will be black
You can now create a spinner using any of the variants below:
$("#el").spin(); // Produces default Spinner
$("#el").spin("small"); // Produces a 'small' Spinner
$("#el").spin("large", "white"); // Produces a 'large' Spinner in white (or any valid CSS color).
$("#el").spin({ ... }); // Produces a Spinner using your custom settings.
$("#el").spin("small-right"); // Pin the small spinner to the right edge
$("#el").spin("{small, medium, large}-{left, right, top, bottom}"); // All options for where to pin
$("#el").spin(false); // Kills the spinner.
*/

( function( $ ) {
	$.fn.spin = function( opts, color ) {
		var presets = {
			"small": { lines: 8, length: 2, width: 2, radius: 3, trail: 60, speed: 1.3 },
			"medium": { lines: 8, length: 4, width: 3, radius: 5, trail: 60, speed: 1.3 },
			"large": { lines: 10, length: 6, width: 4, radius: 7, trail: 60, speed: 1.3 }
		};
		if ( Spinner ) {
			return this.each( function() {
				var $this = $( this ),
					data = $this.data();

				if ( data.spinner ) {
					data.spinner.stop();
					delete data.spinner;
				}
				if ( opts !== false ) {
					var spinner_options;
					if ( typeof opts === "string" ) {
						var spinner_base = opts.indexOf( '-' );
						if( spinner_base == -1 ) {
							spinner_base = opts;
						} else {
							spinner_base = opts.substring( 0, spinner_base );
						}
						if ( spinner_base in presets ) {
							spinner_options = presets[spinner_base];
						} else {
							spinner_options = {};
						}
						var padding;
						if ( opts.indexOf( "-right" ) != -1 ) {
							padding = jQuery( this ).css( 'padding-left' );
							if( typeof padding === "undefined" ) {
								padding = 0;
							} else {
								padding = padding.replace( 'px', '' );
							}
							spinner_options.left = jQuery( this ).outerWidth() - ( 2 * ( spinner_options.length + spinner_options.width + spinner_options.radius ) ) - padding - 5;
						}
						if ( opts.indexOf( '-left' ) != -1 ) {
							spinner_options.left = 5;
						}
						if ( opts.indexOf( '-top' ) != -1 ) {
							spinner_options.top = 5;
						}
						if ( opts.indexOf( '-bottom' ) != -1 ) {
							padding = jQuery( this ).css( 'padding-top' );
							if( typeof padding === "undefined" ) {
								padding = 0;
							} else {
								padding = padding.replace( 'px', '' );
							}
							spinner_options.top = jQuery( this ).outerHeight() - ( 2 * ( spinner_options.length + spinner_options.width + spinner_options.radius ) ) - padding - 5;
						}
					}
					if( color ){
						spinner_options.color = color;
					}
					data.spinner = new Spinner( spinner_options ).spin( this );
				}
			});
		} else {
			throw "Spinner class not available.";
		}
	};
})( jQuery );