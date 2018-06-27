let { execSync } = require('child_process');
let path = require('path');

let cwd = process.cwd();
let resolveTheme = path.resolve(cwd, 'themes/yilia');

process.chdir(resolveTheme);

console.log(process.cwd());

execSync('npm install && npm run dist');

console.log('compile themes successfully');

process.chdir(cwd);

execSync('npm run generate && hexo deploy');
