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
zip -r full-database-csv.zip full-database-csv
zip -r metadata.zip metadata
rm -rf full-database-csv
rm -rf metadata
