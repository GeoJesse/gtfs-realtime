const http = require('http');
const config = require('../config');

function getStopTimes() {
    var rts = config.routes,
        gtfs = [];
    for (var i = 0; i < rts.length; i++) {
        var route = rts[i],
            trips = route.trips,
            stopIds = route.stop_ids;
        for (var j = 0; j < trips.length; j++) {
            var t = trips[j],
                firstStopId = t.begin_sequence,
                stops = stopIds.slice(0),
                stopIndex = stops.indexOf(firstStopId),
                restart = stop.slice(stopIndex);
            stops.slice(stopIndex);
            var reordered = restart.concat(stops);
            for (var k = 0; k < reordered.length; k++) {
                gtfs.push({
                    trip_id: t.trip_id,
                    arrival_time: k == 0 ? t.first_stop_time : "",
                    departure_time: k == 0 ? t.first_stop_time : "",
                    stop_id: reordered[k],
                    stop_sequence: k,
                    stop_headsign: "",
                    pickup_type: 0,
                    drop_off_type: 0,
                    //shape_dist_traveled:"",
                    timepoint: 0
                });
            }
            gtfs.push({
                trip_id: t.trip_id,
                arrival_time: t.last_stop_time,
                departure_time: t.last_stop_time,
                stop_id: reordered[0],
                stop_sequence: reordered.length,
                stop_headsign: "",
                pickup_type: 0,
                drop_off_type: 0,
                //shape_dist_traveled:"",
                timepoint: 0
            });
        }
    }
    return gtfs;
}

function getStopTimesApi(trips) {
    return toGTFS(trips);
}

function toGTFS(data) {
    var gtfs = [];
    for (var i = 0; i < data.length; i++) {
        var pattern = data[i],
            pid = pattern.pid,
            pts = pattern.pt;
        for (var j = 0; j < pts.length; j++) {
            var pt = pts[j];
            if (pt.stpid) {
                gtfs.push({
                    trip_id: pid,
                    arrival_time: "UNKNOWN",
                    departure_time: "UNKNOWN",
                    stop_id: pt.stpid,
                    stop_sequence: pt.seq,
                    stop_headsign: pt.stpnm,
                    pickup_type: 0,
                    drop_off_type: 0,
                    shape_dist_traveled: pt.pdist,
                    timepoint: 0
                });
            }
        }
    }
    return gtfs;
}

module.exports = {

    get: function (trips) {
        return getStopTimes(trips);
    },

    getFromApi: function (trips) {
        return getStopTimesApi(trips);
    },

}