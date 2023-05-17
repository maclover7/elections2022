const { readFile, writeFile } = require('fs/promises');

const config = require('./config');

class RaceComparison {
  constructor(comparisonName, originalResults, originalResultsCandidateNumber, newResults, newResultsCandidateNumber) {
    this.comparisonName = comparisonName;
    this.originalResults = originalResults;
    this.originalResultsCandidateNumber = originalResultsCandidateNumber;
    this.newResults = newResults;
    this.newResultsCandidateNumber = newResultsCandidateNumber;
  }

  compare() {
    Promise.all([
      this.loadResults(this.originalResults),
      this.loadResults(this.newResults)
    ])
      .then(([ originalResults, newResults ]) => {
        return Promise.all(originalResults.map((originalMuni) => {
          const newMuni = newResults.find((newMuni) => newMuni[0] === originalMuni[0]);
          originalMuni.push(...newMuni.slice(3));

          const newPct = originalMuni[5 + this.newResultsCandidateNumber];
          const oldPct = originalMuni[2 + this.originalResultsCandidateNumber];
          const pctDiff = 100 * (newPct - oldPct) / oldPct;
          originalMuni.splice(3, 0, pctDiff < 0 ? 'Dugan' : 'Zappala');
          originalMuni.splice(3, 0, Math.round(Math.abs(pctDiff) * 100) / 100);

          return Promise.resolve(originalMuni);
        }));
      })
      .then((comparedResults) => {
        comparedResults.shift();
        comparedResults.splice(0, 0, [
          'muni_name', 'muni_center_lat', 'muni_center_lon', 'pctdiff', 'cand_towards',
          `${this.originalResults}_Cand1_pct`, `${this.originalResults}_Cand2_pct`, `${this.originalResults}_Write-in_pct`,
          `${this.newResults}_Cand1_pct`, `${this.newResults}_Cand2_pct`, `${this.newResults}_Write-in_pct`]);

        writeFile(
          `output/resultsmuni-compared-race-${this.comparisonName}.csv`,
          comparedResults.map((r) => r.join(',')).join("\n"));
      });
  }

  loadResults(results) {
    return readFile(`output/resultsmuni-race-${results}.csv`, 'utf8')
      .then((file) => file.split("\n").map((line) => line.split(",")))
      .then((munis) => munis.map((results) => [
        results[0],
        results[1],
        results[2],
        ...results.slice(1).slice(-3).map((r) => parseFloat(r))
      ]));
  }
}

config.races_compared.forEach((comparison) => {
  const rc = new RaceComparison(...comparison);
  rc.compare();
});
