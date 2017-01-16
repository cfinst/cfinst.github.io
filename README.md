# CFI WebTool

This repository contains the source code of the [Campaign Finance Institute](http://www.cfinst.org/) data exploration and download tool.

## Data Update Instructions

### Updating from Access Database

The following instructions are for updating the data used by this software from a new database dump from the original Microsoft Access database. After following these steps, the software will use the updated data.

1. Download database dump file, e.g. `CFI State Laws Update_Merge.zip`. This will likely end up in your `~/Downloads` folder (on Linux / Mac).
2. Move the file into the data directory of this repository: `cd cfi/data; mv ~/Downloads/CFI\ State\ Laws\ Update_Merge.zip .`
3. Unzip the file `unzip CFI\ State\ Laws\ Update_Merge.zip`
4. Install [mdbtools](https://github.com/brianb/mdbtools). In Ubuntu Linux, these can be installed with the command `sudo apt-get install mdbtools`.
4. Run the shell script that generates the CSV files from the database dump: `cd cfi; ./bin/parse-mdb.sh data/CFI\ State\ Laws\ Update_Merge.mdb`

If successful, you should see the following output:

```
./bin/parse-mdb.sh data/CFI\ State\ Laws\ Update_Merge.mdb
Exporting Laws_00_IdentifierTable to CSV...
Exporting Laws_01_Defintions to CSV...
Exporting Laws_02_Contributions_1 to CSV...
Exporting Laws_02_Contributions_2 to CSV...
Exporting Laws_02_Contributions_3 to CSV...
Exporting Laws_03_Disclosure_1 to CSV...
Exporting Laws_03_Disclosure_2 to CSV...
Exporting Laws_03_Disclosure_3 to CSV...
Exporting Laws_04_PublicFinancing to CSV...
...
```

### Updating Field Descriptions

Export the field description spreadsheets as CSV files, then copy them into `data/disclosure-fields.csv` and `data/public-funding-fields.csv`.

Here's one example set of commands that matches file names when exported from Google Sheets.

```
cd cfi/data
mv ~/Downloads/Field\ Names-Descriptions\ for\ Visuals_v5.xlsx\ -\ Disclosure.csv ./disclosure-fields.csv 
mv ~/Downloads/Field\ Names-Descriptions\ for\ Visuals_v5.xlsx\ -\ Public\ Financing.csv ./public-financing-fields.csv 
mv ~/Downloads/Field\ Names-Descriptions\ for\ Visuals_v5.xlsx\ -\ Other\ Restrictions.csv ./other-restrictions-fields.csv 
```

Note: Make sure there are no empty rows in the Public Funding fields sheet. If there are empty lines in the CSV file, they should be deleted.

### Packaging Download Files

The database content as well as metadata (field descriptions and about button contents) is packaged into .zip files for download. To create these .zip files, run the following script.

```
./bin/package-downloads.sh
```

This will produce the following files inside the `downloads` folder:

 * full-database-csv.zip - Contains CSV files representing the full database.
 * metadata.zip - Contains helper files used by the visualization.
