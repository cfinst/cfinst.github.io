# CFI WebTool

This repository contains the source code of the [Campaign Finance Institute](http://www.cfinst.org/) data exploration and download tool.

[Try it out!](https://cfinst.github.io/)

[![image](https://cloud.githubusercontent.com/assets/68416/22932623/8e465200-f2ee-11e6-8c06-e9040a6476ae.png)](https://cfinst.github.io/).

## Licensing

The source code is released under the GPL3 license ([LICENSE](LICENSE)).

The data driving the visualizations (found under [data/CSVs](data/CSVs)) is released under the [Creative Commons Attribution 4.0 International license](https://creativecommons.org/licenses/by/4.0/legalcode) ([data/CSVs/LICENSE](data/CSVs/LICENSE)). This means that you are free to use the data for any purpose, as long as you add attribution citing Campaign Finance Institute as the source of the data.

## Running this Site

This site is organized using [Jekyll](https://jekyllrb.com/). Jekyll runs automatically on [GitHub Pages](https://pages.github.com/), which is the main deployment strategy at the moment.

To run this site on your own machine, you'll need a working [Ruby](https://www.ruby-lang.org/en/documentation/installation/) environment. (For windows, you can download and run [RubyInstaller for Windows](https://rubyinstaller.org/).  For Linux or Macm you can use [rvm](http://rvm.io)). Then use the following commands:

```
# Install Jekyll on your machine (only required once).
gem install jekyll

# Use Jekyll to serve this site.
cd cfi
jekyll serve --watch
```

Now the site should be available at [http://localhost:4000/](http://localhost:4000/).

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

You should see output similar to the following:

```
Creating full-database-csv.zip
  adding: full-database-csv/ (stored 0%)
  adding: full-database-csv/Laws_03_Disclosure_3.csv (deflated 94%)
  adding: full-database-csv/Laws_05_Other.csv (deflated 94%)
  adding: full-database-csv/Laws_03_Disclosure_1.csv (deflated 96%)
  adding: full-database-csv/Laws_02_Contributions_1.csv (deflated 96%)
  adding: full-database-csv/Laws_00_IdentifierTable.csv (deflated 76%)
  adding: full-database-csv/Laws_03_Disclosure_2.csv (deflated 91%)
  adding: full-database-csv/Laws_02_Contributions_3.csv (deflated 94%)
  adding: full-database-csv/Laws_04_PublicFinancing.csv (deflated 93%)
  adding: full-database-csv/Laws_01_Defintions.csv (deflated 95%)
  adding: full-database-csv/Laws_02_Contributions_2.csv (deflated 96%)

Creating metadata.zip
  adding: metadata/ (stored 0%)
  adding: metadata/about-buttons.csv (deflated 76%)
  adding: metadata/other-restrictions-fields.csv (deflated 60%)
  adding: metadata/disclosure-fields.csv (deflated 70%)
  adding: metadata/public-financing-fields.csv (deflated 58%)
```

This will produce the following files inside the `downloads` folder:

 * full-database-csv.zip - Contains CSV files representing the full database.
 * metadata.zip - Contains helper files used by the visualization.
