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
OTHER_RESTRICTIONS=$DOWNLOAD_DIR/other-restrictions
PUBLIC_FINANCING=$DOWNLOAD_DIR/public-financing
CONTRIBUTION_LIMITS=$DOWNLOAD_DIR/contribution-limits

# Create the temporary directory.
mkdir $DOWNLOAD_DIR

# Scaffold out the directory structure based on the Jekyll build.
# After this, $DOWNLOAD_DIR will contain subdirectories
# for the following sections:
#  - disclosure
#  - other-restrictions
#  - public-financing
# Each of these will contain a field-descriptions.csv file.
cp -r _site/downloads/build/* $DOWNLOAD_DIR

# Copy over the markdown data behind the modals for each section.
# This step will create the directory for contribution-limits.
# After this, section subdirectories will contain the following files:
#  - about.md
#  - howto.md
#
# During the copy process, add a markdownified title to the page, which
# is taken from the YAML front-matter.  We will also strip out YML
# front-matter from the final result
# Draws from http://stackoverflow.com/questions/28221779/how-to-remove-yaml-frontmatter-from-markdown-files
for i in `ls _modals`
do
	for f in `ls _modals/${i}`
	do
		TITLE=$(awk -F': ' '/^title: / { print $2 }' _modals/${i}/${f})
		mkdir -p ${DOWNLOAD_DIR}/${i}
		echo "# ${TITLE}

		$(sed -e '1 { /^---/ { :a N; /\n---/! ba; d} }' _modals/${i}/${f})" \
		> ${DOWNLOAD_DIR}/${i}/${f}
	done
done

# Distribute the database tables to the appropriate section directories.
cp data/CSVs/Laws_00_IdentifierTable.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_01_Defintions.csv $DOWNLOAD_DIR
cp data/CSVs/Laws_02_Contributions_1.csv $CONTRIBUTION_LIMITS
cp data/CSVs/Laws_02_Contributions_2.csv $CONTRIBUTION_LIMITS
cp data/CSVs/Laws_02_Contributions_3.csv $CONTRIBUTION_LIMITS
cp data/CSVs/Laws_03_Disclosure_1.csv $DISCLOSURE
cp data/CSVs/Laws_03_Disclosure_2.csv $DISCLOSURE
cp data/CSVs/Laws_03_Disclosure_3.csv $DISCLOSURE
cp data/CSVs/Laws_04_PublicFinancing.csv $PUBLIC_FINANCING
cp data/CSVs/Laws_05_Other.csv $OTHER_RESTRICTIONS

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
