const async = require('async');
//const https = require('https');
const http = require('http');
const config = require('../config');
var routesUrl = config.api + "/getroutes?format=json&key=" + config.apiKey;
var serviceBulletinsUrl = config.api + "/getservicebulletins?format=json&key=" + config.apiKey;
var vehiclesUrl = config.api + "/getvehicles?format=json&tmres=s&key=" + config.apiKey;
var predictionsUrl = config.api + "/getpredictions?format=json&tmres=s&key=" + config.apiKey;
var patternsUrl = config.api + "/getpatterns?format=json&key=" + config.apiKey;
if (config.env == 'DEBUG') {    
    routesUrl = 'https://etch.app/gtfs/api/proxy?url=http://ttm-bus-web.busfin.ohio-state.edu/bustime/api/v2/getroutes';
    serviceBulletinsUrl = 'https://etch.app/gtfs/api/proxy?url=http://ttm-bus-web.busfin.ohio-state.edu/bustime/api/v2/getservicebulletins';
    vehiclesUrl = 'https://etch.app/gtfs/api/proxy?url=http://ttm-bus-web.busfin.ohio-state.edu/bustime/api/v2/getvehicles';
    predictionsUrl = 'https://etch.app/gtfs/api/proxy?url=http://ttm-bus-web.busfin.ohio-state.edu/bustime/api/v2/getpredictions&tmres=s';
    patternsUrl = 'https://etch.app/gtfs/api/proxy?url=http://ttm-bus-web.busfin.ohio-state.edu/bustime/api/v2/getpatterns';
}

function getServiceBulletins(callback) {

    getRoutes(function (err1, r1) {
        serviceBulletinsAsync(r1.routes, function (err2, r2) {
            var sbs = [];
            for (var i = 0; i < r2.length; i++) {
                sbs.concat(r2[i]);
            }
            callback(err1 || err2 || null, {
                routes: r1.routes,
                serviceBulletins: sbs
            });
        })
    });

}

function getPredictionsByVehicles(callback) {

    getVehicles(function (err1, r1) {
        var vids = r1.vehicles.map(function (v) {
            return v.vid;
        });
        predictionsByVehiclesAsync(vids, function (err2, r2) {
            var pdrs = [];  
            for (var i = 0; i < r2.length; i++) {
                pdrs = pdrs.concat(r2[i]);
            }
            callback(err1 || err2 || null, {
                vehicles: r1.vehicles,
                predictions: pdrs
            });
        });
    });

}

function getPredictionsByRoutesAndPatterns(callback) {
    getRoutes(function (err1, r1) {
        var routes = r1.routes;
        patternsByRouteAsync(routes, function (err2, r2) {
            var routePatterns = r2;
            predictionsByPatternsAsync(routePatterns, function (err3, r3) {
                callback(err1 || err2 || err3 || null, {
                    routes: routes,
                    patterns: routePatterns,
                    patternPredictions: r3
                });
            });
            // results are all patterns in individual arrays by route
            /* for (var i = 0; i < results.length; i++) {
                // array of ptr's
                for (var j = 0; j < results[i].length; j++) {
                    // array of pt's
                    // so far maximum number of stops is 8
                    // TODO: run by groups if number of stops exceeds 10
                    var stops = results[i][j]['pt'].filter(function (s) {
                        return s.stpid;
                    });
                    console.log(stops.length);
                }
            } */
        });
    });
}

function getVehicles(callback) {
    //https.get(vehiclesUrl, function (response) {
	http.get(vehiclesUrl, function (response) {
        var rawData = '';
        response.on('data', function (chunk) {
            rawData += chunk;
        });
        response.on('end', function () {
            callback(null, {
                vehicles: JSON.parse(rawData)["bustime-response"]["vehicle"]
            });
        });
    }).on("error", function (err) {
        callback(err, null);
    });
}

function getRoutes(callback) {
    //https.get(routesUrl, function (response) {
	http.get(routesUrl, function (response) {
        var rawData = '';
        response.on('data', function (chunk) {
            rawData += chunk;
        });
        response.on('end', function () {
            callback(null, {
                routes: JSON.parse(rawData)["bustime-response"]["routes"]
            });
        });
    }).on("error", function (err) {
        callback(err, null);
    });
}

function serviceBulletinsAsync(routes, callback) {
    var asyncs = []
    for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        asyncs.push(asyncFunc(route.rt));
    }
    async.parallel(asyncs, callback);

    function asyncFunc(route) {
        return function (cb) {
            //https.get(serviceBulletinsUrl + "&rt=" + route, function (response) {
			http.get(serviceBulletinsUrl + "&rt=" + route, function (response) {
                var rawData = '';
                response.on('data', function (chunk) {
                    rawData += chunk;
                });
                response.on('end', function () {
                    var sb = JSON.parse(rawData)["bustime-response"]["sb"];
                    sb.rt = route;
                    cb(null, sb);
                });
            }).on("error", function (err) {
                cb(err, null);
            });
        }
    }
}

function predictionsByVehiclesAsync(vehicleIds, callback) {
    var asyncs = [];
    // no more than 10 at a time allowed for CABS api
    do {
        var vSet = vehicleIds.splice(0, 10),
            qrystr = "&tmres=s&vid=" + vSet.join(',');
        asyncs.push(asyncFunc(qrystr));
    } while (vehicleIds.length > 0);
    async.parallel(asyncs, callback);

    function asyncFunc(qry) {
        return function (cb) {
            //https.get(predictionsUrl + qry, function (response) {
			http.get(predictionsUrl + qry, function (response) {
                var rawData = '';
                response.on('data', function (chunk) {
                    rawData += chunk;
                });
                response.on('end', function () {
                    cb(null, JSON.parse(rawData)["bustime-response"]["prd"]);
                });
            }).on("error", function (err) {
                cb(err, null);
            });
        };
    }
}

function patternsByRouteAsync(routes, callback) {
    var asyncs = [];
    for (var i = 0; i < routes.length; i++) {
        var route = routes[i];
        asyncs.push(asyncFunc(route.rt));
    }
    async.parallel(asyncs, callback);

    function asyncFunc(route) {
        return function (cb) {
            //https.get(patternsUrl + "&rt=" + route, function (response) {
			http.get(patternsUrl + "&rt=" + route, function (response) {
                var rawData = '';
                response.on('data', function (chunk) {
                    rawData += chunk;
                });
                response.on('end', function () {
                    cb(null, JSON.parse(rawData)["bustime-response"]["ptr"]);
                });
            }).on("error", function (err) {
                cb(err, null);
            });
        };
    }
}

function predictionsByPatternsAsync(routePatterns, callback) {

    var asyncs = [];
    for (var i = 0; i < routePatterns.length; i++) {
        var patterns = routePatterns[i];
        for (var j = 0; j < patterns.length; j++) {
            var pattern = patterns[j],
                pid = pattern.pid,
                stopIds = pattern['pt'].filter(function (pt) {
                    return pt.stpid;
                }).map(function (s) {
                    return s.stpid;
                }).join(',');
            asyncs.push(asyncFunc(pid, stopIds));
        }
    }
    async.parallel(asyncs, callback);

    function asyncFunc(patternid, stpids) {
        return function (cb) {
            //https.get(predictionsUrl + "&stpid=" + stpids, function (response) {
			http.get(predictionsUrl + "&stpid=" + stpids, function (response) {
                var rawData = '';
                response.on('data', function (chunk) {
                    rawData += chunk;
                });
                response.on('end', function () {
                    var prd = JSON.parse(rawData)["bustime-response"]["prd"];
                    if (prd) {
                        cb(null, {
                            pid: patternid,
                            predictions: prd
                        });
                    } else
                        cb(null, {
                            pid: patternid,
                            predictions: []
                        });
                });
            }).on("error", function (err) {
                cb(err, null);
            });
        };
    }

}

module.exports = {

    serviceBulletins: function (callback) {
        getServiceBulletins(callback);
    },

    predictionsByVehicles: function (callback) {
        getPredictionsByVehicles(callback);
    },

    predictionsByRoutesAndPatterns: function (callback) {
        getPredictionsByRoutesAndPatterns(callback);
    },

    vehicles: function (callback) {
        getVehicles(callback);
    }

}