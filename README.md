# CFI WebTool

An interactive visualization of the [Campaign Finance Institute](http://www.cfinst.org/) database of campaign finance law, spanning all US States and every other year since 1996. Crafted and engineered by Seemant Kulleen and Curran Kelleher.

[Try it out!](https://cfinst.github.io/)

[![image](https://user-images.githubusercontent.com/68416/27076632-657cbb56-504b-11e7-9c91-07dc3e13b503.png)](https://cfinst.github.io/)

## Table of Contents

 * [Development Environment](#development-environment)
 * [Configuration](#configuration)
 * [Updating Data](#updating-data)
 * [Licensing](#licensing)

## Development Environment

This section describes how to get your development environment set up and run this site on your own computer.

This site is organized using [Jekyll](https://jekyllrb.com/). Jekyll runs automatically on [GitHub Pages](https://pages.github.com/), which is the main deployment strategy at the moment.

To run this site on your own machine, you'll need a working [Ruby](https://www.ruby-lang.org/en/documentation/installation/) environment. (For windows, you can download and run [RubyInstaller for Windows](https://rubyinstaller.org/).  For Linux or Mac you can use [rvm](http://rvm.io)). Then use the following commands:

```
# Install Jekyll on your machine (only required once).
gem install jekyll

# Use Jekyll to serve this site.
cd cfinst.github.io
jekyll serve --watch
```

Now the site should be available at [http://localhost:4000/](http://localhost:4000/).

## Configuration

This section is about how to configure various aspects of the visualization and user interface.

This project uses Jekyll to build the static site, which resides under `_site`. The content there is generated automatically by Jekyll based on source code files and configuration files in [YAML](https://en.wikipedia.org/wiki/YAML) and [Markdown](https://en.wikipedia.org/wiki/Markdown) formats. These configuration files define many aspects of the visualization and user interface.

The following files are configuration files:

```
_config.yml
_data
├── buttons.yml
├── colors.yml
├── sections
│   ├── contribution-limits
│   │   ├── controls.yml
│   │   └── legends.yml
│   ├── disclosure
│   │   ├── controls.yml
│   │   └── legends.yml
│   ├── other-restrictions
│   │   ├── controls.yml
│   │   └── legends.yml
│   └── public-financing
│       ├── controls.yml
│       └── legends.yml
└── tabs.yml
index.md
_modals
├── intro.md
├── contribution-limits
│   ├── about.md
│   └── howto.md
├── disclosure
│   ├── about.md
│   └── howto.md
├── other-restrictions
│   ├── about.md
│   └── howto.md
└── public-financing
    ├── about.md
    └── howto.md
_sass
├── _tips.scss
└── _vis.scss
```

### Configuration Parameters

```
_config.yml
```

This file configures the top-level Jekyll site. The following parameters are relevant to the visualization:

 * `filterYear` This defines the year beyond which data will be filtered out. For example, a configuration of `filterYear: 2016` means that 2016 data (and data for all following years e.g. 2017, 2018) are filtered out and not included in the visualization.

 * `backgroundRectFadeOpacity` The opacity of the background rectangle overlay used with linked hover interactions. A value of 1 means the background will fade completely to white, and a value of 0 means that there will be no fade at all on hover.
 * `yearSelectLabel` The text shown as the label for the year select dropdown at the bottom of the map.

```
_data/buttons.yml
```

This file configures the text shown in the buttons along the right side. Each button has the following configuration options:

 * `name` A unique id for the button. Please do not change these values unless you also change the JavaScript code that references them.
 * `text` The text shown within the button.
 * `icon` The [Font Awesome Icon Name](http://fontawesome.io/icons/) for the icon to show withn the button (optional).
 * `link` The URL that this button links to.

```
_data/colors.yml
```

This file defines the color palette hex values. Each color entry has the following parameters:

 * `name` The name of the color within the palette, referenced from within legend configurations in `_data/sections/.../legends.yml`. Please do not change this unless you also update all references to it from all legend configurations.
 * `hex` The hex color value.

```
_data/tabs.yml
```

This file describes the visualization tabs. Each entry corresponds to a tab, and has the following parameters:

 * `title` The text shown in the tab on the page.
 * `section` The unique identifier for this tab. This value is used in the URLs, as folder names under `_data/sections`, and elsewhere. Please do not change this unless you also update all references to it from JavaScript and rename the corresponding folder under `_data/sections`.
 * `fields` This is unique to the Contribution Limits tab, and enumerates the fields to make available.

```
_data/sections
 ├── contribution-limits
 │   ├── controls.yml
 │   └── legends.yml
 ├── disclosure
 │   ├── controls.yml
 │   └── legends.yml
 ├── other-restrictions
 │   ├── controls.yml
 │   └── legends.yml
 └── public-financing
     ├── controls.yml
     └── legends.yml
```

This directory contains the configurations for controls and legend for each section.

```
_data/sections/:section/controls.yml
```

Within each section, the `controls.yml` file defines the content of the dropdown menu(s) available.

For sections other than Contribution Limits, each entry corresponds to an option in the dropdown menu of questions. Each entry has the following parameters:


 * `name` The field name in the database. This must match with the database.
 * `legend` The legend to use for this question, referencing the `name` of the legend entries defined in `legends.yml` for this section.
 * `question` The text description of the question, displayed in the "description" box below the dropdown.
 * `label` The short text description of the question, displayed as an option within the dropdown.
 * `note` (optional) Any additional notes for this question. This is displayed "below the fold" within the "description" box.

```
_data/sections/contribution-limits/controls.yml
```

For the `contribution-limits` section, dropdown configuration is structured differently from the others. Here, there are two groups of dropdowns, `donor` and `recipient`. Within those groups, dropdown entries are configured with the following parameters:

 * `id` The unique identifier for the dropdown. Please do not change this without also updating all references to it.
 * `label` The text shown as the label for the dropdown.
 * `options` The listing of options within the dropdown. Each option entry has the following parameters:
   * `label` The text shown as the dropdown option.
   * `abbr` The field name fragment corresponding to this option. This must match with the fields present in the database (please do not change without also updating the database field names).
   * `disable` (optional) The `id` of another dropdown that should be disabled when this option is selected.

```
_data/sections/:section/legends.yml
```

Within each section, the `legends.yml` file defines the set of color scales available. Each question maps onto one of these entries. Each entry defines a color scale that drives the color legend, with the following parameters:

 * `name` The unique identifier for this legend. This is referenced from within the `controls.yml` configuration to assign a legend to each question. Please do not change this without also updating all references to it.
 * `type` The scale type to use. The value must be either `threshold`, `ordinal`, or `singular`.
 * `fallback` The value to use when an empty cell is present in the data. For example, this can map empty cells to a meaningful value of `-Infinity`.
 * `scale` The scale entries.
   * If `type` is `threshold`, each scale entry defines an interval of values, and has the following parameters:
     * `min` The minimum value for this interval.
     * `max` The maximum value for this interval.
     * `label` The text to display in the legend and tooltips for this interval.
     * `color` The name of the color, referencing named colors defined in `_data/colors.yml`.
   * If `type` is `ordinal`, each scale entry has the following parameters:
     * `label` The text to display in the legend and tooltips for this interval. This must match with data values from the database.
     * `color` The name of the color, referencing named colors defined in `_data/colors.yml`.

```
index.md
```

This file contains two parameters:

 * `title` Allows you to configure the title of the Web page that appears in the browser tab.
 * `layout` Specifies which Jekyll layout to use at the top-level.

```
_modals
├── intro.md
├── contribution-limits
│   ├── about.md
│   └── howto.md
├── disclosure
│   ├── about.md
│   └── howto.md
├── other-restrictions
│   ├── about.md
│   └── howto.md
└── public-financing
    ├── about.md
    └── howto.md
```

The `_modals` directory contains configuration files that define what gets shown within the modal dialogs that pop up when the page loads, and when you click on the "About this topic" and "Using this page" buttons.

```
_modals/intro.md
```
This file specifies the content of the introduction popup that appears the first time a user loads the page.

```
_modals/:section/about.md
```

This file specifies the content of the "About this topic" modal dialog for each section. Its Markdown body text is used as the content of the dialog, passed through a Markdown parser. Its YAML frontmatter defines the following parameters:

 * `layout` The Jekyll layout to use for the modal HTML structure.
 * `modal` The unique identifier for this modal. Please do not change this without updating all references to it.
 * `title` The text displayed as the title of this modal.

```
_modals/:section/howto.md
```

This file specifies the content of the "Using this page" modal dialog for each section. Its Markdown body text is used as the content of the dialog, passed through a Markdown parser. Its YAML frontmatter defines the same parameters as in `about.md`.

```
_sass/_tips.scss
```

This CSS defines a custom appearance of the tooltips that appear when you hover over the map or the grid. Draws from examples of [d3-tip](https://github.com/Caged/d3-tip).

```
_sass/_vis.scss
```

This CSS defines styles applied to the visualization. This is where details such as stroke color, cursors, font styles, margins, and transition durations are defined.

```
_includes/footer.html
```

This file contains the footer content.

## Updating Data

This section is about how you can update the data shown in the visualization based on the original CFI Microsoft Access database file.

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

## Licensing

The source code is released under the GPL3 license ([LICENSE](LICENSE)).

The data driving the visualizations (found under [data/CSVs](data/CSVs)) is released under the [Creative Commons Attribution 4.0 International license](https://creativecommons.org/licenses/by/4.0/legalcode) ([data/CSVs/LICENSE](data/CSVs/LICENSE)). This means that you are free to use the data for any purpose, as long as you add attribution citing Campaign Finance Institute as the source of the data.
