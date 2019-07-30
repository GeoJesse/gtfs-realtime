'use strict';

const path = require('path'),
    promisify = require('promisify-node'),
    del = require('del'),
    is_admin = require('is-admin');

exports.checkPlatform = function() {
    if(!/^win/.test(process.platform)) {
        throw new Error('This has to be run on Windows...');
    }
};

exports.adminWarning = function() {
    return promisify(is_admin)().
        then(admin => {
            if(!admin) {
                console.warn('*** HINT: Run this as administrator to avoid the UAC messages ***');
            }
        }, _ => {
            console.warn('*** HINT: Run this as administrator to avoid the UAC messages ***');
            // Don't re-throw, we just assume they aren't admin if it errored
        });
};

exports.removeDaemon = function(service) {
    return del(path.resolve(__dirname, 'daemon', service.id + '.*'), { force: true });
};