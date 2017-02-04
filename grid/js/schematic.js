---
---
(function () {
var grid = Grid().tooltipContent(tooltipContent)
  , atlas = Atlas().tooltipContent(tooltipContent)
  , tip = d3.tip().attr('class', 'd3-tip')
  , signal = d3.dispatch(
      "update",
      "selectYear",
      "downloadCurrentLimits",
      "downloadAllLimits",
      "navigate"
    )
;

// Load the data and kick-off the visualization.
d3.queue()
  .defer(d3.csv, "../data/CSVs/Laws_02_Contributions_1.csv")
  .defer(d3.csv, "../data/CSVs/Laws_02_Contributions_2.csv")
  .defer(d3.csv, "../data/CSVs/Laws_02_Contributions_3.csv")
  .defer(d3.csv, "../data/CSVs/Laws_03_Disclosure_1.csv")
  .defer(d3.csv, "../data/CSVs/Laws_03_Disclosure_2.csv")
  .defer(d3.csv, "../data/CSVs/Laws_03_Disclosure_3.csv")
  .defer(d3.csv, "../data/CSVs/Laws_04_PublicFinancing.csv")
  .defer(d3.csv, "../data/CSVs/Laws_05_Other.csv")
  .defer(d3.json, "../data/usa.json")
    .await(visualize)
;

// Responsive
d3.select(window)
    .on("resize", function() {
        grid
            .resize()
          () // Call the grid as well
        ;
      })
;

/*
** Helper Functions
*/
function tooltipContent(d) {
    return "<span style='text-align: center;'>"
      + "<h4>" + d.State + " " + d.Year + "</h4>"
      + "<h5>" + grid.selectedColumnLabel() + "</h5>"
      + "<h4>" + grid.format()(grid.valueAccessor()(d)) + "</h4>"
      + "</span>"
    ;
}

/*
** Main Functions
*/
function visualize(error, contribs, contribs2, contribs3, disclosure1, disclosure2, disclosure3, publicFinancing, other, usa){
    if(error) throw error;

    corpus(contribs, contribs2, contribs3, disclosure1, disclosure2, disclosure3, publicFinancing, other);
    carto(usa);

    setupTabNavigation();

    // Initialize the selected year to the most recent.
    var maxYear = d3.max(grid.data(), function (d){ return d.Year; });
    signal.call("selectYear", null, maxYear);

    // Initialize the navigation state.
    var defaultSection = "contribution-limits";
    var section = getQueryVariables().section || defaultSection;

    d3.select("a[href='#" + section + "']")
      .node()
      .click()
    ;
} // visualize()

function corpus(contribs, contribs2, contribs3, disclosure1, disclosure2, disclosure3, publicFinancing, other) {
    var data = d3.nest()
            .key(function(d) {
                // Construct the identifier from these two fields,
                // because the value of d.Identifier is not reliable (sometimes "l").
                return d.State + d.Year;
            })
            .rollup(function(leaves) { return Object.assign.apply(null, leaves); })
            .map(d3.merge([contribs, contribs2, contribs3, disclosure1, disclosure2, disclosure3, publicFinancing, other]))
            .values()
    ;
    console.log(data);
    grid
        .svg(d3.select("svg#main"))
        .data(data)
        .tooltip(tip)
        .connect(signal)
      () // Call grid()
    ;

    // Signal Handling
    d3.select(".controls .checkbox input")
        .on("change", function() { grid.empty(this.checked)(); })
    ;
    d3.select(".alphabetize-states-button")
        .on("click", function() { grid.reset()(); })
    ;
    signal.on("selectYear.grid", grid.selectedYear);
    signal.on("downloadAllLimits", function (xColumn, yColumn){
        var filename = "CFI-contribution-limits-all.csv";
        var projectedData = project(data, [xColumn, yColumn].concat(columnsRaw));
        downloadCSV(projectedData, filename);
    });
    signal.on("downloadCurrentLimits", function (xColumn, yColumn, selectedColumn){
        var filename = "CFI-contribution-limits-" + selectedColumn + ".csv";
        var projectedData = project(data, [xColumn, yColumn, selectedColumn]);
        downloadCSV(projectedData, filename);
    });

    // Set the URL history to the current section.
    signal.on("navigate.history", function (section) {
        history.pushState(null, null, '?section=' + section);
    });

    // Update the visualization according to the current section.
    signal.on("navigate.vis", function (section) {

        // Clear out the data-driven form controls.
        // d3.select("#controls-form").selectAll("*").remove();

        // Initialize the section navigated to.
        switch(section) {
            case "contribution-limits":
                initContributionLimitsSection(data);
                break;
            case "disclosure":
                initDisclosuresSection(data);
                break;
            case "public-financing":
                initPublicFinancingSection(data);
                break;
            case "other-restrictions":
                initOtherRestrictionsSection(data);
                break;
            default:
                console.log("Unknown section name \"" + section + "\"");
        }
    });

} // corpus()


function carto (usa){
    d3.select("svg#map")
        .datum(usa)
        .call(atlas.tooltip(tip))
    ;
    signal.on("selectYear.atlas", atlas.selectedYear);
    signal.on("update", atlas.update);
} // carto()


// Helper Utility Functions
function identity(d) { return d; }

// Capture URL query param
function getQueryVariables() {
    var vars = {}
      , query = window.location.search.substring(1).toLowerCase().split("&")
      , arg // loop variable

    ;
    query.forEach(function(q) {
        arg = q.split("=");
        if(arg[0].length && arg[1].length)
            vars[arg[0]] = decodeURIComponent(arg[1]);
      })
    ;
    return vars;
} // getQueryVariables()

function liquidToArray(str) {
    return str
      .split(',')
      .filter(identity)
    ;
} // liquidToArray()

function liquidToMap(str) {
    return new Map(liquidToArray(str)
        .map(function(d) { return d.split(': '); })
      )
    ;
} // liquidToMap()

// Causes the given data to be downloaded as a CSV file with the given name.
// Draws from
// http://stackoverflow.com/questions/12676649/javascript-programmatically-trigger-file-download-in-firefox
function downloadCSV(data, filename) {
    var csvStr = toCSV(data);
    var dataURL = "data:text," + encodeURIComponent(csvStr);
    var link = document.createElement("a");
    document.body.appendChild(link);
    link.setAttribute("href", dataURL);
    link.setAttribute("download", filename);
    link.click();
} // downloadCSV()

// Performs a projection on the data, isolating the specified columns.
// Term from relational algebra. See also
// https://en.wikipedia.org/wiki/Projection_(relational_algebra)
function project(data, columns) {
    return data.map(function (fullRow) {
        return columns.reduce(function (projectedRow, column) {
            projectedRow[column] = fullRow[column];
            return projectedRow;
        }, {});
    });
} // project()

function setupTabNavigation() {
    d3.select(".nav").selectAll("li a")
        .on("click", function (d){
            signal.call("navigate", null, this.href.split('#')[1]);
        })
    ;
} // setupTabNavigation()

function initContributionLimitsSection(data) {
  // {% for section in site.data.sections %}
  //   {% if section[0] == 'contribution-limits' %}
  //     {% for legend in section[1].legends %}
  //       {% capture bins %}{% for item in legend[1] %}{% unless forloop.last %}{{ item.max }}{% endunless %},{% endfor %}{% endcapture %}
  //       {% capture colors %}{% for item in legend[1] %}{{ item.color }},{% endfor %}{% endcapture %}
  //     {% endfor %}
  //     {% capture abbrs %}{% for group in section[1].controls %}{% for dropdown in group.dropdowns %}{% for option in dropdown.options %}{% if option.abbr %}{{ option.abbr }}: {{ option.text }},{% endif %}{% endfor %}{% endfor %}{% endfor %}{% endcapture %}
  //   {% endif %}
  // {% endfor %}
    var bins = liquidToArray("{{ bins | strip }}")
        .map(function(d) { return +d + 1; })
      , colors = liquidToArray('{{ colors | strip }}')
    ;
    var colorScale = d3.scaleThreshold()
          .domain(bins)
          .range(colors)
      , query = {}
      , abbrs = liquidToMap("{{ abbrs | strip }}")
    ;
    d3.selectAll("#contribution-limits select")
        .each(function(d) {
            d3.select(this).select("optgroup").selectAll("option")
                .attr("selected", function(d, i) {
                    return !i ? "selected" : null;
                  })
            ;
            var key = this.id.split("chooser-")[1];
            query[key] = this.value;
          })
        .on("change", function() {
            if(this.id === "chooser-donor")
                // State Party cannot donate to local party, so disable those
                disablePartyAsRecipient(this.value === "StateP");

            query[this.id.split("chooser-")[1]] = this.value;
            grid
                .selectedColumn(querify(), true)
                .selectedColumnLabel(labelify())
              () // call grid()
            ;
          })
    ;
    grid
        .colorScale(colorScale)
        .selectedColumn(querify())
        .selectedColumnLabel(labelify())
      () // Call grid()
    ;

    function querify() {
        var col = query["donor"] + "To" + query["recipient"] + "Limit"
          , branch = !d3.map(data[0]).has([col + "_Max"])
        ;
        d3.select("#chooser-recipient-branch")
            .attr("disabled", !branch || null)
            .property("value", !branch ? "" : query["recipient-branch"])
        ;
        return col + (branch ? "_" + query["recipient-branch"] : "") + "_Max";
    } // querify()

    function labelify() {
        var col = query["donor"] + "To" + query["recipient"] + "Limit"
          , branch = !d3.map(data[0]).has([col + "_Max"])
        var label = [
          abbreviate(query["donor"])
          , " to "
          , abbreviate(query["recipient"])
          , branch ? (" (" + abbreviate(query["recipient-branch"]) + ")") : ""
        ].join("");
        return label;
    } // labelify()

    function abbreviate(str) {
        return abbrs.get(str) || str;
    } // abbreviate()
    function disablePartyAsRecipient(bool) {
        d3.select("#chooser-recipient").select("option[value='Party']")
            .property("disabled", bool)
            .style("visibility", bool ? "hidden" : "visible")
        ;
    } // disablePartyAsRecipient()
} // initContributionLimitsSection()

// Set up the form with controls for choosing fields.
// This is used in all tabs other than Contribution Limits.
function initSection(section, fields, getColorScale){
    // Initialize the controls form DOM skeleton.
    var dropdown = d3.select("#" + section).select("select")
        .on("change", function() {
            var i = this.value;
            updateSelectedField(i);
          })
    ;
    // Initialize the content by selecting the first field in the list.
    updateSelectedField(dropdown.node().value);

    function updateSelectedField(d){
        // Update the description displayed for the selected field.
        d3.selectAll(".field-description")
            .style("display", function() {
                return d.toLowerCase() == this.id ? null : "none";
              })
        ;
        // Pass the selected field into the visualizations.
        grid
            .selectedColumn(d)
            .selectedColumnLabel(d["Short Label"])
            .colorScale(getColorScale(d))
          () // call grid()
        ;
    } // updateSelectedField()

} // initSection()

function initDisclosuresSection(data) {
  // {% for section in site.data.sections %}
  //   {% if section[0] == 'disclosure' %}
  //     {% for legend in section[1].legends %}
  //       {% if legend[0] == 'smallmoney' %}
  //         {% capture smallbins %}{% for item in legend[1] %}{% unless forloop.last %}{{ item.max }}{% endunless %},{% endfor %}{% endcapture %}
  //         {% capture smallcolors %}{% for item in legend[1] %}{{ item.color }},{% endfor %}{% endcapture %}
  //       {% elsif legend[0] == 'bigmoney' %}
  //         {% capture bigbins %}{% for item in legend[1] %}{% unless forloop.last %}{{ item.max }}{% endunless %},{% endfor %}{% endcapture %}
  //         {% capture bigcolors %}{% for item in legend[1] %}{{ item.color }},{% endfor %}{% endcapture %}
  //       {% else %}
  //         {% capture yesnobins %}{% for item in legend[1] %}{% unless forloop.last %}{{ item.label }}{% endunless %},{% endfor %}{% endcapture %}
  //         {% capture yesnocolors %}{% for item in legend[1] %}{{ item.color }},{% endfor %}{% endcapture %}
  //       {% endif %}
  //     {% endfor %}
  //   {% endif %}
  // {% endfor %}
    var colorScale = {
              small: d3.scaleThreshold()
                        .domain(liquidToArray('{{ smallbins }}'))
                        .range(liquidToArray('{{ smallcolors }}'))
            , big: d3.scaleThreshold()
                        .domain(liquidToArray('{{ bigbins }}'))
                        .range(liquidToArray('{{ bigcolors }}'))
            , yesno: d3.scaleOrdinal()
                        .domain(liquidToArray('{{ yesnobins }}'))
                        .range(liquidToArray('{{ yesnocolors }}'))
          }
    ;
    function getColorScale(d){
        return d["Value Type"] === "Dollar Amount"
            ? (~d["Field Name"].indexOf("DonorExemption")
                ? colorScale.small
                : colorScale.big
              )
            : colorScale.yesno
        ;
    } // getColorScale()

    fetchDisclosureFields(function(fields) {
        initSection('disclosure', fields, getColorScale);
    });
} // initDisclosuresSection()

function initPublicFinancingSection(data) {

    function getColorScale(d){
        var selectedColumn = d["Field Name"];
        var colorScale;

        // Custom color scale for "Public Funds for State Parties?" (PublicFunding_P)
        if(selectedColumn === "PublicFunding_P"){
            colorScale = d3.scaleOrdinal()
                .domain([
                  "No"
                  , "Changed mid-cycle"
                  , "Yes"
                  , "Missing Data"
                ])
                .range([
                  "#053061" // No - dark blue
                  , "#2166ac" // Changed mid-cycle - medium blue
                  , "#4393c3" // Yes - light blue
                  , "gray" // Missing Data - gray
                  , "#d95f02" // More colors for unanticipated values
                  , "#7570b3"
                  , "#e7298a"
                ])
            ;
        } else if(selectedColumn === "RefundOrTaxCreditOrTaxDeduction"){
            colorScale = d3.scaleOrdinal()
                .domain([
                  "Missing Data"
                  , "None"
                ])
                .range([
                  "gray" // Missing Data - gray
                  , "gray" // None - gray
                  , "#053061" // dark blue
                  , "#2166ac" // medium blue
                  , "#4393c3" // light blue
                  , "#d95f02" // More colors for unanticipated values
                  , "#7570b3"
                  , "#e7298a"
                ])
            ;
        } else {
            colorScale = d3.scaleOrdinal()
                .domain([
                  "Missing Data"
                  , "Partial Grant"
                  , "Matching Funds"
                  , "Full Public Financing"
                ])
                .range([
                  "gray" // Missing Data - gray
                  , "#053061" // Partial Grant - dark blue
                  , "#2166ac" // Matching Funds - medium blue
                  , "#4393c3" // Full Public Financing - light blue
                  , "#d95f02" // More colors for unanticipated values
                  , "#7570b3"
                  , "#e7298a"
                ])
            ;
        }
        return colorScale;
    }

    fetchPublicFinancingFields(function(fields) {
        initSection('public-financing', fields, getColorScale);
    });
} // initPublicFinancingSection()

function initOtherRestrictionsSection(data) {

    function getColorScale(d){
        var colorScale = d3.scaleOrdinal()
                .domain([
                  "No"
                  , "Changed mid-cycle"
                  , "Yes"
                  , "Missing Data"
                ])
                .range([
                  "#053061" // No - dark blue
                  , "#2166ac" // Changed mid-cycle - medium blue
                  , "#4393c3" // Yes - light blue
                  , "gray" // Missing Data - gray
                  , "#d95f02" // More colors for unanticipated values
                  , "#7570b3"
                  , "#e7298a"
                ])
            ;
        return colorScale;
    }

    fetchOtherRestrictionsFields(function(fields) {
        initSection('other-restrictions', fields, getColorScale);
    });
} // initOtherRestrictionsSection()

// Fetch and cache the CSV file at the given path.
var fetchFields = function (csvPath){
    var cachedData;
    return function(callback) {
        if(cachedData) {
            callback(cachedData);
        } else {
            d3.csv(csvPath, function(data) {
                cachedData = data;
                callback(cachedData);
            });
        }
    };
};

var fetchDisclosureFields = fetchFields("../data/disclosure-fields.csv");
var fetchPublicFinancingFields = fetchFields("../data/public-financing-fields.csv");
var fetchOtherRestrictionsFields = fetchFields("../data/other-restrictions-fields.csv");

}());
