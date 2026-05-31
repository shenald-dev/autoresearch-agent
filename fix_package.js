const fs = require('fs');

let content = fs.readFileSync('package.json', 'utf8');
content = content.replace(/<<<<<<< HEAD\n  "version": "1\.0\.28",\n=======\n  "version": "1\.0\.29",\n>>>>>>> origin\/master/, '  "version": "1.0.29",');
fs.writeFileSync('package.json', content);

let contentLock = fs.readFileSync('package-lock.json', 'utf8');
contentLock = contentLock.replace(/<<<<<<< HEAD\n  "version": "1\.0\.28",\n=======\n  "version": "1\.0\.29",\n>>>>>>> origin\/master/, '  "version": "1.0.29",');
contentLock = contentLock.replace(/<<<<<<< HEAD\n      "version": "1\.0\.28",\n=======\n      "version": "1\.0\.29",\n>>>>>>> origin\/master/, '      "version": "1.0.29",');
fs.writeFileSync('package-lock.json', contentLock);
