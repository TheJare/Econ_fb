/*
(C) Copyright by Javier Arevalo in 2012.
    http://www.iguanademos.com/Jare/
    @TheJare on twitter
    https://github.com/TheJare
Licensed under the MIT license: http://www.opensource.org/licenses/mit-license.php
*/

var mongodb = require('mongodb')
  , Db = mongodb.Db
  , Connection = mongodb.Connection
  , Server = mongodb.Server;

var util = require('util');

var Rng = require('../lib/rng');

var database = null;

var nextSessionId = 1;

var InitDb = exports.InitDb = function(cb) {
	if (database) {
		console.log("DB already set up, reusing it.")
		if (cb) cb(null, database);
		return;
	}

	var host = process.env['MONGO_NODE_DRIVER_HOST'] != null ? process.env['MONGO_NODE_DRIVER_HOST'] : 'localhost';
	var port = process.env['MONGO_NODE_DRIVER_PORT'] != null ? process.env['MONGO_NODE_DRIVER_PORT'] : Connection.DEFAULT_PORT;

	console.log("Connecting to " + host + ":" + port);
	database = new Db('Econ_fb', new Server(host, port, {}), {});
	database.open(function(err, db) {
		// If database is not available, clear global database object to avoid reuse
		if (err) database = null;
		if (cb) cb(err, db);
	});
}

var NewSession = exports.NewSession = function(SNUserId, cb) {
	InitDb(function(err, db) {
		var newUser = {
    		sn_id:SNUserId,
    		num_sessions:0,
    		seed: Rng.LCG.newSeed()
    	};
		if (err) {
			// Fake session without DB access. Not that it matters anyway
			console.log("No MongoDB available, playing without persistent sessions.\n" + err);
			cb(newUser);
			return;
		}
	    db.collection('users', function(err, collection) {
			if (err) {
				// Fake session without DB access. Not that it matters anyway
				console.log("Eror opening collection, playing without persistent sessions.\n" + err);
				cb(newUser);
				return;
			}
	        collection.findOne({sn_id:SNUserId}, function(err, user) {
	        	var onUser = function(user, dbcollection) {
	        		console.log("Found user " + util.inspect(user));
	        		user.num_sessions++;
	        		user.session_id = nextSessionId++;
	        		dbcollection.update({_id:user._id}, user);
	        		user.collection = dbcollection;
	        		cb(user);
	        	};

	        	if (err || !user) {
	        		collection.insert(newUser, function(err, n) {
						if (err) {
							// Fake session without DB access. Not that it matters anyway
							console.log("Eror inserting new user, playing without persistent sessions.\n" + err);
							cb(newUser);
							return;
						}
	        			onUser(newUser, collection);
	        		});
	        	} else {
	        		onUser(user, collection);
	        	}
	        });          
	    });
	});
}
