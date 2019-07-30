const http = require('http');
const url = require('url');
const archiver = require('archiver');
const gtfsStatic = require('./gtfs-static');
const gtfsRealtime = require('./gtfs-realtime');
const gbfs = require('./gbfs');
const bird = require('../bikes/bird');
const gtfsStaticConvert = require('./gtfs-static-converter');
const config = require('../config');

var counter = 0;

function processRequest(request, response) {    

    var type = getType(request.url),
        format = getFormat(request.url);

    if (type == 'static') {

        gtfsStatic.get(function (err, gtfs) {
            if (format == 'zip') {
                respondZip(response, err, gtfs, null);
            } else
                respondJson(response, err, gtfs, null);
        });

    } else if (type == 'realtime') {        
        if (format == 'raw') {
            gtfsRealtime.getJson(function (err, gtfs) {
                respondJson(response, err, gtfs, null);
            })
        } else {
            gtfsRealtime.get(function (err, gtfs) {
                if (err || typeof gtfs == 'string') {
                    respondJson(response, err || {
                        message: 'unspecified error'
                    }, null, 500);
                } else {
                    respondBuffer(response, err, gtfs, null);
                }
            });
        }
    } else if (type == 'gbfs') {
		var provider = getAdditionalRoutes(request.url);
		if (provider) {
			gbfs.get(provider[0], function (err, feed) {
				respondJson(response, err, feed, null);
			});			
		}
	} else if (type == 'bird') {
		bird.get(function(err, geojsonBikes) {
			respondJson(response, err, geojsonBikes, null);
		});
	} else if (type == 'proxy' && config.env == 'DEBUG') {
        getProxyRequest(request.url, function(err, data) {
			response.writeHead(200, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' });
			response.end(data && JSON.stringify(data));
		});
    } else {
        respondJson(response, new Error('invalid request'), null, 400);
    }

}

function respondJson(response, error, json, code) {
    code = code || (error ? 500 : 200);
    if (error)
        json = {
            error: error.message
        };
    response.writeHead(code, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });
    response.end(json && JSON.stringify(json));
}

function respondZip(response, error, json, code) {
    code = code || (error ? 500 : 200);
    if (error)
        respondWithJson(error, json, code);
    else {
        response.writeHead(code, {
            'Content-Type': 'application/zip',
            'Content-disposition': 'attachment; filename=gtfs-static.zip'
        });
        var zip = archiver('zip');
        zip.pipe(response);
        for (var key in json) {
            zip.append(gtfsStaticConvert.JsonToCsv(json[key]), {
                name: key + '.txt'
            });
        }
        zip.finalize();
    }
}

function respondBuffer(response, error, buffer, code) {
    code = code || (error ? 500 : 200);
    if (error)
        buffer = '';
    response.writeHead(code, {
        'Content-Type': 'application/octet-stream',
        'Access-Control-Allow-Origin': '*'
    });
    response.end(buffer);
}

function getType(url) {
    return splitRoute(url)[0];
}

function getAdditionalRoutes(url) {
	var route = splitRoute(url);
	route.splice(0, 1);
	return route;
}

function splitRoute(requestUrl) {
    var urlObj = url.parse(requestUrl, true),
        path = urlObj.pathname;
    path = path.indexOf('/') == 0 ? path.substring(1) : path;
    return path.split('/');
}

function getFormat(requestUrl) {
    var urlObj = url.parse(requestUrl, true),
        query = urlObj.query;
    return query.format || 'json';
}

function getProxyRequest(requestUrl, callback) {
	var urlObj = url.parse(requestUrl, true),
		query = urlObj.query,
		urlStr = query.url,
		params = '';
	for (var key in query) {
		if (key != url) {
			params += '&' + key + '=' + query[key];
		}
	}
	urlStr = urlStr + "?format=json&key=" + config.apiKey + params;
	http.get(urlStr, function(response) {
		
		var rawData = '';
		
		response.on('data', function(chunk) {
			rawData += chunk;
		});
		
		response.on('end', function () {
			callback(null, JSON.parse(rawData));
		});
		
	}).on("error", function(err) {
		callback(err, null, null);
	});
}

var gtfsRouter = {

    route: function (request, response) {
        processRequest(request, response);
    }

}

module.exports = gtfsRouter;