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

# Use variables for directory names, for easy maintenance.
DISCLOSURE=$DOWNLOAD_DIR/disclosure
OTHER=$DOWNLOAD_DIR/other
PUBLIC_FINANCING=$DOWNLOAD_DIR/public-financing
CONTRIBUTION_LIMITS=$DOWNLOAD_DIR/contribution-limits

# Create the temporary directory.
mkdir $DOWNLOAD_DIR

# Delete the old download .zip, so we don't include it in the new one.
rm downloads/$DOWNLOAD_DIR.zip

# Copy over files (not directories) from the /downloads directory.
# This includes the README.md and the codebook files.
cp downloads/CFI_StateLaws_Codebook_web.pdf $DOWNLOAD_DIR
cp downloads/CFI_StateLaws_Codebook_Abridged.pdf $DOWNLOAD_DIR


# Distribute the database tables to the appropriate section directories.
cp data/CSVs/Laws_00_IdentifierTable.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_01_Defintions.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_02_Contributions_1.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_02_Contributions_2.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_02_Contributions_3.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_03_Disclosure_1.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_03_Disclosure_2.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_03_Disclosure_3.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_04_PublicFinancing.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_05_Other.csv $DOWNLOAD_DIR

# Put the LICENSE file at the top level.
cp ./data/CSVs/LICENSE $DOWNLOAD_DIR

# Remove the old .zip file.
rm ./downloads/$DOWNLOAD_DIR.zip

# Create the new .zip file.
echo
echo "Creating $DOWNLOAD_DIR.zip"
zip -r ./downloads/$DOWNLOAD_DIR.zip $DOWNLOAD_DIR

# Print out the directory structure.
find $DOWNLOAD_DIR | sed 's|[^/]*/|- |g'

# Delete the temporary directory.
rm -rf $DOWNLOAD_DIR

#__________________________
# RUN AGAIN FOR LIMITS FILE
#__________________________

# This temporary directory will
#  - populated with CSV files and LICENSE file,
#  - zipped,
#  - and deleted.
#
# Note that this directory itself will be included
# in the .zip file, so the name does matter.
DOWNLOAD_DIR=cfi-laws-database_ContribLimits

# Use variables for directory names, for easy maintenance.
DISCLOSURE=$DOWNLOAD_DIR/disclosure
OTHER=$DOWNLOAD_DIR/other
PUBLIC_FINANCING=$DOWNLOAD_DIR/public-financing
CONTRIBUTION_LIMITS=$DOWNLOAD_DIR/contribution-limits

# Create the temporary directory.
mkdir $DOWNLOAD_DIR

# Delete the old download .zip, so we don't include it in the new one.
rm downloads/$DOWNLOAD_DIR.zip

# Copy over files (not directories) from the /downloads directory.
# This includes the README.md and the codebook files.
cp downloads/CFI_StateLaws_Codebook_web.pdf $DOWNLOAD_DIR
cp downloads/CFI_StateLaws_Codebook_Abridged.pdf $DOWNLOAD_DIR


# Distribute the database tables to the appropriate section directories.
cp data/CSVs/Laws_00_IdentifierTable.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_01_Defintions.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_02_Contributions_1.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_02_Contributions_2.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_02_Contributions_3.csv $DOWNLOAD_DIR

# Put the LICENSE file at the top level.
cp ./data/CSVs/LICENSE $DOWNLOAD_DIR

# Remove the old .zip file.
rm ./downloads/$DOWNLOAD_DIR.zip

# Create the new .zip file.
echo
echo "Creating $DOWNLOAD_DIR.zip"
zip -r ./downloads/$DOWNLOAD_DIR.zip $DOWNLOAD_DIR

# Print out the directory structure.
find $DOWNLOAD_DIR | sed 's|[^/]*/|- |g'

# Delete the temporary directory.
rm -rf $DOWNLOAD_DIR

