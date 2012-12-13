node-trakt
=====

NodeJS client module to use Trakt.tv API.

> This is in VERY early design/development version. Module interface and functionality WILL change.

### Install
 Clone github repository to *node_modules* folder.
 Add your Trakt API Key to *config.js*.

### Usage example
	var Trakt = require('trakt');
	var trakt = new Trakt({username: 'username', password: 'password'}); 

	var options = { query: 'american dad' }

	// Search 'american dad' from Trakt
	trakt.request('search', 'shows', options, function(err, result) {
		if (err) {
			console.log(err);
			if (result) {
				console.log(result);
			}
		} else {
			console.log(result);
		}
	})

	// Test account authentication
	trakt.request('account', 'test', {}, function(err, result) {
		if (err) {
			console.log(err);
			if (result) {
				console.log(result);
			}
		} else {
			console.log(result);
		}
	})

### CLI Usage
	trakt -a search -m shows --query 'american dad'
	trakt -a account -m test -u username -p password

### TODO List
 - **Base**
  - Add events to some situations
  - Split and refactor request function
  - Make helper functions for api calls
 - **Api Actions**
  - Add missing parameters
  - Add missing dev parameters
  - Handle show title as it can be many things
  - Check parameter if it needs authentication (needed only for GET)
  - Allow objects and lists as parameters
  - Check parameter value validity
  - Check for supplementary parameters (how?)
  - Check for optional parameters that are marked as mandatory in the api
 - **Cli**
  - Redesign cli arguments
  - Add usefull usage and help printout



