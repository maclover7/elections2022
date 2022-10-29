# allegheny-adder

Adds up election results for specific legislative districts in Allegheny
County.


### Usage

##### Download county map

Before election day, update the `election_id` in `config.json`, and run
`node download-map-county.js` to download the county precinct map. This will
generate a file called `output/map-county-ELECTIONID.geojson`.

##### Generate race results

Before election day, update the `races` array in `config.json`. There
should be one array per tracked race, with the first field as a race ID
of your selection, followed by the sheet name of the race in the
`detail.xls` file provided by the county.

On election day, run `download-results-county.js` to download results
for the tracked races.
