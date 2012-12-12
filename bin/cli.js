#!/usr/bin/env node
var Trakt = require('../lib/index.js');
var argv = require('optimist')
	.usage('Usage: $0 search <show name>')
	.alias('u', 'user')
	.alias('p', 'pass')
	.alias('t', 'type')
	.argv;

var trakt = new Trakt({user: argv.user, password: argv.pass}); 

trakt.on('error', function(err) {
	console.log("Trakt error: " + err.message)
})


/*
 * TODO ::: THIS IS BROKEN
 */
trakt.on('ready', function(result) {
	switch (result.op) {
		case 'search':
			if (result.type == 'shows') {
				result.results.forEach(function(show) {
					console.log(show.title);
				})
			} else if (result.type == 'episodes') {
				result.results.forEach(function(res) {
					console.log(res.show.title);
					console.log(res.episode.title)
				})
			} else if (result.type == 'movies') {
				result.results.forEach(function(movie) {
					console.log(movie.title);
				})
			}
		break;
	case 'activity':
		console.log(result.results);
		break;
	case 'server_time':
		console.log(result.results);
		break;
	case 'genres':
		console.log(result.results);
		break;
	default:
		console.warn("Unknown result: " + result.op);
		break;
	}
})

if (argv.test) {
	argv._.splice(1, 99,
		"continuum",
		"american dad",
		"fringe",
		"family guy",
		"top gear",
		"top chef",
		"whose line",
		"horizon"
	)
}


// Check cli arguments
switch (argv._[0]) {
	case 'search':
		var type = argv.type ? argv.type : 'shows';
		trakt.search(type, argv._.slice(1));
		break;
	case 'account':
		trakt.account('test')
		trakt.account('settings')
		break;
	case 'activity':
		trakt.activity({cmd: 'community'})
		trakt.activity({cmd: 'episodes'})
		trakt.activity({cmd: 'friends'})
		trakt.activity({cmd: 'movies'})
		trakt.activity({cmd: 'seasons'})
		trakt.activity({cmd: 'shows'})
		trakt.activity({cmd: 'user'})
		break;
	case 'server_time':
		trakt.server_time();
		break;
	case 'genres':
		trakt.genres({cmd: 'movies'})
		trakt.genres({cmd: 'shows'})
		break;
	default: 
		console.log("Unknown command")
		break;
}



