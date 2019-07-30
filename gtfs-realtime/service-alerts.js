const config = require('../config');
const cabsApi = require('../libs/cabs-api');

function getAlerts(callback) {

    cabsApi.serviceBulletins(function (err, result) {        
        if (!err)
            callback(null, result);
        else
            callback(err, null);
    });

}

function toGTFS(data) {
    var gtfs = [];
    for (var i = 0; i < data.length; i++) {
        var sb = data[i];
        // use camelCase with GTFS realtime - it will be converted to underscores later
        if (sb.prty.toLowerCase() != 'low') {

            if (validServiceBulletinChildren(sb)) {
                for (var j = 0; j < sb.srvc.length; j++) {
                    var srvc = sb.srvc[j],
                        alrt = {
                            informedEntity: {
                                agencyId: String(config.agency.agency_id),
                                routeId: String(srvc.rt),
                                stopId: String(srvc.stpid)
                            }
                        }
                    gtfs.push({
                        ...alrt,
                        ...getGtfsTranslation(sb)
                    });
                }
            } else {
                var alrt = {
                    informedEntity: {
                        agencyId: config.agency.agency_id,
                        routeId: String(srvc.rt)
                    }
                }
                gtfs.push({
                    ...alrt,
                    ...getGtfsTranslation(sb)
                });
            }
        }
    }
    return gtfs;
}

function getGtfsTranslation(sb) {
    return {
        headerText: {
            translation: {
                text: sb.sbj,
                language: 'en'
            }
        },
        descriptionText: {
            translation: {
                text: sb.dtl,
                language: 'en'
            }
        }
    }
}

function validServiceBulletinChildren(sb) {
    // api delivers at least one blank service bulletin
    if (sb.srvc) {
        if (sb.srvc.length > 1)
            return true;
        else {
            if (sb.srvc[0].rt.length > 1 || sb.srvc[0].rtdir.length > 1 || sb.srvc[0].stpid.length > 1 || sb.srvc[0].stpnm.length > 1)
                return true;
            else
                return false;
        }
    }
    return false;
}

module.exports = {

    get: function (callback) {
        getAlerts(callback);
    },

    format: function(serviceBulletins){
        return toGTFS(serviceBulletins);
    }
}