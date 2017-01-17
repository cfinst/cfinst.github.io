#!/bin/bash

# This script is responsible for packaging data files
# into .zip files for download.

# Authors:
#  Seemant Kulleen
#  Curran Kelleher

rm -rf downloads
mkdir downloads
mkdir downloads/full-database-csv
cp data/CSVs/* ./downloads/full-database-csv/
mkdir downloads/metadata
cp data/*.csv downloads/metadata/
cd downloads/

echo
echo "Creating full-database-csv.zip"
zip -r full-database-csv.zip full-database-csv

echo
echo "Creating metadata.zip"
zip -r metadata.zip metadata
echo

rm -rf full-database-csv
rm -rf metadata
