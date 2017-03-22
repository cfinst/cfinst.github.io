#!/bin/bash

# This script is responsible for packaging data files
# into .zip files for download.

# Authors:
#  Seemant Kulleen
#  Curran Kelleher

# Run the Jekyll build, to create the
# CSV files under _site/downloads/metadata
jekyll build

# This temporary directory will be zipped and deleted.
mkdir cfi-laws-database

# Put the database tables in "data".
mkdir cfi-laws-database/data
cp data/CSVs/* ./cfi-laws-database/data

# Put the LICENSE file at the top level.
mv cfi-laws-database/data/LICENSE cfi-laws-database

# Put the metadata tables in "metadata".
mkdir cfi-laws-database/metadata
cp _site/downloads/metadata/* ./cfi-laws-database/metadata

# Create the .zip file.
echo
echo "Creating cfi-laws-database.zip"
zip -r cfi-laws-database.zip cfi-laws-database

# Delete the temporary directory.
rm -rf cfi-laws-database
