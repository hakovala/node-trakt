"use strict";

const util = require('util');
const qs = require('querystring');
const got = require('got');
const debug = require('debug')('trakt');

const API = require('./lib/api');

const BASE_URL = 'https://api-v2launch.trakt.tv';
const REDIRECT_URI = 'urn:ietf:wg:oauth:2.0:oob';

function objectPick(obj, keys) {
	var res = {};

	if (typeof obj !== 'object')
		return res;

	if (typeof keys === 'string') {
		if (keys in obj)
			res[keys] = obj[keys];
		return res;
	}

	if (!Array.isArray(keys))
		return res;

	for (let key of keys) {
		if (key in obj)
			res[key] = obj[key];
	}
	return res;
}

function Trakt(options) {
	if (!(this instanceof Trakt))
		return new Trakt(options);

	this.options = util._extend({
		url: options.url || BASE_URL,
		redirect_url: REDIRECT_URI,
		debug: false,
	}, options);

	this._auth = {};

	// client_id and client_secret are required
	if (!this.options.client_id || !this.options.client_secret)
		throw new Error('Missing client_id or client_secret');

	// initialize api method calls
	this._initAPI();

	// TODO: Plugin system?
}
module.exports = Trakt;

Trakt.prototype._initAPI = function() {
	for (var url in API) {
		debug('add method: %s', url);
		let parts = url.split('/');
		let name = parts.pop();

		let obj = this;
		for (var i = 0; i < parts.length; i++) {
			if (!obj[parts[i]])
				obj[parts[i]] = {};
			obj = obj[parts[i]];
		}

		obj[name] = this.call.bind(this, url, API[url]);
	}
};

Trakt.prototype._makeUrl = function(url, method, params) {
	var url = this.options.url + '/' + url;
	var uri = [];

	if (!method.parts) return url;

	for (var part of method.parts) {
		if (part[0] != ':') {
			uri.push(part);
		} else {
			let p = part.slice(1);
			let value = params[p];
			if (value) {
				uri.push(value); 
			} else if (method.required_parts && (p in method.required_parts)) {
				throw new Error('Missing required uri part: ' + p);
			}
		}
	}

	return url + '/' + uri.join('/');
};

Trakt.prototype._makeBody = function(method, params) {
	// TODO: Make body from params, handle errors
};

Trakt.prototype._makePager = function(obj, headers, req, method) {
	if (typeof obj !== 'object' || !method.opts.pagination)
		return obj;

	debug('headers: %o', headers);

	obj.pages = {
		current: parseInt(headers['x-pagination-page']),
		limit: parseInt(headers['x-pagination-limit']),
		pageCount: parseInt(headers['x-pagination-page-count']),
		itemCount: parseInt(headers['x-pagination-item-count']),
	};

	obj.pages.nextPage = () => {
		req.query.page = obj.pages.current + 1;
		debug('next page: %d', req.query.page);
		return this._makeCall(req, method);
	};
	obj.pages.prevPage = () => {
		req.query.page = obj.pages.current - 1;
		return this._makeCall(req, method);
	};
	obj.pages.refresh = () => {
		return this._makeCall(req, method);
	};

	return obj;
};

Trakt.prototype._makeCall = function(req, method) {
	debug('call: %o', req);
	return got(req.url, req).then((res) => {
		debug('response: %s - %d %s', req.url, res.statusCode, res.statusMessage);
		var obj = JSON.parse(res.body);
		return this._makePager(obj, res.headers, req, method);
	});
};

Trakt.prototype.call = function(url, method, params) {
	debug('call %s', url);

	if (method.opts.auth === true && !this._auth.access_token)
		throw new Error('Method requires authentication');

	params = params || {};

	let req = {
		method: method.method,
		url: this._makeUrl(url, method, params),
		headers: {
			'Content-Type': 'application/json',
			'trakt-api-version': 2,
			'trakt-api-key': this.options.client_id,
		},
		query: {},
	};

	if (method.opts.auth)
		req.headers['Authorization'] = 'Bearer ' + this._auth.access_token;

	if (method.qs)
		req.query = Object.assign(objectPick(params, method.qs));

	if (method.opts.pagination)
		req.query = Object.assign(req.query, objectPick(params, ['page', 'limit']));

	if (method.body)
		req.body = JSON.stringify(objectPick(params, method.body));

	return this._makeCall(req, method);
};


