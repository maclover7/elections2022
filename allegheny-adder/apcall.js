// ** CHANGE THIS ** //
const raceDate = '2023-05-16';
const raceId = 'PA-D-chief_executive-allegheny-2023-05-16';
// ** ** //

fetch(`https://static01.nyt.com/elections-assets/2022/data/${raceDate}/results-pennsylvania.json`)
  .then((r) => r.json())
  .then((r) => {
    const raceOutcome = r.races.find((r) => r.nyt_id == raceId).outcome;
    console.log(raceOutcome.won);
    console.log(raceOutcome.winner_accepted_at.length > 0 ? new Date(raceOutcome.winner_accepted_at[0]).toLocaleString() : '');
  });
