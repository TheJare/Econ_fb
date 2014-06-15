/*
(C) Copyright by Javier Arevalo in 2012.
	http://www.iguanademos.com/Jare/
	@TheJare on twitter
	https://github.com/TheJare
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

FB_LoadSDK = function() {
	var fb_root = document.createElement('div');
	fb_root.id = "fb-root";
	document.body.appendChild(fb_root);

	// Load the SDK Asynchronously
	(function(d){
		 var js, id = 'facebook-jssdk'; if (d.getElementById(id)) {return;}
		 js = d.createElement('script'); js.id = id; js.async = true;
		 js.src = "//connect.facebook.net/en_US/all.js";
		 d.getElementsByTagName('head')[0].appendChild(js);
	 }(document));
}

FB_Init = function(app_id, fb_channel, cb) {

	FB_LoadSDK();

	window.fbAsyncInit = function() {
		FB.init({
			appId      : app_id, // App ID
			channelUrl : '//'+location.hostname + '/'+fb_channel, // Channel File
			status     : true, // check login status
			cookie     : false, // enable cookies to allow the server to access the session
			xfbml      : true  // parse XFBML
		});
		// This below is serious fail for non-flash stuff
		FB.Canvas.setAutoGrow();
	
		FB.getLoginStatus(function(response) {
			logobj(response);
			// Get name and photo, to show api calls and canvas resizing.
			FB.api('/me', function(me) {
				logobj(me);
				cb(me);
			});
		});
	};


}
