var test = require('tap').test 
var Trakt = require('..')

test("creating Trakt object", function(t) {
	var trakt = new Trakt()
	t.ok(trakt instanceof Trakt, 'Trakt without options')
	trakt = new Trakt({api_key: 'dummy'})
	t.ok(trakt instanceof Trakt, 'Trakt with api_key')
	trakt = new Trakt({username: 'test', password: 'test', api_key: 'dummy'})
	t.ok(trakt instanceof Trakt, 'Trakt with username, password and api_key')
	trakt = new Trakt({username: 'test', password: 'test', pass_hash: true})
	t.ok(trakt instanceof Trakt, 'password is already hash')
	t.end()
});

test("request testing", function(t) {
	t.end()	
});
