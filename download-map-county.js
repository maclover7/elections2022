const { writeFile } = require('fs/promises');
const { loadCurrentVersion, makeJSONRequest } = require('./clarity-utils');

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
    return makeJSONRequest(this.baseUrl, 'en/electionsettings.json')
      .then((settings) => makeJSONRequest(this.baseUrl, settings['settings']['kmlmap']));
  }

  makeMap() {
    loadCurrentVersion(this.baseUrl)
      .then((baseUrl) => {
        this.baseUrl = baseUrl;
        return Promise.resolve();
      })
      .then(() => this.getPrecincts())
      .then((precincts) => Promise.all(precincts.map((p) => this.convertPrecinct(p))))
      .then((features) => this.saveFeatures(features));
  }

  saveFeatures(features) {
    const featureCollection = { type: 'FeatureCollection', features };
    return writeFile(`output/map-county-${this.electionId}.geojson`, JSON.stringify(featureCollection));
  }
}

const cm = new ClarityMap(config.election_id);
cm.makeMap();
