var util = require('util');
var EventEmitter = require('events').EventEmitter;
var http = require('http')
var querystring = require('querystring')
var crypto = require('crypto')

var api_config = require('../config.js')
var base_url = 'api.trakt.tv'

var Trakt = module.exports = function(options) {
	if (!api_config.api_key) throw new Error('No API key specified')

	this.config = { 
		timeout : api_config.timeout,
		api_key : api_config.api_key,
		username : options.user,
		password : options.password && crypto.createHash('sha1').update(options.password).digest('hex')
	}

	this.on('ready', onReady);
	this.on('error', onError)
	this.on('account ready', function(data) {
		console.log(data);
	})
};
util.inherits(Trakt, EventEmitter)


/* API calls without Authentication */

Trakt.prototype.search = function(type, query) {
	var self = this
	query = query instanceof Array ? query : [query]
	query.forEach(function(query, i) {
		var options = {
			cmd: 'search/' + type,
			value: query,
			success: function(data) {
				self.emit('ready', {op: 'search', type: type, query: query, results: JSON.parse(data)})
			},
			error: function(err) { self.emit('error', op, err)	}
		}
		getRequest(self, options)
	})
}

Trakt.prototype.activity = function(opts) {
	var self = this;
	if (!opts.cmd) return this.emit('error', 'activity', new Error('Missing command argument'))
	var options = {
		cmd: 'activity/' + opts.cmd,
		success: function(data) {
			self.emit('ready', {op: 'activity', cmd: opts.cmd, results: JSON.parse(data)})
		},
		error: function(err) { self.emit('error', 'activity', err) }
	}
	if (opts.type) {
		options.value = opts.type
		if (opts.action) {
			options.value += '/' + opts.action
			if (opts.start) {
				options.value += '/' + opts.start
				if (opts.end) {
					options.value += '/' + opts.end
				}
			}
		}
	}
	getRequest(self, options)
}

Trakt.prototype.server_time = function() {
	var self = this;
	var options = {
		cmd: 'server/time',
		success: function(data) {
			self.emit('ready', {op: 'server_time', results: JSON.parse(data)})
		},
		error: function(err) { self.emit('error', 'activity', err) }
	}
	getRequest(self, options)
}

Trakt.prototype.genres = function(opts) {
	var self = this;
	var options = {
		cmd: 'genres/' + opts.cmd,
		success: function(data) {
			self.emit('ready', {op: 'genres', cmd: opts.cmd, results: JSON.parse(data)})
		},
		error: function(err) { self.emit('error', 'genres', err) }
	}
	getRequest(self, options)
}

/* API calls with Authentication */

Trakt.prototype.account = function(cmd) {
	var self = this
	if (!this.config.username || !this.config.password) return this.emit('error', new Error('No username or password specified'))

	var options = {
		cmd: "account/" + cmd,
		success: function(data) { self.emit('account ready', JSON.parse(data)) },
		error: function(err) { self.emit('error', 'account', err) }
	}
	postRequest(self, options)
}





/* Helper functions */

var getRequest = function(self, options) {
	if (!options.cmd) return options.error(new Error('No command specified'))
	
	options.format = options.format ? options.format : 'json'

	var url = 'http://' + base_url + '/' + options.cmd + '.' + options.format + '/' + self.config.api_key + '/' + querystring.escape(options.value).replace('%20', '+')
	var result = '';
	var req = http.get(url, function(res) {
		res.setEncoding('utf8')
		res.on('data', function(data) {
			result += data
		})
		res.on('end', function() {
			options.success(result)
		})
		res.on('error', options.error)
	})
	req.setTimeout(self.config.timeout);
}

var postRequest = function(self, options) {
	if (!options.cmd) return options.error(new Error('No command specified'))
	options.format = options.format ? options.format : 'json'

	var data = options.data || {}
	data.username = self.config.username
	data.password = self.config.password
	data = JSON.stringify(data);

	var result = ''
	var opt = {
		host: base_url,
		path: '/' + options.cmd + '/' + self.config.api_key,
		method: 'POST',
		headers : {
			"Content-Length" : data.length
		}
	}

	var req = http.request(opt, function(res) {
		res.setEncoding('utf8')
		res.on('data', function(data) {
			result += data;
		})
		res.on('end', function() {
			if (res.statusCode == 200) {
				options.success(result)
			} else {
				var error = JSON.parse(result)
				options.error(new Error(error.error))
			}
		})
		res.on('error', options.error)
	}).on('error', options.error)

	req.end(data)
}





/* EVENT HANDLERS      */
/* Mostly for debuging */


var onError = function(op, e) {
	console.error(op + " Error: " + e.message)
	console.error(e.stack)
}

var onReady = function(result) {
	console.log("Ready: ", result.op);
}
