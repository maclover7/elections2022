const fetchOptions = {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
  }
};

function getMuniCenters(_) {
  return Promise.resolve(require(`./input/map-racemc.json`));
}

function getPrecinctCenters(raceIdForResults) {
  return new Promise((resolve) => {
    try {
      const precinctCenters = require(`./output/map-racepc-${raceIdForResults}.json`);
      resolve(precinctCenters);
    } catch {
      resolve({});
    }
  });
}

function loadCurrentVersion(baseUrl) {
  return fetch(`${baseUrl}/current_ver.txt`, fetchOptions)
    .then((r) => r.text())
    .then((r) => Promise.resolve(`${baseUrl}/${r}/json`))
    .catch(e => { throw(e); });
};

function makeJSONRequest(baseUrl, path) {
  return fetch(`${baseUrl}/${path}`, fetchOptions)
    .then((r) => r.json())
    .catch(e => { throw(e); });
}

module.exports = { getMuniCenters, getPrecinctCenters, loadCurrentVersion, makeJSONRequest };
