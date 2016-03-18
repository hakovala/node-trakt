"use strict";

const util = require('util');
const qs = require('querystring');
const got = require('got');
const debug = require('debug')('trakt');
const tools = require('./tools');

const API = require('./api.generated.json');
const Const = require('./const');
const Auth = require('./auth');

function Trakt(options) {
	if (!(this instanceof Trakt))
		return new Trakt(options);

	this.options = tools.extend({
		url: Const.BASE_URL,
	}, options || {});


	this.auth = new Auth(this.options);

	// initialize api methods
	this._initAPI();
}
module.exports = Trakt;

Trakt.prototype._initAPI = function() {
	debug('init api methods');

	var uri_list = [];
	for (let uri in API) {
		uri_list.push(uri);
	}
	uri_list = uri_list.sort();

	for (let uri of uri_list) {
		debug('add method: %s', uri);
		let parts = uri.split('/');
		let name = parts.pop();

		let obj = this;
		for (let p of parts) {
			if (!obj[p]) obj[p] = {};
			obj = obj[p];
		}

		obj[name] = this.call.bind(this, API[uri]);
	}
};

Trakt.prototype._makeUrl = function(method, params) {
	var url = [this.options.url];

	const re_param = /^\{(.*)\}$/;

	for (let part of method.uri) {
		if (re_param.test(part)) {
			let name = RegExp.$1;
			let value = params[name];
			if (value) {
				url.push(value);
			} else if (method.required.params.indexOf(name) != -1) {
				throw new Error('Missing required uri part: ' + name);
			}
		} else {
			url.push(part);
		}
	}

	url = url.join('/');
	debug('make url: %s', url);
	return url;
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
		return this._makePager(res.body, res.headers, req, method);
	});
};

Trakt.prototype.call = function(method, params, data) {
	debug('call: %s', method.uri);

	if (method.auth === true && !this.auth.tokens.access_token)
		throw new Error('Method requires authentication');

	params = params || {};

	let req = {
		method: method.verb,
		url: this._makeUrl(method, params),
		headers: {
			'Content-Type': Const.CONTENT_TYPE,
			'trakt-api-version': Const.TRAKT_API_VERSION,
			'trakt-api-key': this.options.client_id,
		},
		query: {},
		json: true,
	};

	// add authentication if needed by method
	if (method.auth) {
		req.headers['Authorization'] = 'Bearer ' + this.auth.tokens.access_token;
	}

	req.query = Object.assign(req.query, tools.objPick(params, method.query));
	// add pagination params if supported
	if (method.pagination) {
		req.query = Object.assign(req.query, tools.objPick(params, ['page', 'limit']));
	}

	// check required query params
	for (let key of method.required.query) {
		if (!req.query.hasOwnProperty(key)) {
			throw new Error('Missing required query parameter: ' + key);
		}
	}

	// for POST and PUT, put data to request body as json
	if (data) {
		req.body = JSON.stringify(data);
	}

	return this._makeCall(req, method);
};
