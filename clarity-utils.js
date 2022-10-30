const request = require('request-promise');

function loadCurrentVersion(baseUrl) {
  return makeRequest(baseUrl, 'current_ver.txt')
    .then((res) => Promise.resolve(`${baseUrl}/${res}/json`));
};

function makeRequest(baseUrl, path, extraArgs) {
  return request({
    url: `${baseUrl}/${path}`,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/106.0.0.0 Safari/537.36'
    },
    ...extraArgs
  });
};

module.exports = { loadCurrentVersion, makeRequest };
