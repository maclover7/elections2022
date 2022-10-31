const { writeFile } = require('fs/promises');
const { loadCurrentVersion, makeJSONRequest } = require('./clarity-utils');

const config = require('./config');
const resultsHeader = ['precinct_name', 'dem_total', 'rep_total', 'wi_total', 'precinct_total', 'dem_pct', 'rep_pct', 'wi_pct'];

class RaceDownload {
  constructor(electionId, raceId, raceName) {
    this.electionId = electionId;
    this.baseUrl = `https://results.enr.clarityelections.com/PA/Allegheny/${electionId}`;
    this.raceId = raceId;
    this.raceName = raceName;
  }

  downloadRace() {
    loadCurrentVersion(this.baseUrl)
      .then((baseUrl) => {
        this.baseUrl = baseUrl;
        return Promise.resolve();
      })
      .then(() => this.downloadResults())
      .then((results) => this.saveResults(results))
      .catch(e => { console.error(e); });
  }

  downloadResults() {
    return makeJSONRequest(this.baseUrl, 'ALL.json')
      .then(({ Contests }) => {
        const results = Contests.map((precinct) => {
          const precinctRaceIndex = precinct.C.indexOf(this.raceId);
          if (precinctRaceIndex === -1) return null;

          // Skip race summary
          if (precinct.A === "-1") return null;

          const [demTotal, repTotal, wiTotal] = precinct.V[precinctRaceIndex];
          const precinctTotal = demTotal + repTotal + wiTotal;

          return [
            precinct.A,
            demTotal,
            repTotal,
            wiTotal,
            precinctTotal,
            (100 * (demTotal / precinctTotal)).toFixed(1),
            (100 * (repTotal / precinctTotal)).toFixed(1),
            (100 * (wiTotal / precinctTotal)).toFixed(1)
          ];
        })
          .filter((r) => r);

        return Promise.resolve(results);
      });
  }

  saveResults(results) {
    const resultsWithHeader = [resultsHeader, ...results];
    return writeFile(`output/results-race-${this.raceName}.csv`, resultsWithHeader.map((r) => r.join(',')).join("\n"));
  }
}

config.races.forEach(([raceName, raceId]) => {
  const rd = new RaceDownload(config.election_id, raceId, raceName);
  rd.downloadRace();
});
