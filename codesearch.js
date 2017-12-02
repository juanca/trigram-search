/* eslint-disable import/no-commonjs */
/* eslint-disable no-console */
/* eslint-disable no-param-reassign */
const fs = require('fs');
const path = require('path');
const _ = require('underscore');

const railsRoot = path.join(__dirname, '../..');
const [x, y, pathToSearch, extensions, searchTerm] = process.argv;
console.log(x, y, pathToSearch, extensions);

function findAllFilesWithExt(directoryPath, extension) {
  if (!fs.existsSync(directoryPath)) {
    console.log('No directory found:', directoryPath);
    return [];
  }

  const fileNames = fs.readdirSync(directoryPath);

  return fileNames.reduce((filePaths, fileName) => {
    const filePath = path.join(directoryPath, fileName);
    const stat = fs.lstatSync(filePath);

    if (stat.isDirectory()) {
      return filePaths.concat(findAllFilesWithExt(filePath, extension));
    } else if (filePath.match(new RegExp(`\\.${extension}$`))) {
      return filePaths.concat(filePath);
    }

    return filePaths;
  }, []);
}

//
//

const files = _.flatten(extensions.split(',').map(extension => findAllFilesWithExt(pathToSearch, extension)));
console.log('files count', files.length);

// Given a file, return key-values:
//   "def": [filename]
//   "ef ": [filename]
//   "f m": [filename]
function getTrigramsMap(filePath, content) {
  const contents = fs.readFileSync(filePath, 'utf8');
  const lines = contents.split('\n');
  return lines.reduce((trigramsMap, line) => {
    for (let i = 0; i < line.length - 2; i += 1) {
      const trigram = line[i] + line[i + 1] + line[i + 2];
      trigramsMap[trigram] = [filePath]; // eslint-disable-line
    }

    return trigramsMap;
  }, {});
}

const trigramsMap = files.reduce((map, file, index) => {
  console.log('progress', index, 'of', files.length);
  const fileTrigrams = getTrigramsMap(file)
  return Object.keys(fileTrigrams).reduce((map2, key) => {
    if (map2[key]) {
      map2[key] = fileTrigrams[key].concat(map2[key]);
    } else {
      map2[key] = fileTrigrams[key];
    }

    return map2;
  }, map);
}, {});

const searchTermTrigrams = [];

for (let i = 0; i < searchTerm.length - 2; i += 1) {
  const trigram = searchTerm[i] + searchTerm[i + 1] + searchTerm[i + 2];
  searchTermTrigrams.push(trigram);
}

console.log('serach term trigrams', searchTerm.length, searchTermTrigrams);

const searchSpace = searchTermTrigrams.map(searchTermTrigram => trigramsMap[searchTermTrigram]);

_.intersection(...searchSpace).forEach((filePath) => {
  const contents = fs.readFileSync(filePath, 'utf8');
  const lines = contents.split('\n');
  lines.forEach((line, i) => {
    if (line.indexOf(searchTerm) > -1) {
      console.log(`${filePath}:${i + 1}`);
    }
  });
});
