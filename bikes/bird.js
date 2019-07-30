const https = require('https');
const url = "https://mds.bird.co/gbfs/columbus/free_bikes"

function getBirdBikes(callback) {
	
	https.get(url, function (response) {
        var rawData = '';
        response.on('data', function (chunk) {
            rawData += chunk;
        });
        response.on('end', function () {
            callback(null, birdToGeoJson(JSON.parse(rawData)["data"]["bikes"]));
        });
    }).on("error", function (err) {
        callback(err, null);
    });
	
}

function birdToGeoJson(bikes) {
	var geojson = {
		"type": "FeatureCollection",
		"features": []
	};
	for (var i = 0; i < bikes.length; i++) {
		var bike = bikes[i];
		geojson.features.push({
			"type": "Feature",
			"geometry": {
				"type": "Point",
				"coordinates": [bike.lon, bike.lat]
			},
			"properties": bike
		});
	}
	return geojson;
}

module.exports = {
	get: function(callback) {
		getBirdBikes(callback);
	}
}

/* {
  "type": "FeatureCollection",
  "features": [
    {
      "type": "Feature",
      "geometry": {
        "type": "Point",
        "coordinates": [0, 0]
      },
      "properties": {
        "name": "null island"
      }
    }
  ]
} */