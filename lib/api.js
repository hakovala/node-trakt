"use strict";

/* API definition format:

'<method base uri>': {
	verb: '<verb>', // [GET, POST, PUT, DELETE]
	auth: true, // authentication needed (defaults to false), can be 'optional'
	pagination: true, // method supports pagination (defaults to false)
	parts: [], // additional uri parts
	parts_req: [], // required parts
	qs: [], // supported query parameters
};

*/

module.exports = {
	//
	// Calendars / my
	//
	'calendars/my/shows': {
		verb: 'GET',
		auth: true,
		parts: [':start_date', ':days'],
	},
	'calendars/my/shows/new': {
		verb: 'GET',
		auth: true,
		parts: [':start_date', ':days'],
	},
	'calendars/my/shows/premieres': {
		verb: 'GET',
		auth: true,
		parts: [':start_date', ':days'],
	},
	'calendars/my/movies': {
		verb: 'GET',
		auth: true,
		parts: [':start_date', ':days'],
	},
	//
	// Calendars / all
	//
	'calendars/all/shows': {
		verb: 'GET',
		parts: [':start_date', ':days'],
	},
	'calendars/all/shows/new': {
		verb: 'GET',
		parts: [':start_date', ':days'],
	},
	'calendars/all/shows/premieres': {
		verb: 'GET',
		parts: [':start_date', ':days'],
	},
	'calendars/all/movies': {
		verb: 'GET',
		parts: [':start_date', ':days'],
	},


	//
	// Search
	//
	'search': {
		verb: 'GET',
		pagination: true,
		qs: [ 'type', 'query', 'id', 'id_type' ],
	},
};
