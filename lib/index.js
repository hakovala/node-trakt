var util = require('util');
var EventEmitter = require('events').EventEmitter;
var http = require('http')

var api_config = require('./config.js')

var Trakt = module.exports = function() {
	console.log("Creating new Trakt object");
	console.log(api_config);
};
util.inherits(Trakt, EventEmitter)


Trakt.prototype.test = function() {
	console.log("Test function");
};


