#!/usr/bin/env node
"use strict";

const util = require('util');
const fs = require('fs-extra');
const path = require('path');
const got = require('got');
const tools = require('./lib/tools');

const API_URL = 'https://jsapi.apiary.io/apis/trakt.json';

const API_GROUPS = [
//	'Calendars',
	'Search',
	'Comments',
//	'Users',
];

var api = {};

var inspect = tools.inspect;
var l = function(str) {
	arguments[0] = arguments[0] || '';
	console.log(util.format.apply(null, arguments));
};

// use file as source if provided as argument
if (!process.argv[2]) {
	fetchApi()
		.then((json) => {
			fs.outputJsonSync('trakt-api-raw.json', json);
			return json;
		})
		.then(parseApi)
		.catch((err) => {
			console.error(err.stack);
		});
} else {
	var json = fs.readJsonSync(process.argv[2]);
	parseApi(json);
}

/**
 * Fetch Trakt API specs
 */
function fetchApi() {
	return got(API_URL, {
		json: true,
	}).then((res) => res.body);
}

/**
 * Parse Trakt API from specs
 */
function parseApi(json) {
	l('API name: %s', json.name);
	l('  updated: %s', json.lastUpdated);
	l();

	// filter out disabled groups
	l('Available groups:')
	var groups = json.resourceGroups.filter((group) => {
		var enabled = API_GROUPS.indexOf(group.name) != -1;
		l('  Group: %s %s', group.name, enabled ? '' : '(skipped)');
		return enabled;
	});

	l();

	l('API Groups:');
	groups.forEach((group) => {
		l(' == %s', group.name);
		group.resources.forEach(parseUris);
	});

	fs.outputJsonSync(path.join(__dirname, 'lib/api.generated.json'), api);
}

function parseUris(res) {
	var parts = parseUri(res.uriTemplate);

	l('    - %s: %s -> %s', res.name, parts.uri.join('/'), parts.base.join('/'));

	var req = [];
	if (req.parameters) {
		req = res.parameters.filter((p) => p.required);
	}

	var req_params = req
		.filter((p) => parts.params.indexOf(p.key) != -1)
		.map((p) => p.key);

	var req_query = req
		.filter((p) => parts.query.indexOf(p.key) != -1)
		.map((p) => p.key);

	var base = parts.base;
	var method = {
		uri: parts.uri.join('/'),
		params: parts.params,
		query: parts.query,
		required: {
			params: req_params,
			query: req_params,
		},
	};

	['GET', 'POST', 'PUT', 'DELETE'].forEach((verb) => {
		var action = res.actions.find((a) => a.method == verb);
		if (!action)
			return;

		var name = getMethodName(base.join('/'), verb);
		api[name] = tools.extend(method, {
			auth: isAuthRequired(action),
		});
	});
}

/**
 * Check if action requires authentication
 * 
 * Only way to check it is to parse action descriptions.
 */
function isAuthRequired(action) {
	if (/OAuth\s+Required/i.test(action.description)) {
		return true;
	}
	if (/OAuth\s+Optional/i.test(action.description)) {
		return 'optional';
	}
	return false;
}

/**
 * Get action method name
 * 
 * GET: <base>
 * POST: <base>/add
 * PUT: <base>/update
 * DELETE: <base>/remove
 */
function getMethodName(base, verb) {
	switch (verb) {
		case 'GET': return base;
		case 'POST': return base + '/add';
		case 'PUT': return base + '/update';
		case 'DELETE': return base + '/remove';
	}
	throw new Error('Unknown verb \'' + verb + '\' for \'' + base + '\'');
}

/**
 * Parse uri, params and queries from uriTemplate
 */
function parseUri(uri) {
	var parts = uri.split('/').filter((p) => p.length);

	const re_param = /^\{(.*)\}$/;
	const re_query = /(.*)\{\?(.*)\}/;

	var base = [];
	var uri = [];
	var params = [];
	var query = [];

	parts.forEach((p) => {
		if (re_param.test(p)) {
			params.push(RegExp.$1);
			uri.push(p);
		} else if (re_query.test(p)) {
			base.push(RegExp.$1);
			uri.push(RegExp.$1);
			query = query.concat(RegExp.$2.split(','));
		} else {
			base.push(p);
			uri.push(p);
		}
	})
	return { uri, base, params, query };
}
