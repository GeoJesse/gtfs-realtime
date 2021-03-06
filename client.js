var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
var request = require('request');

var requestSettings = {
  method: 'GET',
  //url: 'http://localhost:3000/realtime',
  url: 'https://etch.app/gtfs/api/realtime',
  encoding: null
};
request(requestSettings, function (error, response, body) {
    if (!error && response.statusCode == 200) {        
        var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
        console.log(feed.entity);
    }
    else
        console.log(error);
});


// var GtfsRealtimeBindings = require('gtfs-realtime-bindings');
// var request = require('request');

// var requestSettings = {
//     method: 'GET',
//     //url: 'http://localhost:3000/realtime',
//     url: 'https://etch.app/gtfs/api/realtime',
//     encoding: null
// };
// request(requestSettings, function (error, response, body) {
//     if (!error && response.statusCode == 200) {
//         var feed = GtfsRealtimeBindings.FeedMessage.decode(body);
//         //console.log(feed.entity);
//         feed.entity.forEach(function (entity) {
//             if (entity.trip_update) {
//                 //console.log(entity.trip_update);
//             }
//         });
//     } else
//         console.log(error);
// });