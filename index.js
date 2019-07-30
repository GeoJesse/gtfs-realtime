const http = require('http');
const config = require('./config');
const gtfsRouter = require('./libs/gtfs-router');

var server = http.createServer(requestReceived);

server.listen(config.port, config.hostname, function() {
	console.log(`Module running at //${config.hostname}:${config.port}/`);
});

function requestReceived(request, response) {		
	gtfsRouter.route(request, response);	
	
}