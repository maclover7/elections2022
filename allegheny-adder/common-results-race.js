const { readFile, writeFile } = require('fs/promises');

const config = require('./config');

class RaceCommon {
  constructor(commonName, commonRaces) {
    this.commonName = commonName;
    this.commonRaces = commonRaces;
  }

  common() {
    Promise.all(this.commonRaces.map(this.loadResults))
      .then((allRaceResults) => {
        return Promise.resolve(allRaceResults.reduce((acc, raceResults) => {
          raceResults.forEach(([muni, result]) => {
            if (!acc[muni]) acc[muni] = [];
            acc[muni].push(result);
          });

          return acc;
        }, {}));
      })
      .then((collatedRaceResults) => {
        return Promise.all(Object.keys(collatedRaceResults).map((muni) => {
          const muniResults = collatedRaceResults[muni];

          return Promise.resolve({
            [muni]: muniResults.every(r => !r) ? 'No wins' : muniResults.filter(r => r).join('-')
          });
        }));
      })
      .then((formattedRaceResults) => {
        writeFile(
          `output/resultsmuni-common-race-${this.commonName}.csv`,
          [
            "muni_name,classification\n",
            ...formattedRaceResults.map((r) => Object.keys(r).map((muni) => `${muni},${r[muni]}`)).join("\n")
          ]);
      });
  }

  loadResults([raceId, candidateName]) {
    return readFile(`output/resultsmuni-race-${raceId}.csv`, 'utf8')
      .then((file) => file.split("\n").map((line) => line.split(",")))
      .then((munis) => munis.slice(1).map(results => [
        results[0], results[3] === candidateName ? candidateName : false
      ]));
  }
}

config.races_common.forEach(([commonName, commonRaces]) => {
  const rc = new RaceCommon(commonName, commonRaces);
  rc.common();
});
