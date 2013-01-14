# Upload-media plugin

Extends the WP media manager class for use inside a theme to upload images to a users blog.

** Context** Plugin is only runs for logged in WP users who are currently viewing the post-type 'toolbox'. Upload JS Class should be only called on pages that have a button of the type 'file'.

## Usage

Attach image-upload capability to any button within a theme. Ex `<button type='file' data-post-id='post_ID' data-target-id='html-element-id' data-template='showroom-template'>`

`"data-post-id"`: ID of the post the uploaded image will be attached to.
`"data-target-id"`: ID of the HTML element were the new image template will be appended. ex. "showroom"
`"data-template"`: Name of template to use to display the uploaded photos.
 
## User Experience

On clicking the button the file browser will immediately open for selecting the photo to upload. No intermediate step like when adding media on WP posts. 

On mobile browsers and It would open the 'add photo' dialogue. This is the exact same functionality as clicking the 'select files' button in the WP media uploader. 

Once an image(s) has been selected a loading symbol will appear in the target HTML element specified by `data-target`. Use spin.js for loading states. When the image has been successfully loaded the thumbnail will appear in the target HTML element.

## Image Processing

Uploading will take place using native WP functions, including the WP FLASH/HTML fall back. Images will be crunched and resized by WP. 


## Templates

An HTML template for the newly added images is specified by the data-template value. ex. 

```
<li>
	<a href="#" class="thumbnail">
		<img src="uploaded_image.png" id="post_attachement_id">
		<div class="thumb-favorite" rel="tooltip" data-placement="top" title="Mark the photo as your favorite."><i class="icon-ok icon-white"></i></div>
		<div class="thumb-trash"><i class="icon-trash"></i></div>
	</a>
</li>
```

Template should be loaded if possible using the WP function get_template_part(). 


## Validation

** File Size: ** Will be determined in the setting, default is 5MB.

** Dimensions: ** Image must be minimum the width/height of the wp specified image size.

** Formats: **  Only allow uploading of standard image file formats. No video uploads.

## Settings

Settings can be accessed from the site `Settings-> Media Uploader` menu.

Settings that can be updated are:

* Maximum upload size (in Bytes)

* Maximum image resolution when uploading (width and height)

* Image quality when resizing


# Features

* Large images will be resized locally before uploading (maximum 1200x1200 pixels)

* Wordpress will automatically creates various sizes (wp specified sizes) of the uploaded images

 # Upgrades Roadmap

* Immediately after user selects a photo to upload, a modal opens with the photo to allow for custom cropping. Same style as WP native custom cropping used on WP header image wp-admin page.

# Resources

** WP image sizes ** http://justintadlock.com/archives/2011/06/24/image-sizes-in-wordpress