"use strict";

const l = require('lollog')('trakt:auth');

const url = require('url');
const qs = require('querystring');
const crypto = require('crypto');
const got = require('got');

const tools = require('./tools');
const Const = require('./const');

function Auth(options) {
	if (!(this instanceof Auth))
		return new Auth(options);

	this.options = tools.extend({
		url: Const.BASE_URL,
		redirectUri: Const.REDIRECT_URI,
	}, options || {});

	l.d('options: %o', this.options);

	// client_id and client_secret are required
	if (!this.options.client_id || !this.options.client_secret)
		throw new Error('Missing client_id and/or client_secret');

	this.tokens = {};
}
module.exports = Auth;

Auth.prototype._request = function(uri, body) {
	var req = {
		method: 'POST',
		url: this.options.url +'/oauth/' + uri,
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
		json: true,
	};
	return got(req.url, req)
		.catch((err) => {
			if (err.response && err.response.statusCode == 401) {
				throw new Error(err.response.headers['www-authenticate']);
			} else {
				throw err;
			}
		})
};

Auth.prototype.deviceCodes = function() {
	l.d('generating device codes');
	return this._request('device/code', {
		client_id: this.options.client_id,
	}).then((res) => res.body);
};

Auth.prototype._requestAccess = function(code) {
	l.d('request access token');
	return this._request('device/token', {
		code: code,
		client_id: this.options.client_id,
		client_secret: this.options.client_secret,
	});
};

Auth.prototype.pollAccess = function(poll) {
	if (typeof poll !== 'object')
		throw new Error('Missing poll object argument');

	l.d('polling access: %o', poll);

	var startTime = Date.now();

	return new Promise((resolve, reject) => {
		var _int = setInterval(() => {
			if (startTime + (poll.expires_in * 1000) <= Date.now()) {
				clearInterval(_int);
				return reject(new Error('Authentication expired'));
			}
			l.v('poll access');

			this._requestAccess(poll.device_code)
				.then((res) => {
					l.d('received access tokens');
					let now = Date.now();
					this.tokens = Object.assign(res.body, {
						created_at: now,
						expires_in: now + (res.body.expires_in * 1000),
					});

					clearInterval(_int);
					return resolve(this.tokens);
				})
				.catch((err) => {
					if (err.response && err.response.statusCode === 400) {
						// still waiting...
					} else {
						l.e('error: %d', err.response.statusCode);
						clearInterval(_int);
						return reject(err);
					}
				});
		}, poll.interval * 1000);
	});
};

Auth.prototype.authUrl = function() {
	l.d('generating authentication url');
	this._auth_state = crypto.randomBytes(6).toString('hex');

	var obj = {
		response_type: 'code',
		client_id: this.options.client_id,
		redirect_uri: this.options.redirectUri,
		state: this._authState,
	};

	var q = [];
	for (let k in obj) {
		q[k] = obj[k];
	}
	q = q.join('&');

	return 'https://trakt.tv/oauth/authorize?' + q;
};


Auth.prototype.refresh = function() {
	l.d('refresh tokens');
	return this._exchange({
		refresh_token: this.tokens.refresh_token,
		grant_type: 'refresh_token',
	});
};

Auth.prototype.exchangeCode = function(code, state) {
	if (state && state != this._auth_state)
		throw new Error('Invalid CSRF state');
	
	l.d('exhange code');

	return this._exchange({
		code: code,
		grant_type: 'authorization_code',
	});
};

Auth.prototype._exchange = function(opt) {
	l.d('exchange');
	opt = Object.assign(opt, {
		client_id: this.options.client_id,
		client_secret: this.options.client_secret,
		redirect_uri: this.options.redirect_uri,
	});
	return this._request('oauth/token', opt)
		.then((res) => {
			return Object.assign(this.tokens, body, {
				created_at: body.created_at * 1000,
				expires_in: (body.created_at + body.expires_in) * 1000,
			});
		});
};

Auth.prototype.import = function(tokens) {
	l.d('import tokens: %o', tokens);
	this.tokens = Object.assign(this.tokens || {}, tokens);

	return new Promise((resolve, reject) => {
		if (tokens.expires_in < Date.now()) {
			this.refresh()
				.then(() => resolve(this.export()))
				.catch(reject);
		} else {
			resolve(this.export());
		}
	})
};

Auth.prototype.export = function() {
	l.d('export tokens: %o', this.tokens);
	return Object.assign({}, this.tokens);
};
