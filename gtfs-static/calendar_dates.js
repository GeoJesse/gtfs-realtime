const config = require('../config');

var calendar_dates = config.calendar_dates;

module.exports = {
	
	get: function() {
		return calendar_dates;
	}
	
}