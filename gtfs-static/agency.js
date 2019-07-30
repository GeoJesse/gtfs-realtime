const config = require('../config');

const agency = config.agency; 

module.exports = {
	
	get: function() {
		return [agency];
	}
	
}