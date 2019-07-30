const http = require('http');
const config = require('../config');
const routesUrl = config.api + "/getroutes?format=json&key=" + config.apiKey;

function getRoutes() {
    var rts = config.routes,
        gtfs = [];
    for (var i = 0; i < rts.length; i++) {
        var r = rts[i];
        gtfs.push({
            route_id: r.route_id,
            agency_id: config.agency.agency_id,
            route_short_name: r.route_id,
            route_long_name: r.route_long_name,
            route_desc: null,
            route_type: r.route_type,
            route_url: null,
            route_color: r.route_color,
            route_text_color: r.route_text_color,
            route_sort_order: null
        });
    }
    return gtfs;
}

function getRoutesApi(callback) {

    http.get(routesUrl, function (response) {

        var rawData = '';

        response.on('data', function (chunk) {
            rawData += chunk;
        });

        response.on('end', function () {
            callback(null, toGTFS(JSON.parse(rawData)["bustime-response"]["routes"]), JSON.parse(rawData)["bustime-response"]["routes"]);
        });

    }).on("error", function (err) {
        callback(err, null, null);
    });

}

function toGTFS(data) {
    var gtfs = [];
    for (var i = 0; i < data.length; i++) {
        var r = data[i];
        gtfs.push({
            route_id: r.rt,
            agency_id: config.agency.agency_id,
            route_short_name: r.rtdd,
            route_long_name: r.rtnm,
            route_desc: null,
            route_type: 3,
            route_url: null,
            route_color: r.rtclr,
            route_text_color: '#000000',
            route_sort_order: null
        });
    }
    return gtfs;
}

module.exports = {

    get: function () {
        return getRoutes();
    },

    getFromApi: function (callback) {
        getRoutesApi(callback);
    }
}