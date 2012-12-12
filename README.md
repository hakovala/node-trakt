node-trakt
=====

NodeJS client to use Trakt.tv API.

> This is in VERY early design/development version. Module interface and functionality will change.

### Usage example
	
	var Trakt = require('trakt')
	var trakt = new Trakt({username: 'username', password: 'password'})

	trakt.on('ready', function(data) {
		// data object contains actions results
		data.results.forEach(function(show, i) {
			console.log("%d: %s", i, show.title)
		});
	});

	trakt.search('shows', 'house') // search single show
	trakt.search('shows', ['lost', 'continuum']) // search multiple shows

### CLI Usage
	trakt search lost "american dad"
