# allegheny-adder

Adds up election results for specific legislative districts in Allegheny
County.


### Usage

##### Download county map

Before election day, update the `election_id` in `config.json`, and run
`node download-map-county.js` to download the county precinct map. This will
generate a file called `output/map-county-ELECTIONID.geojson`.
