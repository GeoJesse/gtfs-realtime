var async = require('async');
const gtfs_agency = require('../gtfs-static/agency');
const gtfs_routes = require('../gtfs-static/routes');
const gtfs_trips = require('../gtfs-static/trips');
const gtfs_stops = require('../gtfs-static/stops');
const gtfs_stop_times = require('../gtfs-static/stop_times');
const gtfs_shapes = require('../gtfs-static/shapes');

function getGtfsStaticFiles(callback) {

	// get agency (static) first
	var gtfs = {
        agency: gtfs_agency.get(),
        routes: gtfs_routes.get(),
        trips: gtfs_trips.get()
	};
	
	// get routes second
	/* gtfs_routes.get(function(err, formatted, unformatted) {
		if (!err){
			gtfs.routes = formatted;					
			// get trips third TODO: explore getting all asynchronously
			getTrips(gtfs.routes, tripsReceived);		
		}
		else
			callback(err, null, null);
	});	 */
	
	/* function tripsReceived(err, formatted, unformatted) {
		if (!err) {
			gtfs.trips = formatted;						
			gtfs.stop_times = gtfs_stop_times.get(unformatted);
			gtfs.shapes = gtfs_shapes.get(unformatted);
			getStops(gtfs.routes, stopsReceived);
		}
		else
			callback(err, null, null);
	} */
	
	function stopsReceived(err, formatted, unformatted) {
		if (!err) {
			gtfs.stops = formatted;
			callback(null, gtfs);
		}
		else
			callback(err, null, null);
	}
	
}

function getTrips(routes, callback) {
	var trips = [],
		rawJson = [];
	async.each(routes, function(route, cb) {
		gtfs_trips.get(route, function(err, formatted, unformatted) {
			trips = trips.concat(formatted);
			rawJson = rawJson.concat(unformatted);
			cb();
		});
	}, function(err) {
		if (err)
			callback(err, null, null);
		else
			callback(null, trips, rawJson);
	});
}

function getStops(routes, callback) {
	var stops = [],
		rawJson = [];
	async.each(routes, function(route, cb) {
		gtfs_stops.get(route, function(err, formatted, unformatted) {
			stops = stops.concat(formatted);
			rawJson = rawJson.concat(unformatted);
			cb();
		});
	}, function(err) {
		if (err)
			callback(err, null, null);
		else
			callback(err, stops, rawJson);
	});
}

var gtfsStatic = {
	
	get: function(callback) {
		getGtfsStaticFiles(callback);
	}
	
}

module.exports = gtfsStatic;