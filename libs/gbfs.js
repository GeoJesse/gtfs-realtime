const async = require('async');
const https = require('https');
const config = require('../config');

function getGbfs(provider, callback) {
	getProviderFeed(provider, function(err, feed) {
		if (err)
			callback(err, null);
		else {
			var clone = JSON.parse(JSON.stringify(feed));
			var afs = config.gbfsProviders[provider].addnFeeds;
			for (var i = 0; i < afs.length; i++) {
				clone.data.en.feeds.push(afs[i]);
			}
			callback(err, clone);
		}
	});
}

function getProviderFeed(provider, callback) {
	var url = config.gbfsProviders[provider].url;
	https.get(url, function (response) {
        var rawData = '';
        response.on('data', function (chunk) {
            rawData += chunk;
        });
        response.on('end', function () {
            callback(null, JSON.parse(rawData));
        });
    }).on("error", function (err) {
        callback(err, null);
    });
}

var gbfs = {

    get: function (provider, callback) {
        getGbfs(provider, callback);
    }

}

module.exports = gbfs;