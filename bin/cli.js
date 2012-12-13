#!/usr/bin/env node
var Trakt = require('../index.js');
var argv = require('optimist')
	.usage('Usage: $0 -a <action> -m <method> [options]')
	.alias('u', 'user')
	.alias('p', 'pass')
	.alias('a', 'action')
	.alias('m', 'method')
	.demand(['a','m'])
	.argv;

var trakt = new Trakt({username: argv.user, password: argv.pass}); 

trakt.on('error', function(err) {
	console.log("Trakt error: " + err.message)
})

trakt.request(argv.action, argv.method, argv, function(err, result) {
	result = JSON.stringify(result, null, 4)
	if (err) {
		console.log(err);
		if (result) {
			console.log(result);
		}
	} else {
		console.log(result);
	}
})

