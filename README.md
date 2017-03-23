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
cd cfinst.github.io
jekyll serve --watch
```

Now the site should be available at [http://localhost:4000/](http://localhost:4000/).

## Data Update Instructions

### Updating from Access Database

The following instructions are for updating the data used by this software from a new database dump from the original Microsoft Access database. After following these steps, the software will use the updated data.

1. Download database dump file, e.g. `CFI State Laws Update_Merge.zip`. This will likely end up in your `~/Downloads` folder (on Linux / Mac).
2. Move the file into the data directory of this repository: `cd cfinst.github.io/data; mv ~/Downloads/CFI\ State\ Laws\ Update_Merge.zip .`
3. Unzip the file `unzip CFI\ State\ Laws\ Update_Merge.zip`
4. Install [mdbtools](https://github.com/brianb/mdbtools). In Ubuntu Linux, these can be installed with the command `sudo apt-get install mdbtools`.
4. Run the shell script that generates the CSV files from the database dump: `cd cfints.github.io; ./bin/parse-mdb.sh data/CFI\ State\ Laws\ Update_Merge.mdb`

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

Field descriptions live inside the Jekyll configurations, under `_data/sections/<section>/controls.yml`. These files are automatically converted to .CSV files when you run `./bin/package-downloads.sh`.

### Packaging Download Files

The database content as well as metadata (field descriptions and about button contents) is packaged into a .zip file for download. To create this .zip file, run the following script:

```
./bin/package-downloads.sh
```

You should see output similar to the following:

```
$ ./bin/package-downloads.sh
Configuration file: /home/curran/repos/cfi/_config.yml
            Source: /home/curran/repos/cfi
       Destination: /home/curran/repos/cfi/_site
 Incremental build: disabled. Enable with --incremental
      Generating... 
                    done in 0.133 seconds.
 Auto-regeneration: disabled. Use --watch to enable.

Creating cfi-laws-database.zip
updating: cfi-laws-database/ (stored 0%)
updating: cfi-laws-database/LICENSE (deflated 68%)
updating: cfi-laws-database/metadata/ (stored 0%)
updating: cfi-laws-database/metadata/other-restrictions-fields.csv (deflated 61%)
updating: cfi-laws-database/metadata/disclosure-fields.csv (deflated 70%)
updating: cfi-laws-database/metadata/public-financing-fields.csv (deflated 59%)
updating: cfi-laws-database/data/ (stored 0%)
updating: cfi-laws-database/data/Laws_03_Disclosure_3.csv (deflated 94%)
updating: cfi-laws-database/data/Laws_05_Other.csv (deflated 93%)
updating: cfi-laws-database/data/Laws_03_Disclosure_1.csv (deflated 96%)
updating: cfi-laws-database/data/Laws_02_Contributions_1.csv (deflated 95%)
updating: cfi-laws-database/data/Laws_00_IdentifierTable.csv (deflated 76%)
updating: cfi-laws-database/data/Laws_03_Disclosure_2.csv (deflated 92%)
updating: cfi-laws-database/data/Laws_02_Contributions_3.csv (deflated 93%)
updating: cfi-laws-database/data/Laws_04_PublicFinancing.csv (deflated 93%)
updating: cfi-laws-database/data/Laws_01_Defintions.csv (deflated 95%)
updating: cfi-laws-database/data/Laws_02_Contributions_2.csv (deflated 96%)
```

This will produce the `cfi-laws-database.zip` file inside the `downloads` directory, which will contain *both* the database tables and the metadata (field description) tables. The .zip archive will have the following layout:

```
├── cfi-laws-database
    ├── LICENSE
    ├── data
    │   ├── Laws_00_IdentifierTable.csv
    │   ├── Laws_01_Defintions.csv
    │   ├── Laws_02_Contributions_1.csv
    │   ├── Laws_02_Contributions_2.csv
    │   ├── Laws_02_Contributions_3.csv
    │   ├── Laws_03_Disclosure_1.csv
    │   ├── Laws_03_Disclosure_2.csv
    │   ├── Laws_03_Disclosure_3.csv
    │   ├── Laws_04_PublicFinancing.csv
    │   └── Laws_05_Other.csv
    └── metadata
        ├── disclosure-fields.csv
        ├── other-restrictions-fields.csv
        └── public-financing-fields.csv
```
