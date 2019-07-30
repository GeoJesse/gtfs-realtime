'use strict';

/*
This is based on
	https://github.com/jon-hall/pm2-windows-service
which is based on
	https://github.com/marklagendijk/node-pm2-windows-startup
	"It's based off of how pm2-windows-startup works, but uses node-windows to install the PM2 daemon as a service, rather than just start it at boot."
See https://github.com/Unitech/pm2/issues/1165
*/

const Service = require('node-windows').Service;

const util = require('./windows-util'),
	co = require('co');

co.wrap(function*() {
	util.checkPlatform();
	yield util.adminWarning();

	// Create a new service object
	// Setting the env vars for the home/npm location is optional, if you want to run the service as a different user.
	var service = new Service({
		name: 'mmtpa gtfs',
		description: 'api for accessing mmtpa static and dynamic gtfs feeds',
		script: require('path').join(__dirname,'manager.js'),
		env: [{
			name: "HOMEPATH",
			value: process.env["USERPROFILE"] // service is now able to access the user who created its home directory
		},
		{
			name: "NPM_DIR",
			// Get the npm global directory for this user, replace trailing newline.
			value: require('child_process').execSync('npm get prefix').toString().replace(/\r?\n$/, '')
		}]
	});
	/*
	// Let this throw if we can't remove previous daemon
	try {
		yield util.removeDaemon(service);
	} catch(ex) {
		throw new Error('Previous daemon still in use, please stop or uninstall existing service before reinstalling.');
	}
	*/
	
	// kill existing pm2 daemon
	try {
		yield exec('pm2 kill');
	} catch (ex) {
		// PM2 daemon wasn't running, no big deal
	}

	// Listen for the "install" event, which indicates the 
	// process is available as a service. 
	service.on('install',function(){
		console.log('Service installed!');
		service.start();
	});
	service.on('alreadyinstalled',function(){
		console.log('The service has already installed.');
		//service.start();
	});
	service.on('start',function() {
		console.log(service.name + ' has been started.');
	});

	service.install();
})();
