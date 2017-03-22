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
DOWNLOAD_DIR=cfi-laws-database

# Create the temporary directory.
# This will be included in the .zip file, so the name matters.
mkdir $DOWNLOAD_DIR

# Put the database tables in "data".
mkdir $DOWNLOAD_DIR/data
cp data/CSVs/* ./$DOWNLOAD_DIR/data

# Put the LICENSE file at the top level.
mv $DOWNLOAD_DIR/data/LICENSE $DOWNLOAD_DIR

# Put the metadata tables in "metadata".
mkdir $DOWNLOAD_DIR/metadata
cp _site/downloads/metadata/* ./$DOWNLOAD_DIR/metadata

# Create the .zip file.
echo
echo "Creating $DOWNLOAD_DIR.zip"
zip -r downloads/$DOWNLOAD_DIR.zip $DOWNLOAD_DIR

# Delete the temporary directory.
rm -rf $DOWNLOAD_DIR
