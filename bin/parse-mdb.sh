#!/bin/bash

# This script is responsible for generating CSV files from the CFI Campaign Finance Database,
# which is originally represented as a Microsoft Access database. For usage instructions,
# see README.md at the root of this repository.
#
# Authors:
#  Seemant Kulleen
#  Curran Kelleher

# Please install mdb-tools on your system. It is available using homebrew
# in macOS, and should be in most Linux package manager respositories
# (Ubuntu, Arch, Gentoo at the very least).  That will pull in some gnome2# files.  Such is life.
#
# Place the mdb file in this repository's data/ directory.
# From the repository's root, run:
# 	./bin/parse-mdb.sh <path to .mdb file>

# Get a list of tables in the mdb file. Separate into one per line"
tables=$(mdb-tables -d"blah" "$1" | sed -e 's/blah/\n/g')

# Create a dir named CSVs which sits next to the data file.
datadir=$(dirname "$1")
csvdir=${datadir}/CSVs
mkdir -p ${csvdir}

# Iterate through the list of tables. export the data to a csv file.
# If the table doesn't actually exist, its csv file gets removed.
# (This removes all zero-length files).
for table in ${tables}; do
	echo "Exporting ${table} to CSV..."
	mdb-export "$1" ${table} > "${csvdir}/${table}".csv || rm -f "${csvdir}/${table}".csv
	rm -f "${csvdir}"/*_tmp_*.csv
	rm -f "${csvdir}"/x_lookup*.csv
done

# Remove data files that don't contain anything useful.
rm ${csvdir}/x_Yes-No.csv
rm ${csvdir}/z_Laws_02_Contributions_1.csv
rm ${csvdir}/z_SetAppendState.csv

