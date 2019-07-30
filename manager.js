'use strict';

/*
This process gets run by a Windows service and starts up PM2.

This is based on https://github.com/jon-hall/pm2-windows-service
See http://pm2.keymetrics.io/docs/usage/application-declaration/

If you installed pm2 globally, the code will find the global install location for the user.

If you are running as a Windows service under a user that does not have pm2 installed
globally (such as the system user), then provide the path in the PM2_SERVICE_PM2_DIR env variable.

If you installed pm2 in the local npm-modules, comment out the call to "npm get prefix".
*/

const path = require('path'),
    execSync = require('child_process').execSync,
    json_regex = /\.json$/;

///////////////
// This could be a config file (json), script file (js), or delimited list (;) of either.
const start_script = path.join(__dirname, 'processes.json');
///////////////

// Try to use the global version of pm2 (first from env, then using npm cli)
let globals_dir = process.env.NPM_DIR;
if (!globals_dir) {
    try {
        // Get a string from the buffer and remove the trailing newline
        globals_dir = execSync('npm get prefix').toString().replace(/\r?\n$/, '');
    } catch (ex) {
        // Can't get global version of pm2 :(
    }
}

let pm2;
if (globals_dir) {
    try {
        pm2 = require(globals_dir + '/node_modules/pm2');
    } catch (ex) {
        // Looks like it didn't work, will just have to carry on with local...
    }
}

if (!pm2) {
    pm2 = require('pm2');
}

// NOTE: 'true' means the PM2 daemon exists in this process, so it gets kept alive with us as a Windows service
pm2.connect(true, function (err) {
    handleError(err);

    if (!start_script) {
        // No start script so just try and ressurect
        pm2.resurrect(function (err2) {
            // Don't crash if we failed to resurrect, we might save on shutdown anyway
        });
    } else {
        start_script.split(';').forEach(process_start_script);
    }
});

function process_start_script(start_script) {
    let start_config = start_script;

    // Make sure all apps in json config file have a cwd set, else the cwd will be the service user's home dir,
    // which will almost never lead to the correct script being found and launched
    if (json_regex.test(start_script)) {
        // Use the directory of the config file as the default cwd
        let default_cwd = path.dirname(start_script);

        // Try to load the JSON in using require, the parsed JSON will act as our start_config object
        try {
            start_config = require(start_script);
        } catch (ex) {
            throw new Error('Unable to load PM2 JSON configuration file (' + start_script + ')');
        }

        // PM2 app declarations can be an array or an object with an 'apps' node
        let apps = start_config.apps || start_config;

        // Normalize apps to an array
        apps = Array.isArray(apps) ? apps : [apps];

        // Make sure each app definition has a cwd set, else set the default
        apps.forEach(app_definition => {
            if (!app_definition.cwd) {
                app_definition.cwd = default_cwd;
            }
        });
    }

    // Else, try to start the start script (js file or json config)
    pm2.start(start_config, function (err2) {
        handleError(err2);
    });
}

function handleError(err) {
    if (err) {
        if (err instanceof Error) {
            throw err;
        }

        // We stringify since PM2 chucks us back objects that just end up as [Object object] otherwise
        throw new Error(JSON.stringify(err));
    }
}
