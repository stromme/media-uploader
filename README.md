# Upload-media plugin

Use the WP media manager inside a theme to upload images to a users blog.

## Usage

Attach image-upload capability to any button within a theme. Ex `<button type='file' data-target='HTMLelementID' data-template='showroom'>`
 
## User Experience

On clicking the button the file browser will open for selecting the photo to upload. On mobile browsers and It would open the 'add photo' dialogue. This is the exact same functionality as clicking the 'select files' button in the WP media uploader. 

Once an image(s) has been selected a loading symbol will appear in the target HTML element specified by `data-target`. When the image has been sucesfully loaded the thumbnail will appear in the target HTML element.

## Image Processing

Uploading will take place using native WP functions, including the WP FLASH/HTML fall back. Images will be crunched and resized by WP. 

## Settings

### Template

An HTML template for the newly added images is specified by the data-template value. ex. 

```<li>
	<a href="#" class="thumbnail">
		<img src="uploaded_image.png" id="post_attachement_id">
		<div class="thumb-favorite" rel="tooltip" data-placement="top" title="Mark the photo as your favorite, this will be shown first."><i class="icon-ok icon-white"></i></div>
		<div class="thumb-trash"><i class="icon-trash"></i></div>
	</a>
</li>`

Template should be loaded if possible using the WP function get_template_part(). 

### File types

Only allow uploading of standard image file formats. No video uploads.

### Max upload size

No uploads over 5MB.