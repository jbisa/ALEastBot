"use strict";
var https = require('https');
var fs = require('fs');
var moment = require('moment-timezone');
var sprintf = require('sprintf').sprintf;
var zlib = require('zlib');

// Replace with your access token
var ACCESS_TOKEN = '4b22e306-f608-43f5-8f96-d4dcb7e08733';

// Replace with your bot name and email/website to contact if there is a problem
// e.g., "mybot/0.1 (https://erikberg.com/)"
var USER_AGENT = 'ALEastBot (aleastbot@gmail.com)';

// Set time zone to use for output
var TIME_ZONE = 'America/New_York';

function main() {
    // Set the API method, format, and any parameters
    var host   = 'erikberg.com';
    var sport  = undefined;
    var method = 'events';
    var id     = undefined;
    var format = 'json';
    var params = {
        'sport': 'mlb',
        'date': '20150412'
    };

    var url;
    var default_opts;
    var chunks;
    var buffer;
    var encoding;

    url = buildURL(host, sport, method, id, format, params);

    default_opts = {
        'host': host,
        'path': url,
        'headers': {
            'Accept-Encoding': 'gzip',
            'Authorization': 'Bearer ' + ACCESS_TOKEN,
            'User-Agent': USER_AGENT
        }
    };

    https.get(default_opts, function (res) {
        chunks = [];
        res.on('data', function (chunk) {
            chunks.push(chunk);
        });
        res.on('end', function () {
            if (res.statusCode !== 200) {
                // handle error...
                console.warn("Server did not return a 200 response!\n" + chunks.join(''));
                process.exit(1);
            }
            encoding = res.headers['content-encoding'];
            if (encoding === 'gzip') {
                buffer = Buffer.concat(chunks);
                zlib.gunzip(buffer, function (err, decoded) {
                    if (err) {
                        console.warn("Error trying to decompress data: " + err.message);
                        process.exit(1);
                    }
                    printResults(decoded);
                });
            } else {
                printResults(chunks.join(''));
            }
        });
    }).on('error', function (err) {
        console.warn("Error trying to contact server: " + err.message);
        process.exit(1);
    });
}

// See https://erikberg.com/api/methods Request URL Convention for
// an explanation
function buildURL(host, sport, method, id, format, params) {
    var ary = [sport, method, id];
    var path;
    var url;
    var param_list = [];
    var param_string;
    var key;

    path = ary.filter(function (element) {
        return element !== undefined;
    }).join('/');
    url = 'https://' + host + '/' + path + '.' + format;

    // check for parameters and create parameter string
    if (params) {
        for (key in params) {
            if (params.hasOwnProperty(key)) {
                param_list.push(encodeURIComponent(key) + '=' + encodeURIComponent(params[key]));
            }
        }
        param_string = param_list.join('&');
        if (param_list.length > 0) {
            url += '?' + param_string;
        }
    }
    return url;
}

function printResults(content) {
    var events = JSON.parse(content);
    var date;
    var time;

    date = moment.tz(events.events_date, TIME_ZONE).format('dddd, MMMM D, YYYY');
    process.stdout.write(sprintf("Events on %s\n\n", date));
    process.stdout.write(sprintf("%-35s %5s %34s\n", 'Time', 'Event', 'Status'));
    events.event.forEach(function (event) {
        if ((event.away_team.conference == "American" && event.away_team.division == "East")
            || (event.home_team.conference == "American" && event.home_team.division == "East")) {
            time = moment.tz(event.start_date_time, TIME_ZONE).format('h:mm A z');
            process.stdout.write(sprintf("%12s %24s vs. %-24s %9s\n",
                time,
                event.away_team.full_name,
                event.home_team.full_name,
                event.event_status));
        }
    });
}

main();