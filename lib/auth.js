"use strict";

const debug = require('debug')('trakt:auth');

const url = require('url');
const qs = require('querystring');
const crypto = require('crypto');
const got = require('got');

const Const = require('./const');

// exchange_code: Verify code/PIN
// get_codes: OAuth device method
// refresh_token: Refresh token
// export_token
// import_token

function Auth(options) {
	if (!(this instanceof Auth))
		return new Auth(options);

	this.options = Object.assign({
		url: Const.BASE_URL,
		redirectUri: Const.REDIRECT_URI,
	}, options || {});

	this.tokens = {};
}
module.exports = Auth;

Auth.prototype._request = function(uri, body) {
	var req = {
		method: 'POST',
		url: this.options.url +'/' + uri,
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
		json: true,
	};
	return got(req.url, req)
		.then((res) => res.body)
		.catch((err) => {
			if (err.response && err.response.statusCode == 401) {
				throw new Error(err.response.headers['www-authenticate']);
			} else {
				throw err;
			}
		})
};

Auth.prototype.authUrl = function() {
	this._auth_state = crypto.randomBytes(6).toString('hex');

	var query = qs.stringify({
		response_type: 'code',
		client_id: this.options.client_id,
		redirect_uri: this.options.redirectUri,
		state: this._authState,
	}, null, null, { encodeURIComponent: qs.unescape });

	return 'https://trakt.tv/oauth/authorize?' + query;
};

Auth.prototype.getCodes = function() {
	return this._request('oauth/device/code', { client_id: this.options.client_id });
};

Auth.prototype.pollAccess = function(opt) {
	if (typeof opt !== 'object')
		throw new Error('Missing options object argument');

	var startTime = Date.now();

	return new Promise((resolve, reject) => {
		var _interval = setInterval(() => {
			if (startTime + (opt.expires * 1000) <= Date.now()) {
				clearInterval(_interval);
				reject(new Error('Authentication expired'));
			} else {
				this._request('oauth/device/token', {
					code: opt.device_code,
					client_id: this.options.client_id,
					client_secret: this.options.client_secret,
				}).then((body) => {
					this.tokens = Object.assign(this.tokens || {}, body, {
							expires_in: Date.now() + (body.expires_in * 1000),
						});

					clearInterval(_interval);
					resolve(this.tokens);
				}).catch((err) => {
					if (err.response && err.response.statusCode === 400) {
						// ignore
					} else {
						clearInterval(_interval);
						reject(err);
					}
				});
			}

		}, (opt.interval * 1000));
	})	
};

Auth.prototype.refresh = function() {
	return this._exchange({
		refresh_token: this.tokens.refresh_token,
		grant_type: 'refresh_token',
	});
};

Auth.prototype.exchangeCode = function(code, state) {
	if (state && state != this._auth_state)
		throw new Error('Invalid CSRF state');
	
	return this._exchange({
		code: code,
		grant_type: 'authorization_code',
	});
};

Auth.prototype._exchange = function(opt) {
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
	this.tokens = Object.assign(this.tokens || {}, tokens);

	return new Promise((resolve, reject) => {
		if (token.expires_in < Date.now()) {
			this.refresh()
				.then(() => resolve(this.export()))
				.catch(reject);
		} else {
			resolve(this.export());
		}
	})
};

Auth.prototype.export = function() {
	return Object.assign({}, this.tokens);
};
