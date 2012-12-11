#!/usr/bin/env node
var Trakt = require('../lib/index.js');
var argv = require('optimist')
	.usage('Usage: $0 search <show name>')
	.argv;

var queries = argv._.slice(1);

// Check cli arguments
switch (argv._[0]) {
	case 'search':
		console.log("Searching: ", queries.join(', '))
		break;
	default: 
		console.log("Unknown command")
		break;
}



var trakt = new Trakt(); 



console.log(argv);


