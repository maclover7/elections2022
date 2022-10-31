const { readFile, writeFile } = require('fs/promises');

const config = require('./config');

const getCountyMap = (electionId) => {
  return readFile(`./output/map-county-${electionId}.geojson`, 'utf-8')
    .then((map) => Promise.resolve(JSON.parse(map)));
};

const getPrecinctNames = (raceName) => {
  return readFile(`./output/results-race-${raceName}.csv`, 'utf-8')
    .then((results) => {
      const parsedResults = results.split("\n").map((r) => r.split(','));
      return Promise.resolve(parsedResults.map((r) => r[0]));
    });
};

config.races.forEach(([raceName, raceId]) => {
  Promise.all([
    getCountyMap(config.electionId),
    getPrecinctNames(raceName)
  ])
    .then(([map, precinctNames]) => {
      map.features = map.features.filter((feature) => precinctNames.includes(feature.properties.name));
      return writeFile(`output/map-race-${raceName}.geojson`, JSON.stringify(map));
    });
});
