/**
 * Get box score for a given team in the AL East via https://erikberg.com/
 * First, get an Event from an AL East team, then use that ID to get the
 * box score. Get individual player stats as well.
 *
 * @type {exports}
 */


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
    var sport  = 'mlb';
    var method = 'boxscore';
    var id     = '20150412';
    var format = 'json';

    var url;
    var default_opts;
    var chunks;
    var buffer;
    var encoding;

    url = buildURL(host, sport, method, id, format);

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
function buildURL(host, sport, method, id, format) {
    var ary = [sport, method, id];
    var path;
    var url;

    path = ary.filter(function (element) {
        return element !== undefined;
    }).join('/');
    url = 'https://' + host + '/' + path + '.' + format;

    return url;
}

function printResults(content) {
    var standings = JSON.parse(content);

    standings.standing.forEach(function (standing) {
        if (standing.conference == "AL" && standing.division == "E") {
            console.log(standing.ordinal_rank + " " + standing.first_name + " " + standing.last_name);
        }
    });
}

main();