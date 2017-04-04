This directory contains the full Historical Database of State Campaign Finance Laws, curated and maintained by [the Campaign Finance Institute](http://cfinst.org/). The data files here power the [interactive visualization of this database](https://cfinst.github.io/).

The database tables are included here in .csv format. At the top level, you'll find `Laws_00_IdentifierTable.csv` and `Laws_01_Defintions.csv`. The identifier table defines the overall structure of the database, all US states with biannual data going back to 1996. This table may be useful for importing the data into a relational database. The definitions table contains full text descriptions for each field.

At the top level directory, you'll also find files that start with `CFI_StateLaws_`. These files are the original codebooks that contain full, unabridged descriptions for each database field.

Each category of campaign finance law has its own subdirectory here:

 * contribution-limits
 * disclosure
 * public-financing
 * other-restrictions

Within each of these directories, you'll find the .csv files from the database pertaining to each category. These correspond with the tabs in the interactive visualization. In addition to database files, you'll also see metadata files `about.md`, `howto.md`, and `field-descriptions.csv`. The `.md` files contain human readable descriptions for each category. the `field-descriptions.csv` files contain descriptions for each column of the database files in each directory. Note that contribution-limits does not contain a `field-descriptions.csv` file, as it follows a more complex naming convention describing donors, recipients, and branches of government.

The data here is released under the license defined in the `LICENSE` file.
