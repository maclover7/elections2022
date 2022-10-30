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
should be one array per tracked race, with the first field as a race
name of your selection, followed by the race ID number utilized in the
Clarity election system.

On election day, run `download-results-race.js` to download results
for the tracked races.

##### Generate race map

At the start of election day, after you've already downloaded the county
map and downloaded zero-count race results, run `create-map-race.js` to
generate precinct maps for each tracked race.
