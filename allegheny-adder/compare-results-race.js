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
          originalMuni.push(...newMuni.slice(1));

          const candidateDiff = originalMuni[3 + this.newResultsCandidateNumber] - originalMuni[this.originalResultsCandidateNumber];
          originalMuni.splice(1, 0, candidateDiff)

          return Promise.resolve(originalMuni);
        }));
      })
      .then((comparedResults) => {
        comparedResults.shift();
        comparedResults.splice(0, 0, [
          'muni_name', 'diff',
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
        ...results.slice(1).slice(-3).map((r) => parseFloat(r))
      ]));
  }
}

config.races_compared.forEach((comparison) => {
  const rc = new RaceComparison(...comparison);
  rc.compare();
});
