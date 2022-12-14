# allegheny-adder

Adds up election results for specific races in Allegheny County.

### Usage

##### At start of election day

**Download countywide precinct map**

Update the `electionId` in `config.json`, and run
`node download-map-county.js` to download the county precinct map. This
will generate a file called `output/map-county-ELECTIONID.geojson`.

**Update race list**

Update the `races` array in `config.json`. There should be one array per
tracked race, with the first entry as a race name of your selection,
followed by the race ID number utilized in the Clarity election system.

**Get zero-count results**

Run `download-results-race.js` to download zero-count (empty) results
for the tracked races.

**Generate race maps**

After you've downloaded the county map, and zero-count race results, run
`create-map-race.js` to generate precinct maps for each tracked race.

**Create Datawrapper visualization**

- Head to Datawrapper and create a new chloropleth map.
- Upload the `output/map-race-RACENAME.geojson` file generated by
  `create-map-race.js`.
- Link to an external dataset, and insert the GitHub URL for the "raw"
  version of the `output/results-race-RACENAME.csv` for the race.
- Select `dem_pct` as the color column, and insert the following as
  the color preset: `#b2182b,#ef8a62,#d1e5f0,#67a9cf,#2166ac`.
- You could also select `rep_pct` as the color column, but would need to
  adjust the color preset accordingly.
- Under custom range, change the center value to 50.
- Insert a title, description and graphic credit.
- Insert the source: `Allegheny County Elections Division`.
- Select to show map labels.
- Click customize tooltips to open a dropdown menu, and insert something
  similar to the following. You can pick the candidate order:

```
DEMCANDIDATENAMEHERE (D): {{ dem_total }}; {{ dem_pct }}%

REPCANDIDATENAMEHERE (R): {{ rep_total }}; {{ rep_pct }}%

Write-in: {{ wi_total }}; {{ wi_pct }}%

Total votes: {{ precinct_total }}
```

- Proof your map, and then click publish to get the HTML embed code.

##### During election reporting

**Download and upload race results**

Run `. ./update.sh` once to download and upload results for the tracked
races.
