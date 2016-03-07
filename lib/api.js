"use strict";

module.exports = {
	//
	// Calendars / my
	//
	'calendars/my/shows': {
		opts: { auth: true, pagination: false },
		method: 'GET',
		parts: [':start_date', ':days'],
	},
	'calendars/my/shows/new': {
		opts: { auth: true, pagination: false },
		method: 'GET',
		parts: [':start_date', ':days'],
	},
	'calendars/my/shows/premieres': {
		opts: { auth: true, pagination: false },
		method: 'GET',
		parts: [':start_date', ':days'],
	},
	'calendars/my/movies': {
		opts: { auth: true, pagination: false },
		method: 'GET',
		parts: [':start_date', ':days'],
	},
	//
	// Calendars / all
	//
	'calendars/all/shows': {
		opts: { auth: false, pagination: false },
		method: 'GET',
		parts: [':start_date', ':days'],
	},
	'calendars/all/shows/new': {
		opts: { auth: false, pagination: false },
		method: 'GET',
		parts: [':start_date', ':days'],
	},
	'calendars/all/shows/premieres': {
		opts: { auth: false, pagination: false },
		method: 'GET',
		parts: [':start_date', ':days'],
	},
	'calendars/all/movies': {
		opts: { auth: false, pagination: false },
		method: 'GET',
		parts: [':start_date', ':days'],
	},


	//
	// Search
	//
	'search': {
		opts: { auth: false, pagination: true },
		method: 'GET',
		qs: [ 'type', 'query', 'id', 'id_type' ],
	},
};
