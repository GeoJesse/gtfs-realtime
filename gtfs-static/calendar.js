const config = require('../config');

var calendar = config.calendar;

module.exports = {
	
	get: function() {
		return calendar;
	}
	
}