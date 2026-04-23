const dns = require('dns/promises');

(async () => {
    let hostname = '::ffff:7f00:1';
    let addresses;
    try {
        addresses = await dns.lookup(hostname, { all: true });
        console.log(addresses);
    } catch(e) {
        console.error(e.code);
    }
})();
