const http = require('http');
const config = require('../config');

function getShapes(trips) {
	return toGTFS(trips);
}

function toGTFS(data) {
	var gtfs = [];	
	for (var i = 0; i < data.length; i++) {
		var pattern = data[i],
			shpid = pattern.pid + "_shp",
			pts = pattern.pt;
		for (var j = 0; j < pts.length; j++) {
			var pt = pts[j];
			if (pt.stpid) {
				gtfs.push({
					shape_id: shpid,
					shape_pt_lat: pt.lat,
					shape_pt_lon: pt.lon,
					shape_pt_sequence: pt.seq,
					shape_dist_traveled: null
				});
			}
		}
	}
	return gtfs;
}

module.exports = {
	get: function(trips) {		
		return getShapes(trips);
	}
}

