const fs = require('fs/promises');
const xl = require('exceljs');

const config = require('./config');

config.races.forEach(([raceName, raceId]) => {
  const workbook = new xl.Workbook();

  workbook.xlsx.readFile('input/ccd1.xlsx')
    .then(() => {
      const sheet = workbook.getWorksheet(raceId);
      const results = [
        ['precinct_name', 'dem_total', 'rep_total', 'wi_total', 'precinct_total', 'dem_pct', 'rep_pct', 'wi_pct']
      ];

      for(i = 4; i < sheet.rowCount; i++) {
        results.push([
          sheet.getRow(i).getCell(1).value,
          sheet.getRow(i).getCell(6).value,
          sheet.getRow(i).getCell(10).value,
          sheet.getRow(i).getCell(14).value,
          sheet.getRow(i).getCell(15).value,
          (100 * (sheet.getRow(i).getCell(6).value / sheet.getRow(i).getCell(15).value)).toFixed(1),
          (100 * (sheet.getRow(i).getCell(10).value / sheet.getRow(i).getCell(15).value)).toFixed(1),
          (100 * (sheet.getRow(i).getCell(14).value / sheet.getRow(i).getCell(15).value)).toFixed(1),
        ]);
      }

      return Promise.resolve(results);
    })
    .then((results) => {
      fs.writeFile(`output/results-race-${raceName}.csv`, results.map((r) => r.join(',')).join("\n"));
    });
});
