const fs = require('fs');
let content = fs.readFileSync('package.json', 'utf8');
content = content.replace(/<<<<<<< HEAD\n  "version": "1.0.32",\n=======\n  "version": "1.0.30",\n>>>>>>> origin\/master/g, '  "version": "1.0.32",');
fs.writeFileSync('package.json', content, 'utf8');
