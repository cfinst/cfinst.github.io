#!/bin/bash

# This script is responsible for packaging data files
# into .zip files for download.

# Authors:
#  Seemant Kulleen
#  Curran Kelleher

# Run the Jekyll build, to create the
# CSV files under _site/downloads/metadata
jekyll build

# This temporary directory will
#  - populated with CSV files and LICENSE file,
#  - zipped,
#  - and deleted.
#
# Note that this directory itself will be included
# in the .zip file, so the name does matter.
DOWNLOAD_DIR=cfi-laws-database

# Create the temporary directory.
mkdir $DOWNLOAD_DIR

# Scaffold out the directory structure based on the Jekyll build.
# After this, the $DOWNLOAD_DIR will contain subdirectories
# for the following sections:
#  - disclosure
#  - other-restrictions
#  - public-financing
# Each of these will contain a field-descriptions.csv file.
cp -r _site/downloads/build/* $DOWNLOAD_DIR

# Create the directory for contribution-limits.
# TODO

## Put the database tables in "data".
#mkdir $DOWNLOAD_DIR/data
#cp data/CSVs/* ./$DOWNLOAD_DIR/data

# Put the LICENSE file at the top level.
cp ./data/CSVs/LICENSE $DOWNLOAD_DIR


# Remove the old .zip file.
rm ./downloads/$DOWNLOAD_DIR.zip

# Create the new .zip file.
echo
echo "Creating $DOWNLOAD_DIR.zip"
zip -r ./downloads/$DOWNLOAD_DIR.zip $DOWNLOAD_DIR

# Delete the temporary directory.
rm -rf $DOWNLOAD_DIR
