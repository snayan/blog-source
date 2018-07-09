let { execSync } = require('child_process');
let path = require('path');

let cwd = process.cwd();
let resolveTheme = path.resolve(cwd, 'themes/yilia');

process.chdir(resolveTheme);

console.log(process.cwd());

console.log('starting...');

execSync('npm install && npm run dist');

console.log('compile themes successfully');

process.chdir(cwd);

execSync('hexo serve');

console.log('your serve start on :http://localhost:4000');
