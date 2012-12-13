var should = require('should')
var fs = require('fs')
var Trakt = require('../index.js');


var config = JSON.parse(fs.readFileSync('test/test_config.json', 'utf8'))

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

describe('Trakt requests', function() {
	var trakt = new Trakt()
	describe('Get request', function() {
		it('should give error, missing param', function() {
			trakt.request('search', 'shows', {}, function(err, res) {
				should.exist(err)
			})
		})
		it('should be ok', function() {
			trakt.request('search', 'shows', {query: 'hello'}, function(err, res) {
				should.not.exist(err)
				should.exist(res)
			})
		})
	})
	describe('Post request', function() {
		it('need user and password, specified in test_config.json', function() {
			should.exist(config)
			config.should.have.property('user')
			config.user.should.not.equal('TEST USER')
		})
		it('should give error, no auth', function() {
			trakt.request('account', 'test', {}, function(err, res) {
				should.exist(err)
			})
		})
		it('should be ok', function() {
			trakt.setUser(config.user, config.pass)
			trakt.request('account', 'test', {}, function(err, res) {
				should.not.exist(err)
				should.exist(res)
				res.should.have.property('status')
				res.should.have.property('message')
				res.status.should.equal('success')
			})
		})
	})
})