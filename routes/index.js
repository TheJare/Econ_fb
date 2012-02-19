/*
(C) Copyright by Javier Arevalo in 2012.
    http://www.iguanademos.com/Jare/
    @TheJare on twitter
    https://github.com/TheJare
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

var CONFIG = require('./config')
  , game = require('../game/game')
  , FB = require('../lib/server_fb');

// Main FB app page
exports.index = function(req, res) {
    /*console.log("Request received!"
        + "\n  query: " + JSON.stringify(req.query)
        + "\n  url: " + JSON.stringify(req.url)
        + "\n  originalUrl: " + JSON.stringify(req.originalUrl)
        + "\n  connection: " + JSON.stringify(Object.keys(req.connection))
        + "\n  body: " + JSON.stringify(req.body)
        + "\n  method: " + req.method
        + "\n  headers: " + JSON.stringify(req.headers)
        + "\n  cookies: " + JSON.stringify(req.cookies)
        + "\n  request keys: " + JSON.stringify(Object.keys(req)));*/

    var payload = FB.MainPageFlow(CONFIG, req, res);
    if (!payload)
        return;

    // We're happily logged in - render the game!
    game.NewSession(payload.user_id, function(user) {
        res.render('econ', { layout: false,
            facebook_user_id: payload.user_id
          , app_id: CONFIG.APP_ID
          , server_url: CONFIG.SERVER_URL
          , session_id: user.session_id
          , num_sessions: user.num_sessions
        });
    });
};

exports.fb_channel = FB.ChannelFile;

// app API
exports.api = function(req, res) {
    var t = "Hi Mr. " + req.params.id + "<br>You are trying to call function " + req.params.cmd
      + "\n<br>  query: " + JSON.stringify(req.query)
      + "\n<br>  body: " + JSON.stringify(req.body)
      + "\n<br>  method: " + req.method
      + "\n<br>  headers: " + JSON.stringify(req.headers)
      + "\n<br>  cookies: " + JSON.stringify(req.cookies)
      + "\n<br>  request keys: " + JSON.stringify(Object.keys(req));
    res.send(t);
    console.log(t);
};
