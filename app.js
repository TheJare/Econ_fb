/*
(C) Copyright by Javier Arevalo in 2012.
		http://www.iguanademos.com/Jare/
		@TheJare on twitter
		https://github.com/TheJare
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

var express = require('express')
	, routes = require('./routes')
	, game = require('./game/game')
	, fs = require('fs')

// Server App configuration
var SetupApp = function(app) {
	app.configure(function(){
		app.set('views', __dirname + '/views');
		app.set('view engine', 'ejs');
		app.use(express.bodyParser());
		app.use(express.methodOverride());
		app.use(app.router);
		app.use(express.cookieParser());
		app.use(express.static(__dirname + '/static'));
	});

	app.configure('development', function(){
		app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
	});

	app.configure('production', function(){
		app.use(express.errorHandler()); 
	});

	// Routes
	app.all('/', routes.index); // Canvas app page
	app.get('/fb_channel.html', routes.fb_channel); // Facebook channel file
	app.post('/api/:id/:cmd', routes.api); // Server API
}

var httpApp = express.createServer();
SetupApp(httpApp);

// Heroku balancers deal with http/https, for localhost we need two servers
var httpsApp = null;
if (!process.env.PORT) {
	var ssloptions = {
	  key: fs.readFileSync('ssl/localhost.key'),
	  cert: fs.readFileSync('ssl/localhost.crt')
	};

	httpsApp = express.createServer(ssloptions);
	SetupApp(httpsApp);
}

// Connect to database and run server
// Need some database conection recovery inside as well
game.InitDb(function(err, db) {
	if (err) {
		console.log("Warning: No database available.\n" + err);
	}
	httpApp.listen(process.env.PORT || 3000);
	console.log("Express HTTP server listening on port %d in %s mode", httpApp.address().port, httpApp.settings.env);
	if (httpsApp) {
		httpsApp.listen(3443);
		console.log("Express HTTPS server listening on port %d in %s mode", httpsApp.address().port, httpsApp.settings.env);
	}
});
