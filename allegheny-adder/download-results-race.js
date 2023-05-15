const { writeFile } = require('fs/promises');
const { getMuniCenters, getPrecinctCenters, loadCurrentVersion, makeJSONRequest } = require('./clarity-utils');

const config = require('./config');

const groupBy = (xs, key) => {
  return xs.reduce((rv, x) => {
    (rv[x[key]] = rv[x[key]] || []).push(x);
    return rv;
  }, {});
};

const specialCandidateNames = {
  'Jr.': 'Zappala'
};

const specialPrecinctNames = {
  'CASL SHANNON': 'CASTLE SHANNON',
  "OHARA": "O'HARA",
  'ROSSLYN FARM': 'ROSSLYN FARMS',
  'SPRINGDAL BR': 'SPRINGDALE BR',
  'UP ST CLAIR': 'UPPER ST. CLAIR',
};

const sumArrays = (arrayItemCount, ...arrays) => {
  const result = Array.from({ length: arrayItemCount });
  return result.map((_, i) => arrays.map(xs => xs[i] || 0).reduce((sum, x) => sum + x, 0));
};

class RaceDownload {
  constructor(electionId, raceIdForGeography, raceIdForResults, raceName) {
    this.electionId = electionId;
    this.baseUrl = `https://results.enr.clarityelections.com/PA/Allegheny/${electionId}`;
    this.raceIdForGeography = raceIdForGeography;
    this.raceIdForResults = raceIdForResults;
    this.raceName = raceName;
  }

  addResultsByMuni(candidates, precincts, muniCenters) {
    const formattedPrecincts = precincts.map(([ precinctName, precinctCandidateVotes ]) => {
      let formattedPrecinctName = precinctName.toUpperCase().split(/ DIST/)[0].trim();

      if (!formattedPrecinctName.toUpperCase().startsWith('PITTSBURGH')) {
        formattedPrecinctName = formattedPrecinctName.split(/ (WARD|WD|WRD)/)[0];
      }

      formattedPrecinctName = formattedPrecinctName.replace(/^E /, 'EAST ');
      formattedPrecinctName = formattedPrecinctName.replace(/^MT /, 'MOUNT ');
      formattedPrecinctName = formattedPrecinctName.replace(/^N /, 'NORTH ');
      formattedPrecinctName = formattedPrecinctName.replace(/^S /, 'SOUTH ');
      formattedPrecinctName = formattedPrecinctName.replace(/^W /, 'WEST ');
      formattedPrecinctName = formattedPrecinctName.replace(/ WRD/, ' WARD');
      formattedPrecinctName = formattedPrecinctName.replace(/ HL$/, ' HILLS');
      formattedPrecinctName = formattedPrecinctName.replace(/ (HT|HTS)$/, ' HEIGHTS');
      formattedPrecinctName = formattedPrecinctName.replace(/ PK$/, ' PARK');
      formattedPrecinctName = formattedPrecinctName.replace(/ TWP$/, ' TP');
      formattedPrecinctName = formattedPrecinctName.replace(/ VILL$/, ' VILLAGE');

      if (specialPrecinctNames[formattedPrecinctName]) {
        formattedPrecinctName = specialPrecinctNames[formattedPrecinctName];
      }

      return [formattedPrecinctName, precinctCandidateVotes];
    });

    const grouppedMuniPrecincts = groupBy(formattedPrecincts, 0);
    const addedResults = Object.keys(grouppedMuniPrecincts).map((muni) => {
      const precinctCandidateVotes = grouppedMuniPrecincts[muni].map(([_, votes]) => votes);
      const muniCandidateVotes = sumArrays(candidates.length, ...precinctCandidateVotes);

      const muniCenter = muniCenters[muni.toUpperCase()];
      const muniCandidateMaxVotes = Math.max(...muniCandidateVotes);
      const muniTotalVotes = muniCandidateVotes.reduce((acc, val) => acc + val, 0);
      const candidatePercentages = muniCandidateVotes.map((candidateVote) => {
        if (muniTotalVotes === 0) return 0;
        return (100 * (candidateVote / muniTotalVotes)).toFixed(1);
      });

      return [
        muni,
        muniCenter.center_lat,
        muniCenter.center_lon,
        muniTotalVotes === 0 ? '' : candidates[muniCandidateVotes.indexOf(muniCandidateMaxVotes)],
        muniCandidateMaxVotes - (muniTotalVotes - muniCandidateMaxVotes),
        candidatePercentages[muniCandidateVotes.indexOf(muniCandidateMaxVotes)],
        ...muniCandidateVotes,
        muniTotalVotes,
        ...candidatePercentages
      ];
    });

    return Promise.resolve([
      [
        'muni_name',
        'muni_center_lat',
        'muni_center_lon',
        'winner',
        'winner_net',
        'winner_pct',
        ...candidates.map((c) => `${c}_total`),
        'muni_total',
        ...candidates.map((c) => `${c}_pct`)
      ],
      ...addedResults
    ]);
  }

  addResultsByPrecinct(candidates, precincts, precinctCenters) {
    const addedResults = precincts.map(([ precinctName, precinctCandidateVotes ]) => {
      const precinctCenter = precinctCenters[precinctName] || [];

      const precinctCandidateMaxVotes = Math.max(...precinctCandidateVotes);
      const precinctTotalVotes = precinctCandidateVotes.reduce((acc, val) => acc + val, 0);
      const candidatePercentages = precinctCandidateVotes.map((candidateVote) => {
        if (precinctTotalVotes === 0) return 0;
        return (100 * (candidateVote / precinctTotalVotes)).toFixed(1);
      });

      return [
        precinctName,
        precinctCenter[1],
        precinctCenter[0],
        precinctTotalVotes === 0 ? '' :  candidates[precinctCandidateVotes.indexOf(precinctCandidateMaxVotes)],
        precinctCandidateMaxVotes - (precinctTotalVotes - precinctCandidateMaxVotes),
        candidatePercentages[precinctCandidateVotes.indexOf(precinctCandidateMaxVotes)],
        ...precinctCandidateVotes,
        precinctTotalVotes,
        ...candidatePercentages
      ];
    });

    return Promise.resolve([
      [
        'precinct_name',
        'precinct_center_lat',
        'precinct_center_lon',
        'winner',
        'winner_net',
        'winner_pct',
        ...candidates.map((c) => `${c}_total`),
        'precinct_total',
        ...candidates.map((c) => `${c}_pct`)
      ],
      ...addedResults
    ]);
  }

  downloadCandidates() {
    return makeJSONRequest(this.baseUrl, 'sum.json')
      .then(({ Contests }) => {
        return Promise.resolve(Contests
          .find(c => c.K === this.raceIdForResults)
          .CH.map(c => c.split(' ').pop())
          .map(c => specialCandidateNames[c] ? specialCandidateNames[c] : c));
      });
  }

  downloadRace() {
    loadCurrentVersion(this.baseUrl)
      .then((baseUrl) => {
        this.baseUrl = baseUrl;
        return Promise.resolve();
      })
      .then(() => Promise.all([
        this.downloadCandidates(),
        this.downloadResults(),
        getMuniCenters(this.raceName),
        getPrecinctCenters(this.raceName)
      ]))
      .then(([ candidates, results, muniCenters, precinctCenters ]) => Promise.all([
        this.addResultsByMuni(candidates, results, muniCenters).then(r => this.saveResultsByMuni(r)),
        this.addResultsByPrecinct(candidates, results, precinctCenters).then(r => this.saveResultsByPrecinct(r))
      ]))
      .catch(e => { console.error(e); });
  }

  downloadResults() {
    return makeJSONRequest(this.baseUrl, 'ALL.json')
      .then(({ Contests }) => {
        return Promise.resolve(Contests.map((precinct) => {
          // Skip race summary
          if (precinct.A === "-1") return null;

          // Skip precinct if it doesn't include the race for geography or results
          if (precinct.C.indexOf(this.raceIdForGeography) === -1) return null;

          const precinctRaceIndex = precinct.C.indexOf(this.raceIdForResults);
          if (precinctRaceIndex === -1) return null;

          return [precinct.A, precinct.V[precinctRaceIndex]];
        }).filter((p) => p));
    });
  }

  saveResultsByMuni(results) {
    return writeFile(`output/resultsmuni-race-${this.raceName}.csv`, results.map((r) => r.join(',')).join("\n"));
  }

  saveResultsByPrecinct(results) {
    return writeFile(`output/results-race-${this.raceName}.csv`, results.map((r) => r.join(',')).join("\n"));
  }
}

config.races.forEach(([raceName, raceIdForGeography, raceIdForResults]) => {
  const rd = new RaceDownload(config.electionId, raceIdForGeography, raceIdForResults, raceName);
  rd.downloadRace();
});
