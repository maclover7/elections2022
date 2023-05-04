const { writeFile } = require('fs/promises');
const { loadCurrentVersion, makeJSONRequest } = require('./clarity-utils');

const config = require('./config');

class RaceDownload {
  constructor(electionId, raceIdForGeography, raceIdForResults, raceName) {
    this.electionId = electionId;
    this.baseUrl = `https://results.enr.clarityelections.com/PA/Allegheny/${electionId}`;
    this.raceIdForGeography = raceIdForGeography;
    this.raceIdForResults = raceIdForResults;
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
    return Promise.all([
      makeJSONRequest(this.baseUrl, 'sum.json'),
      makeJSONRequest(this.baseUrl, 'ALL.json')
    ]).then(([{ Contests: candidateContests }, { Contests: resultsContests }]) => {
      const candidates = candidateContests
        .find((c) => c.K === this.raceIdForResults)
        .CH.map((c) => c.split(' ').pop());

      const results = resultsContests.map((precinct) => {
        // Skip race summary
        if (precinct.A === "-1") return null;

        // Skip precinct if it doesn't include the race for geography or results
        if (precinct.C.indexOf(this.raceIdForGeography) === -1) return null;

        const precinctRaceIndex = precinct.C.indexOf(this.raceIdForResults);
        if (precinctRaceIndex === -1) return null;

        const candidateVotes = precinct.V[precinctRaceIndex];
        const precinctCandidateMaxVotes = Math.max(...candidateVotes);
        const precinctVotes = candidateVotes.reduce((acc, val) => acc + val, 0);
        const candidatePercentages = candidateVotes.map((candidateVote) => {
          if (precinctVotes === 0) return 0;
          return (100 * (candidateVote / precinctVotes)).toFixed(1);
        });

        return [
          precinct.A,
          candidates[candidateVotes.indexOf(precinctCandidateMaxVotes)],
          precinctCandidateMaxVotes - (precinctVotes - precinctCandidateMaxVotes),
          ...candidateVotes,
          precinctVotes,
          ...candidatePercentages
        ];
      }).filter((r) => r);

      return Promise.resolve([
        [
          'precinct_name',
          'winner',
          'winner_net',
          ...candidates.map((c) => `${c}_total`),
          'precinct_total',
          ...candidates.map((c) => `${c}_pct`)
        ],
        ...results
      ]);
    });
  }

  saveResults(results) {
    return writeFile(`output/results-race-${this.raceName}.csv`, results.map((r) => r.join(',')).join("\n"));
  }
}

config.races.forEach(([raceName, raceIdForGeography, raceIdForResults]) => {
  const rd = new RaceDownload(config.electionId, raceIdForGeography, raceIdForResults, raceName);
  rd.downloadRace();
});
