'use strict';

const
	Service = require('node-windows').Service,
	util = require('./windows-util'),
	co = require('co');

co.wrap(function*() {
	util.checkPlatform();
	yield util.adminWarning();

	var service = new Service({
	  name: 'mmtpa gtfs',
	  script: require('path').join(__dirname,'manager.js')
	});

	// Verify service exists.
	// HACK: node-windows generates a service id, then sticks '.exe' on it
	// to get the actual registered service name
	var serviceName = service.id + '.exe';
	console.log('Deregistering ' + serviceName + '...');
	//yield exec('sc query ' + serviceName);

	// Listen for the "uninstall" event so we know when it's done.
	service.on('uninstall',function(){
	  console.log('Uninstall complete.');
	  console.log('The service exists: ',service.exists);
	});

	// Uninstall the service.
	service.uninstall();
	console.log('Service removal initiated.');
})();