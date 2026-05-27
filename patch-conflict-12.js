const fs = require('fs');

let content = fs.readFileSync('package.json', 'utf8');

const search = `<<<<<<< HEAD
  "version": "1.0.29",

=======
  "version": "1.0.30",
>>>>>>> origin/master`;

const replace = `  "version": "1.0.30",`;

content = content.replace(search, replace);
fs.writeFileSync('package.json', content);
