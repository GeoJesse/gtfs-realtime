const eol = require('os').EOL;

function toCsv(jsonArray) {
	
	if (jsonArray.length > 0) {
		var csvStr = '';
		
		// get field names
		var fields = Object.keys(jsonArray[0]);
		csvStr += fields.join(',') + eol;
		
		// get values
		for (var i = 0; i < jsonArray.length; i++) {
			var row = jsonArray[i],
				values = Object.keys(row).map(function(k) { return row[k]; });
			csvStr += values.join(',') + eol;
		}
		
		return csvStr;
	}
	else
		return '';
}

module.exports = {
	
	JsonToCsv: function(jsonArray) {
		return toCsv(jsonArray);
	}
	
}