"use strict";

const util = require('util');
const qs = require('querystring');
const got = require('got');
const debug = require('debug')('trakt');
const tools = require('./tools');

const API = require('./api');
const Const = require('./const');

function Trakt(options) {
	if (!(this instanceof Trakt))
		return new Trakt(options);

	this.options = util._extend({
		url: Const.BASE_URL,
		redirectUri: Const.REDIRECT_URI,
	}, options || {});

	this._auth = {};

	// client_id and client_secret are required
	if (!this.options.client_id || !this.options.client_secret)
		throw new Error('Missing client_id and/or client_secret');

	// initialize api methods
	this._initAPI();
}
module.exports = Trakt;

Trakt.prototype._initAPI = function() {
	debug('init api methods');
	for (let url in API) {
		debug('add method: %s', url);
		let parts = url.split('/');
		let name = parts.pop();

		let obj = this;
		for (let p of parts) {
			if (!obj[p]) obj[p] = {};
			obj = obj[p];
		}

		obj[name] = this.call.bind(this, url, API[url]);
	}
};

Trakt.prototype._makeUrl = function(url, method, params) {
	var url = this.options.url + '/' + url;
	var uri = [];

	if (!method.parts) return url;

	for (let part of method.parts) {
		if (part[0] != ':') {
			uri.push[part];
		} else {
			let p = part.slice(1);
			let value = params[p];
			if (value) {
				uri.push(value);
			} else if (method.parts_required && (p in method.parts_required)) {
				throw new Error('Missing required uri part: ' + p);
			}
		}
	}
	url = url + '/' + uri.join('/');
	debug('make url: %s', url);
	return url;
};

Trakt.prototype._makeBody = function(method, params) {
	// TODO: Make body from params, handle errors
	throw new Error('NOT IMPLEMENTED!');
};

Trakt.prototype._makePager = function(obj, headers, req, method) {
	if (typeof obj !== 'object' || !method.pagination)
		return obj;

	debug('make pager: %s', req.url);
	debug(' - headers: %o', headers);

	obj.pages = {
		current: parseInt(headers['x-pagination-page']),
		limit: parseInt(headers['x-pagination-limit']),
		pageCount: parseInt(headers['x-pagination-page-count']),
		itemCount: parseInt(headers['x-pagination-item-count']),
	};
	obj.pages.next = () => {
		req.query.page = obj.pages.current + 1;
		debug('next page: %d', req.query.page);
		return this._makeCall(req, method);
	};
	obj.pages.previous = () => {
		req.query.page = obj.pages.current - 1;
		debug('previous page: %d', req.query.page);
		return this._makeCall(req, method);
	};
	obj.pages.refresh = () => {
		debug('refresh: %d', req.query.page);
		return this._makeCall(req, method);
	};

	return obj;
};

Trakt.prototype._makeCall = function(req, method) {
	debug('make call: %o', req);
	return got(req.url, req).then((res) => {
		debug('response: %s - %d %s', req.url, res.statusCode, res.statusMessage);
		var obj = JSON.parse(res.body);
		return this._makePager(obj, res.headers, req, method);
	});
};

Trakt.prototype.call = function(url, method, params) {
	debug('call: %s', url);

	if (method.auth === true && !this._auth.access_token)
		throw new Error('Method requires authentication');

	params = params || {};

	let req = {
		method: method.verb,
		url: this._makeUrl(url, method, params),
		headers: {
			'Content-Type': Const.CONTENT_TYPE,
			'trakt-api-version': Const.TRAKT_API_VERSION,
			'trakt-api-key': this.options.client_id,
		},
		query: {},
	};

	if (method.auth) {
		req.headers['Authentication'] = 'Bearer ' + this._auth.access_token;
	}
	if (method.qs) {
		req.query = Object.assign(req.query, tools.objPick(params, method.qs));
	}
	if (method.pagination) {
		req.query = Object.assign(req.query, tools.objPick(params, ['page', 'limit']));
	}
	if (method.body) {
		req.body = JSON.stringify(tools.objPick(params, method.body));
	}
	return this._makeCall(req, method);
};
