const async = require('async');
const protobuf = require("protobufjs");
const tripUpdates = require('../gtfs-realtime/trip-updates');
const vehiclePositions = require('../gtfs-realtime/vehicle-positions');
const serviceAlerts = require('../gtfs-realtime/service-alerts');
const cabsApi = require('../libs/cabs-api');

var _feedMessage;

protobuf.load('./gtfs-realtime.proto', function (err, root) {
    if (!err)
        _feedMessage = root.lookupType("FeedMessage");
    else
        console.log(err);
});

function getGtfsRealtimeFeed(callback) {

    var asyncs = [
        function (cb) {
            vehiclePositions.get(function (err, formatted) {
                cb(err, formatted);
            });
        },
        function (cb) {
            serviceAlerts.get(function (err, formatted) {
                cb(err, formatted);
            });
        }
    ]

    async.parallel(asyncs, function (err1, results) {
        if (!err1) {
            var vehPos = vehiclePositions.format(results[0].vehicles),
                srvAlt = serviceAlerts.format(results[1].serviceBulletins),
                trpUts = [];
            tripUpdates.get(results[0].vehicles, function (err2, result) {
                if (!err2) {
                    /* var vids = results[0].vehicles.map(function (v) {
                        return v.vid;
                    });
                    trpUts = tripUpdates.format(vids, result); */
                    var buffer = processResults(result, vehPos, srvAlt);
                    callback(null, buffer);
                } else {
                    console.log(err);
                    callback(err, null);
                }
            });
        } else {
            console.log(err);
            callback(err, null);
        }
        /* if (!err) {
            var entities = [],
                counter = 0,
                tus = results[0],
                vps = results[1],
                sas = results[2];
            for (var i = 0; i < tus.length; i++) {
                entities.push({
                    id: 'feed-entity-' + counter,
                    tripUpdate: tus[i]
                });
                counter += 1;
            }
            for (var i = 0; i < vps.length; i++) {
                entities.push({
                    id: 'feed-entity-' + counter,
                    vehicle: vps[i]
                });
                counter += 1;
            }
            for (var i = 0; i < sas.length; i++) {
                entities.push({
                    id: 'feed-entity-' + counter,
                    alert: sas[i]
                });
                counter += 1;
            }
            var payload = {
                header: {
                    gtfsRealtimeVersion: '2',
                    incrementality: 0,
                    timestamp: Math.floor(Date.now() / 1000)
                },
                entity: entities
            };
            var errMsg = _feedMessage.verify(payload);
            if (errMsg) {
                console.log(errMsg);
                callback(errMsg, null);
            }
            var message = _feedMessage.create(payload);
            var buffer = _feedMessage.encode(message).finish();
            callback(err, buffer);
        } else {
            callback(err, null);
        } */
    });

}

function processResults(tripUpdates, vehiclePositions, serviceAlerts) {
    var entities = [],
        counter = 0;

    for (var i = 0; i < tripUpdates.length; i++) {
        entities.push({
            id: 'feed-entity-' + counter,
            tripUpdate: tripUpdates[i]
        });
        counter += 1;
    }
    for (var i = 0; i < vehiclePositions.length; i++) {
        entities.push({
            id: 'feed-entity-' + counter,
            vehicle: vehiclePositions[i]
        });
        counter += 1;
    }
    for (var i = 0; i < serviceAlerts.length; i++) {
        entities.push({
            id: 'feed-entity-' + counter,
            alert: serviceAlerts[i]
        });
        counter += 1;
    }

    var payload = {
        header: {
            gtfsRealtimeVersion: '2.0',
            incrementality: 0,
            timestamp: Math.floor(Date.now() / 1000)
        },
        entity: entities
    };

    var errMsg = _feedMessage.verify(payload);
    if (errMsg) {
        console.log(errMsg);
        return errMsg;
    }
    var message = _feedMessage.create(payload);
    return _feedMessage.encode(message).finish();
}

function getJson(callback) {

    var asyncs = [
        function (cb) {
            cabsApi.vehicles(function (err, result) {
                cb(err, result);
            });
        },
        function (cb) {
            cabsApi.predictionsByVehicles(function (err, result) {
                cb(err, result);
            });
        }
    ];

    async.parallel(asyncs, callback);
}

var gtfsRealtime = {

    get: function (callback) {
        getGtfsRealtimeFeed(callback);
    },

    getJson: function (callback) {
        getJson(callback);
    }

}

module.exports = gtfsRealtime;

/* vehiclePositions.get(function (err, formatted, unformatted) {
        if (!err) {
            var entities = [];
            for (var i = 0; i < formatted.length; i++) {
                entities.push({
                    id: 'feed-entity-' + i,
                    vehicle: formatted[i]
                });
            }
            var payload = {
                header: {
                    gtfsRealtimeVersion: '2',
                    incrementality: 0,
                    timestamp: Math.floor(Date.now() / 1000)
                },
                entity: entities
            };
            var errMsg = _feedMessage.verify(payload);
            if (errMsg)
                callback(errMsg, null);

            var message = _feedMessage.create(payload);
            var buffer = _feedMessage.encode(message).finish();
            callback(err, buffer)

        } else
            callback(err, null); */
//});