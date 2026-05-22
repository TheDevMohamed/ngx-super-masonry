const fs = require('fs');
const path = require('path');

const rootPackageJson = require('../package.json');
const libPackageJsonPath = path.join(__dirname, '../projects/ngx-super-masonry/package.json');
const libPackageJson = require(libPackageJsonPath);

libPackageJson.keywords = rootPackageJson.keywords;

fs.writeFileSync(libPackageJsonPath, JSON.stringify(libPackageJson, null, 2) + '\n');
console.log('✓ Keywords synced to library package.json');
