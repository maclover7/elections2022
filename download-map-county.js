const request = require('request-promise');
const { writeFile } = require('fs/promises');

const config = require('./config');

class ClarityMap {
  constructor(electionId) {
    this.electionId = electionId;
    this.baseUrl = `https://results.enr.clarityelections.com/PA/Allegheny/${electionId}`;
  }

  convertPrecinct(precinct) {
    const coordsString = precinct.GCords.replace("/\\\\/g", "\\");

    return this.convertPrecinctCoords(coordsString)
      .then((coords) => {
        const coordsPairs = coords.map((pair) => [pair[1], pair[0]]);

        return Promise.resolve({
          geometry: {
            type: 'Polygon',
            coordinates: [coordsPairs]
          },
          properties: {
            name: precinct.Name
          },
          type: 'Feature'
        });
      });
  }

  convertPrecinctCoords(coordsString) {
    return new Promise((resolve, reject) => {
      const coordsPairs = [];
      var n = 0;
      var r = 0;
      var i = 0;

      for (var t = coordsString.length; n < t;) {
        var o = undefined;
        var s = 0;
        var a = 0;

        do {
          a |= (31 & (o = coordsString.charCodeAt(n++) - 63)) << s;
          s += 5;
        } while (o >= 32);

        r += 1 & a ? ~(a >> 1) : a >> 1

        s = 0;
        a = 0;

        do {
          a |= (31 & (o = coordsString.charCodeAt(n++) - 63)) << s;
          s += 5;
        } while (o >= 32);

        i += 1 & a ? ~(a >> 1) : a >> 1;

        coordsPairs.push([1e-5 * r, 1e-5 * i]);
      }

      resolve(coordsPairs);
    });
  }

  getPrecincts() {
    return this.makeRequest('en/electionsettings.json', { json: true })
      .then((settings) => this.makeRequest(settings['settings']['kmlmap'], { json: true }));
  }

  loadCurrentVersion() {
    return this.makeRequest('current_ver.txt')
      .then((res) => Promise.resolve(`${this.baseUrl}/${res}/json`));
  }

  makeMap() {
    this.loadCurrentVersion()
      .bind(this)
      .then(function (baseUrl) {
        this.baseUrl = baseUrl;
        return Promise.resolve();
      })
      .then(this.getPrecincts)
      .then((precincts) => Promise.all(precincts.map(this.convertPrecinct.bind(this))) )
      .then(this.saveFeatures);
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

  saveFeatures(features) {
    const featureCollection = { type: 'FeatureCollection', features };
    return writeFile(`output/map-county-${this.electionId}.geojson`, JSON.stringify(featureCollection));
  }
}

const cm = new ClarityMap(config.election_id);
cm.makeMap();
