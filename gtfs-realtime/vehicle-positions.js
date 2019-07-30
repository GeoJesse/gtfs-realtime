const utils = require('../libs/utils');
const cabsApi = require('../libs/cabs-api');

function getVehiclePostions(callback) {

    cabsApi.vehicles(function (err, result) {
        if (!err)
            callback(null, result);
        else
            callback(err, null, null);
    });

}

function toGTFS(data) {
    var gtfs = [];
    for (var i = 0; i < data.length; i++) {
        var v = data[i];
        // use camelCase with GTFS realtime - it will be converted to underscores later
        gtfs.push({
            trip: {
                tripId: String(v.tripid),
                scheduleRelationship: 0
            },
            vehicle: {
                id: String(v.vid)
            },
            position: {
                latitude: parseFloat(v.lat),
                longitude: parseFloat(v.lon),
                bearing: parseFloat(v.hdg),
                speed: mphToMs(parseFloat(v.spd))
            },
            timestamp: utils.CabsTimestampToUTC(v.tmstmp),
            congestionLevel: 0
        });
    }
    return gtfs;
}

function mphToMs(mph) {
    return ((1609.34 * mph) / 60) / 60;
}

module.exports = {
    get: function (callback) {
        getVehiclePostions(callback);
    },

    format: function(vehicles){
        return toGTFS(vehicles);
    }
}