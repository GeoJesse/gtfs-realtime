const utils = require('../libs/utils');
const cabsApi = require('../libs/cabs-api');
const path = require('path');
const csvToJson = require('csvtojson');
const stopsPath = path.join(__dirname, '..', 'stops.txt');
const stopsTimesPath = path.join(__dirname, '..', 'stop_times.txt');

var _stop_cache,
    _stop_times_cache;
loadStops();

function getTripUpdates(vehicles, callback) {

    cabsApi.predictionsByVehicles(function (err, result) {
        if (!err)
            callback(null, toGTFS(vehicles, result.predictions));
        else
            callback(err, null);
    })

    /* cabsApi.predictionsByRoutesAndPatterns(function (err, result) {
        if (!err)
            callback(null, result);
        else
            callback(err, null);
    }); */

}

function toGTFS(vehicles, predictions) {
    var gtfs = [],
        unique = [],
        map = new Map();

    // get unique predictions by tripid and vid because each can have multiple StopTimeUpdates
    for (const prd of predictions) {
        var key = prd.vid + "-" + prd.tripid;
        if (!map.has(key)) {
            map.set(key, true);
            unique.push({
                vid: prd.vid,
                tripid: prd.tripid
            });
        }
    }

    for (var i = 0; i < unique.length; i++) {
        // get predictions for each tripid/vid pair
        var u = unique[i],
            vid = u.vid,
            tripid = u.tripid,
            prds = predictions.filter(function (p) {
                return p.vid == vid && p.tripid == tripid;
            }),
            timestamp = Math.round(new Date().getTime() / 1000);
        if (prds.length > 0) {
            // if each tripid/vid pair has predictions then add entries for StopTimeUpdates
            var stopUpdates = [];
            for (var j = 0; j < prds.length; j++) {
                var prd = prds[j];
                var stopUpdate = {
                    stopId: getStopId(prd.stpid, tripid),
                    scheduleRelationship: 0
                }
				timestamp =utils.CabsTimestampToUTC(prd.tmstmp);
                var predicted = utils.CabsTimestampToUTC(prd.prdtm),
                    scheduled = utils.CabsTimestampToUTC(prd.schdtm);
                if (prd.typ == 'A') {
                    stopUpdate.arrival = {
                        delay: parseInt(predicted - scheduled), // in seconds; negative sign means ahead of schedule
						time: predicted
                    };
                } else if (prd.typ == 'D') {
                    stopUpdate.departure = {
                        delay: parseInt(predicted - scheduled), // in seconds; negative sign means ahead of schedule
						time: predicted
                    };
                }
                stopUpdates.push(stopUpdate);
            }
            if (stopUpdates.length > 0 && tripHasVehicle(vehicles, tripid)) {
                gtfs.push({
                    trip: {
                        tripId: tripid,
                        scheduleRelationship: 0
                    },
                    vehicle: {
                        id: vid
                    },
                    stopTimeUpdate: stopUpdates,
                    timestamp: timestamp
                });
            }
        }
    }

    return gtfs;
}

function tripHasVehicle(vehicles, tripId) {
    return vehicles.filter(function (v) {
        v.tripid == tripId;
    }).length > 0;
}

function getStopId(stopCode, tripId) {
    var stops = _stop_cache.filter(function (s) {
        return s.stop_code == String(stopCode);
    });
    /* if (stops.length == 0 || stops.length > 1)
        console.log(stopCode + ":" + stops.length); */
    if (stops.length == 1) {
        return stops[0].stop_id;
    } else if (stops.length > 1) {
        // some stops are duplicated so check for the correct trip
        var sid = null;
        for (var i = 0; i < stops.length; i++) {
            var s = stops[i],
                stopTimes = _stop_times_cache.filter(function (st) {
                    return st.trip_id == tripId && st.stop_id == s.stop_id;
                });
            if (stopTimes.length > 0) {
                sid = s.stop_id;
                break;
            }
        }
        return sid;
    } else
        return null;
}

function loadStops() {
    if (!Array.isArray(_stop_cache) || _stop_cache.length == 0) {
        console.log('stops cache loaded');
        csvToJson()
            .fromFile(stopsPath)
            .then(function (stops) {
                _stop_cache = stops;
            });
    }
    if (!Array.isArray(_stop_times_cache) || _stop_times_cache.length == 0) {
        console.log('stop times cache loaded');
        csvToJson()
            .fromFile(stopsTimesPath)
            .then(function (stop_times) {
                _stop_times_cache = stop_times;
            });
    }
}

module.exports = {
    get: function (vehicles, callback) {
        loadStops();
        getTripUpdates(vehicles, callback);
    },

    format: function (vehiclesIds, data) {
        loadStops();
        return toGTFS(vehiclesIds, data);
    }
}