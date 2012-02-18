
CONFIG = require('./config');
game = require('../game/game');

// Signed request from Facebook
function strtr(str, from, to) {
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

function ParseSignedRequest(signed_request) {
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

// Main FB app page
exports.index = function(req, res) {
    console.log("Request received!"
        + "\n  query: " + JSON.stringify(req.query)
        + "\n  url: " + JSON.stringify(req.url)
        + "\n  originalUrl: " + JSON.stringify(req.originalUrl)
        + "\n  connection: " + JSON.stringify(Object.keys(req.connection))
        + "\n  body: " + JSON.stringify(req.body)
        + "\n  method: " + req.method
        + "\n  headers: " + JSON.stringify(req.headers)
        + "\n  cookies: " + JSON.stringify(req.cookies)
        + "\n  request keys: " + JSON.stringify(Object.keys(req)));

    var signed_request = req.body.signed_request;
    if (signed_request == undefined) {
        // Some kind of error, or we just logged in. Just redirect to the Facebook app page
        console.log("No signed request, redirecting to app page");
        res.send("<script>top.location.href='" + CONFIG.FACEBOOK_PAGE + "'</script>");
        return;
    }
    var request = ParseSignedRequest(signed_request);
    if (request.payload_data.user_id == undefined) {
        console.log("Redirecting to login");
        // Using the canvas page itself as the login target, it will in turn catch the first if
        // and return to the facebook app page.
        var auth_url = "https://www.facebook.com/dialog/oauth?client_id=" + CONFIG.APP_ID
            + "&redirect_uri=" + encodeURIComponent(/*CONFIG.CANVAS_PAGE*/ (req.connection.encrypted ? 'https' : 'http') + "://"+req.headers.host+req.url)
            + "&scope=email,read_stream";
        res.send("<script> top.location.href='" + auth_url + "'</script>");
        return;
    }

    // We're happily logged in - render the game!
    game.NewSession(request.payload_data.user_id, function(user) {
        res.render('econ', { layout: false,
            facebook_user_id: request.payload_data.user_id
          , app_id: CONFIG.APP_ID
          , server_url: CONFIG.SERVER_URL
          , session_id: user.session_id
          , num_sessions: user.num_sessions
        });
    });
};

// Facebook channel file
exports.fb_channel = function(req, res) {
    // Make it expire one year from now
    var cache_expire = 60*60*24*365;
    res.header('Pragma', 'public');
    res.header("Cache-Control', 'max-age=" + cache_expire); // Is this necessary??
    res.header('Expires', (new Date(Date.now()+cache_expire*1000) ).toUTCString());
    res.send('<script src="//connect.facebook.net/en_US/all.js"></script>');
};

// app API
exports.api = function(req, res) {
  res.send("Hi Mr. " + req.params.id + "<br>You are trying to call function " + req.params.cmd
    + "<br>  query: " + JSON.stringify(req.query)
    + "<br>  body: " + JSON.stringify(req.body)
    + "<br>  method: " + req.method
    + "<br>  headers: " + JSON.stringify(req.headers)
    + "<br>  cookies: " + JSON.stringify(req.cookies)
    + "<br>  request keys: " + JSON.stringify(Object.keys(req)));
};
