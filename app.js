/*
(C) Copyright by Javier Arevalo in 2012.
		http://www.iguanademos.com/Jare/
		@TheJare on twitter
		https://github.com/TheJare
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

var express = require('express')
	, routes = require('./routes')

var app = module.exports = express.createServer();

// Configuration

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

app.listen(process.env.PORT || 3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
