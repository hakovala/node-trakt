var should = require('should')
var Trakt = require('../index.js');

describe('Trakt init', function(){
	it('should be valid Trakt object', function(){
		new Trakt()
			.should.be.an.instanceof(Trakt)
		new Trakt({api_key: 'dummy'})
			.should.be.an.instanceof(Trakt)
		new Trakt({username: 'test', password: 'test', api_key: 'dummy'})
			.should.be.an.instanceof(Trakt)
		new Trakt({username: 'test', password: 'test', pass_hash: true})
			.should.be.an.instanceof(Trakt)
	})
})
