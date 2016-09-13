#!/bin/bash

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
done
