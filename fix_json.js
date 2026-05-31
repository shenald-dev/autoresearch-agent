const fs = require('fs');

let pack = fs.readFileSync('package.json', 'utf8');
pack = pack.replace(
`<<<<<<< HEAD
  "version": "1.0.30",
=======
  "version": "1.0.31",
>>>>>>> origin/master`,
`  "version": "1.0.31",`
);
fs.writeFileSync('package.json', pack);
