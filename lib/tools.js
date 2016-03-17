"use strict";

const util = require('util');

module.exports = {
	// Inspect object only for debuging
	inspect: function(obj, depth) {
		console.log(util.inspect(obj, { colors: true, depth: depth }));
	},
	objFilter: function(obj, keys) {
		var res = {};

		if (typeof obj !== 'object')
			return res;

		for (let key of keys) {
			let src = obj;
			let dest = res;

			let parts = key.split('.');
			let name = parts.pop();
			for (let p of parts) {
				if (!src[p]) break;
				src = src[p];
				dest = dest[p] || (dest[p] = {});
			}
			dest[name] = src[name];
		}
		return res;
	},
	objPick: function(obj, keys) {
		var res = {};

		if (typeof obj !== 'object') {
			return res;
		}

		if (typeof keys === 'string') {
			keys = [keys];
		}

		for (let key of keys) {
			if (key in obj) {
				res[key] = obj[key];
			}
		}
		return res;
	}
};
