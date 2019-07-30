const http = require('http');
const config = require('../config');
const patternsUrl = config.api + "/getpatterns?format=json&key=" + config.apiKey;

function getTrips() {
    var rts = config.routes,
        gtfs = [];
    for (var i = 0; i < rts.length; i++) {
        var route = rts[i],
            trips = route.trips;
        for (var j = 0; j < trips.length; j++) {
            var t = trips[j];
            gtfs.push({
                route_id: route.route_id,
                service_id: t.service_id,
                trip_id: t.trip_id,
                trip_headsign: route.route_long_name,
                trip_short_name: route.route_id,
                direction_id: null,
                block_id: route.route_id,
                //shape_id: r.pid + "_shp",
                wheelchair_accessible: 1,
                bikes_allowed: 2
            });
        }
    }
    return gtfs;
}

function getTripsApi(route, callback) {

    http.get(patternsUrl + "&rt=" + route.route_id, function (response) {

        var rawData = '';

        response.on('data', function (chunk) {
            rawData += chunk;
        });

        response.on('end', function () {
            callback(null, toGTFS(route, JSON.parse(rawData)["bustime-response"]["ptr"]), JSON.parse(rawData)["bustime-response"]["ptr"]);
        });

    }).on("error", function (err) {
        callback(err, null, null);
    });

}

function toGTFS(route, data) {
    var gtfs = [];
    for (var i = 0; i < data.length; i++) {
        var r = data[i];
        gtfs.push({
            route_id: route.route_id,
            service_id: "UNKNOWN",
            trip_id: r.pid,
            trip_headsign: route.route_long_name,
            trip_short_name: route.route_id,
            direction_id: null,
            block_id: null,
            shape_id: r.pid + "_shp",
            wheelchair_accessible: 1,
            bikes_allowed: 2
        });
    }
    return gtfs;
}

module.exports = {

    get: function () {
        return getTrips();
    },

    getFromApi: function (route, callback) {
        getTripsApi(route, callback);
    }

}