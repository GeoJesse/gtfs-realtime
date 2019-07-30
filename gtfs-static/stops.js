const http = require('http');
const config = require('../config');
const stopsUrl = config.api + "/getstops?format=json&key=" + config.apiKey;
const directionsUrl = config.api + "/getdirections?format=json&key=" + config.apiKey;

function getDirection(route, callback) {
	
	http.get(directionsUrl + "&rt=" + route.route_id, function(response) {
		
		var rawData = '';
		
		response.on('data', function(chunk) {
			rawData += chunk;
		});
		
		response.on('end', function () {
			var dir = JSON.parse(rawData)["bustime-response"]["directions"][0]["dir"];
			getStops(route, dir, callback);
		});
		
	}).on("error", function(err) {
		callback(err, null, null);
	});
	
}

function getStops(route, direction, callback) {
	
	http.get(stopsUrl + "&rt=" + route.route_id + "&dir=" + direction, function(response) {
		
		var rawData = '';
		
		response.on('data', function(chunk) {
			rawData += chunk;
		});
		
		response.on('end', function () {
			callback(null, toGTFS(JSON.parse(rawData)["bustime-response"]["stops"]), JSON.parse(rawData)["bustime-response"]["stops"]);
		});
		
	}).on("error", function(err) {
		callback(err, null, null);
	});
	
}

function toGTFS(data) {
	var gtfs = [];	
	for (var i = 0; i < data.length; i++) {
		var s = data[i];
		gtfs.push({
				stop_id: s.stpid,
				stop_code: null,
				stop_name: s.stpm,
				stop_desc: null,
				stop_lat: s.lat,
				stop_lon: s.lon,
				zone_id: null,
				stop_url: null,
				location_type: null,
				parent_station: null,
				stop_timezone: "US/Eastern",
				wheelchair_boarding: 1
		});
	}
	return gtfs;
}

module.exports = {
	get: function(route, callback) {		
		getDirection(route, callback);
	}
}