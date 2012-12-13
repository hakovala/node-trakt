var should = require('should')
var fs = require('fs')
var nock = require('nock')
var Trakt = require('../index.js');


var config = {
	user: 'username',
	pass: 'password',
	api_key: 'api_key'
}

var url = 'http://api.trakt.tv'

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
	var trakt = new Trakt({api_key: config.api_key})
	describe('Get request', function() {
		it('should give error, missing param', function() {
			var get_req = nock(url)
				.get('/search/shows.json/' + config.api_key + '/')
			trakt.request('search', 'shows', {}, function(err, res) {
				should.exist(err, 'expecting error')
				err.message.should.equal('Missing parameters')
				should.not.exist(res, "expecting undefined result")
			})
		})
		it('should be ok', function() {
			var get_req = nock(url)
				.get('/search/shows.json/' + config.api_key + '/hello')
				.reply(200, '{ "status": "success" }')
			trakt.request('search', 'shows', {query: 'hello'}, function(err, res) {
				should.not.exist(err)
				should.exist(res)
			})
		})
	})
	describe('Post request', function() {
		it('should give error, no auth', function() {
			trakt.request('account', 'test', {}, function(err, res) {
				should.exist(err)
				err.message.should.equal('POST messages require username and password')
			})
		})
		it('should give authentication error', function() {
			var post = nock(url)
				.post('/account/test/' + config.api_key, {username: 'wrong', password: 'wrong'})
				.reply(401, {status: 'failure', error: 'failed authentication'})
			trakt.on('error', function(err) {})
			trakt.setUser('wrong', 'wrong', true)
			trakt.request('account', 'test', {}, function(err, res) {
				should.exist(err)
				should.exist(res)
				res.should.have.property('status')
				res.should.have.property('error')
				res.status.should.equal('failure')
			})
		})
		it('should be ok', function() {
			var post = nock(url)
				.post('/account/test/' + config.api_key, {username: 'username', password: 'password'})
				.reply(200, {status: 'success', message: 'all good!'})
			trakt.setUser(config.user, config.pass, true)
			trakt.request('account', 'test', {}, function(err, res) {
				should.not.exist(err)
				should.exist(res)
				res.should.have.property('status')
				res.should.have.property('message')
				res.status.should.equal('success')
				res.message.should.equal('all good!')
			})
		})
	})
})