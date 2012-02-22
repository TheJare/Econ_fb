/*
(C) Copyright by Javier Arevalo in 2012.
	http://www.iguanademos.com/Jare/
	@TheJare on twitter
	https://github.com/TheJare
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

// ---------------
// Utils to deal with Facebook

// Signed request from Facebook
var strtr = function(str, from, to) {
	var dest = "";
	for (var i = 0; i < str.length; ++i) {
		var c = str.charAt(i);
		for (var j = 0; j < from.length; ++j) {
			if (c == from.charAt(j)) { c = to.charAt(j); break; }
		}
		dest = dest + c;
	}
	return dest;
}

var ParseSignedRequest = function(signed_request) {
	var splitReq = signed_request.split(".", 2);
	if (splitReq.length != 2) {
		// No payload, no joy
		return { 'encoded_sig': signed_request, 'payload_data': {} };
	}

	var payload = strtr(splitReq[splitReq.length-1], '-_', '+/');
	var data_str = new Buffer(payload, 'base64').toString('ascii');
	console.log("\n  payload: " + data_str + "<br>");
	var data = JSON.parse(data_str);
	return { 'encoded_sig': splitReq[0], 'payload_data': data };
}

exports.ParseSignedRequest = ParseSignedRequest;

// ---------------
// config is a configuration object with the following properties:
//  FACEBOOK_PAGE
//  APP_ID
// Returns null or a payload_data object containing info about the logged in user
//  user_id: Facebook userID
//  algorithm: string, f.ex. "HMAC-SHA256"
//  expires": unix timestamp
//  issued_at: unix timestamp
//  oauth_token: string
//  user:
//   country:string f.ex. "es"
//   locale: ISO local code f.ex. "en_US"
//   age:
//     min: years of age, typically 21
var MainPageFlow = function(config, req, res) {

	var signed_request = req.body.signed_request;
	if (signed_request == undefined) {
		// Some kind of error, or we just logged in. Just redirect to the Facebook app page
		console.log("No signed request, redirecting to app page");
		res.send("<script>top.location.href='" + config.FACEBOOK_PAGE + "'</script>");
		return null;
	}
	var request = ParseSignedRequest(signed_request);
	if (request.payload_data.user_id == undefined) {
		console.log("Redirecting to login");
		// Using the canvas page itself as the login target, it will in turn catch the first if
		// and return to the facebook app page.
		// Also, we can't use protocol-relative URLS for redirection, Facebook errors with those. (?)
		var auth_url = "https://www.facebook.com/dialog/oauth?client_id=" + CONFIG.APP_ID
			+ "&redirect_uri=" + encodeURIComponent(/*CONFIG.CANVAS_PAGE*/ (req.connection.encrypted ? 'https' : 'http') + "://"+req.headers.host+req.url)
			+ "&scope=" + config.FB_PERMISSIONS;
		res.send("<script> top.location.href='" + auth_url + "'</script>");
		return null;
	}
	return request.payload_data;
}

exports.MainPageFlow = MainPageFlow;


// ---------------
// Build a Facebook channel file with correct contents and headers.
var ChannelFile = function(req, res) {
	// Make it expire one year from now
	var cache_expire = 60*60*24*365;
	res.header('Pragma', 'public');
	res.header("Cache-Control', 'max-age=" + cache_expire); // Is this necessary??
	res.header('Expires', (new Date(Date.now()+cache_expire*1000) ).toUTCString());
	res.send('<script src="//connect.facebook.net/en_US/all.js"></script>');
};

exports.ChannelFile = ChannelFile;
