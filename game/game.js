var mongodb = require('mongodb'),
  Db = mongodb.Db,
  Connection = mongodb.Connection,
  Server = mongodb.Server;

var util = require('util');

var db = null;

var nextSessionId = 1;

var InitDb = exports.InitDb = function(cb) {
	if (db) {
		if (cb) cb(null, db);
		return;
	}

	var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
	var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

	console.log("Connecting to " + host + ":" + port);
	db = new Db('Econ_fb', new Server(host, port, {}), {});
	db.open(function(err, db) {
		if (err) db = null;
		if (cb) cb(err, db);
	});
}

var NewSession = exports.NewSession = function(SNUserId, cb) {
	InitDb(function(err, db) {
	    db.collection('users', function(err, collection) {
	        collection.findOne({sn_id:SNUserId}, function(err, user) {
	        	var onUser = function(user) {
	        		console.log("Found user " + util.inspect(user));
	        		user.num_sessions++;
	        		user.session_id = nextSessionId++;
	        		collection.update({_id:user._id}, user);
	        		cb(user);
	        	};

	        	if (err || !user) {
	        		var newUser = {sn_id:SNUserId, num_sessions:0};
	        		collection.insert(newUser, function(err, user) {
	        			if (!err)
		        			onUser(user);
	        		});
	        	} else {
	        		onUser(user);
	        	}
	        });          
	    });
	});
}
