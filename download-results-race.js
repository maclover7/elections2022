const request = require('request-promise');
const { writeFile } = require('fs/promises');

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
    this.loadCurrentVersion()
      .bind(this)
      .then(function (baseUrl) {
        this.baseUrl = baseUrl;
        return Promise.resolve();
      })
      .then(this.downloadResults)
      .then(this.saveResults);
  }

  downloadResults() {
    return this.makeRequest('ALL.json', { json: true })
      .then(({ Contests }) => {
        const results = Contests.map((precinct) => {
          const precinctRaceIndex = precinct.C.indexOf(this.raceId);
          if (precinctRaceIndex === -1) return null;

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

  loadCurrentVersion() {
    return this.makeRequest('current_ver.txt')
      .then((res) => Promise.resolve(`${this.baseUrl}/${res}/json`));
  }

  makeRequest(url, extraArgs) {
    return request({
      url: `${this.baseUrl}/${url}`,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
      },
      ...extraArgs
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
