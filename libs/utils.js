function cabsToUtc(timestamp) {
    // get first 8 characters and insert "-" and the timezone, i.e "20190204 13:00" becomes "2019-02-04 13:00 EST"
    // check for seconds
    var ts = timestamp.substr(0, 4) + "-" +
        timestamp.substr(4, 2) + "-" +
        timestamp.substr(6, 2) + " " +
        timestamp.substr(9, timestamp.length > 14 ? 8 : 5) + " EST";

    return Math.round(new Date(ts).getTime() / 1000);
}

module.exports = {

    CabsTimestampToUTC: function (timestamp) {
        return cabsToUtc(timestamp);
    }

}