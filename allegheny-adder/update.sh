#! /bin/bash

# Run download script
node download-results-race.js

# Compare race results
node compare-results-race.js

# Commit race results
git add output/
git commit -m "AUTO: Latest race results"

# Push race resulsts
git push
