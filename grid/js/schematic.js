(function () {
var requested_columns = [
        "IndividualToCandLimit_H_Max"
          , "IndividualToCandLimit_S_Max"
          , "IndividualToCandLimit_G_Max"
          , "PACToCandLimit_H_Max"
          , "PACToCandLimit_S_Max"
          , "PACToCandLimit_G_Max"
          , "CorpToCandLimit_H_Max"
          , "CorpToCandLimit_S_Max"
          , "CorpToCandLimit_G_Max"
          , "LaborToCandLimit_H_Max"
          , "LaborToCandLimit_S_Max"
          , "LaborToCandLimit_G_Max"
          , "IndividualToPartyLimit_Max"
          , "CorpToPartyLimit_Max"
          , "LaborToPartyLimit_Max"
          , "IndividualToPACLimit_Max"
          , "CorpToPACLimit_Max"
          , "LaborToPACLimit_Max"
      ]
  , query = { donor: false, recipient: false, branch: false }
;
var grid = Grid()
  , atlas = Atlas()
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
  .defer(d3.csv, "../data/CSVs/Laws_03_Disclosure_1.csv")
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
function visualize(error, contribs, contribs2, disclosure1, usa){

    corpus(error, contribs, contribs2, disclosure1);
    carto(error, usa);

    setupTabNavigation();

    // Initialize the selected year to the most recent.
    var maxYear = d3.max(grid.data(), function (d){ return d.Year; });
    signal.call("selectYear", null, maxYear);

    // Initialize the navigation state.
    var defaultSection = "contributions";
    var section = getQueryVariables().section || defaultSection;
    signal.call("navigate", null, section);
}

function corpus(error, contribs, contribs2, disclosure1) {
    var data = d3.nest()
            .key(function(d) { return d.Identifier; })
            .rollup(function(leaves) { return Object.assign.apply(null, leaves); })
            .map(d3.merge([contribs, contribs2, disclosure1]))
            .values()
      , columnsRaw = d3.keys(data[0])
            .filter(function(c) { return c.endsWith("_Max"); })
            .filter(function(c) { return ~requested_columns.indexOf(c); })
      , columns = columnsRaw
            .map(function(c) {
                var ret = c
                        .split("Limit_Max")[0]
                        .split("_Max")[0]
                        .split("To")
                  , receiver = ret[1].split("Limit_")
                ;
                return [ret[0], receiver[0], receiver[1]];
              })
    ;

    grid
        .svg(d3.select("svg#main"))
        .data(data)
        .tooltip(tip)
        .connect(signal)
      () // Call grid()
    ;
    d3.select("#query-string")
        .text(grid.selectedColumn())
    ;

    // Signal Handling
    d3.select(".controls .checkbox input")
        .on("change", function() { grid.empty(this.checked)(); })
    ;
    d3.select(".controls button")
        .on("click", function() { grid.reset()(); atlas.reset(); })
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
        d3.select("#meta-controls-top").selectAll("*").remove();

        // Initialize the section navigated to.
        switch(section) {
            case "contributions":
                initContributionLimitsSection(data, columns);
                break;
            case "disclosure":
                initDisclosuresSection(data);
                break;
            default:
                console.log("Unknown section name \"" + section + "\"");
        }
    });

} // corpus()


function carto (error, usa){
    if(error) throw error;
    d3.select("svg#map")
        .datum(usa)
        .call(atlas.tooltip(tip))
    ;
    signal.on("selectYear.atlas", atlas.selectedYear);
    signal.on("update", atlas.update);
} // carto()


// Helper Utility Functions
function identity(d) { return d; }

// Causes the given data to be downloaded as a CSV file with the given name.
// Draws from http://stackoverflow.com/questions/12676649/javascript-programmatically-trigger-file-download-in-firefox
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

    var data = [
      { title: "Contribution Limits", section: "contributions" },
      { title: "Disclosure Law", section: "disclosure" },
      { title: "Public Funding", section: "public-funding" },
    ];

    var navTabs = d3.select(".nav-tabs");

    // Scaffold the tabs DOM structure.
    navTabs
      .selectAll("li").data(data)
      .enter()
      .append("li")
      .append("a")
        .attr("href", "#") // Make it look clickable.
        .text(function (d){ return d.title; })
        .on("click", function (d){
            d3.event.preventDefault(); // Prevent href navigating to "/#"
            signal.call("navigate", null, d.section);
        })
    ;

    // Update the "active" tab.
    signal.on("navigate.active", function (section) {
        navTabs.selectAll("li")
            .classed("active", function (d) { return d.section === section; })
        ;
    });
}

function initContributionLimitsSection(data, columns) {
    var chooserGroup = d3.select("#meta-controls-top")
      .append("form")
        .attr("class", "form-horizontal")
      .selectAll("div")
        .data(d3.keys(query), identity)
      .enter().append("div")
        .attr("class", "form-group")
    ;

    chooserGroup.append("label")
        .attr("class", "col-sm-2 control-label")
        .text(function (d) {
            return d[0].toUpperCase() + d.substr(1);
        })
    ;

    chooserGroup
      .append("div")
        .attr("class", "col-sm-10")
      .append("select")
        .attr("class", "chooser form-control")
        .attr("id", function(d) { return "chooser-" + d; })
        .on("change", function() {
            query[this.id.split("chooser-")[1]] = this.value;
            grid
                .selectedColumn(querify())
              () // call grid()
            ;
          })
        .each(function(d, i) {
            var opts = d3.set(
                    columns
                      .map(function(c) { return c[i]; })
                      .filter(identity)
                  )
                .values()
            ;
            d3.select(this)
              .append("optgroup")
                .attr("label", "Select a " + d)
              .selectAll("option")
                .data(opts, identity)
              .enter().append("option")
                .attr("value", identity)
                .text(identity)
            ;
        })
    ;
    d3.selectAll("form select")
        .each(function() {
            var key = this.id.split("-")[1];
            query[key] = this.value;
          })
    ;

    grid
        .selectedColumn(querify())
      () // Call grid()

    function querify() {
        var col = query.donor + "To" + query.recipient + "Limit"
          , branch = !d3.map(data[0]).has([col + "_Max"])
        ;
        d3.select("#chooser-branch")
            .attr("disabled", !branch || null)
            .property("value", !branch ? "" : query.branch)
        ;
        return col + (branch ? "_" + query.branch : "") + "_Max";
    } // querify()
} // initContributionLimitsSection()

// Capture URL query param
function getQueryVariables() {
    var inits = {}
      , query = window.location.search.substring(1).toLowerCase().split("&")
      , arg // loop variable

    ;
    query.forEach(function(q) {
        arg = q.split("=");
        if(arg[0].length && arg[1].length)
            inits[arg[0]] = decodeURIComponent(arg[1]);
      })
    ;
    return inits;
} // getQueryVariables()

function initDisclosuresSection(data) {
    fetchDisclosureFields(function(disclosureFields) {

        var form = d3.select("#meta-controls-top")
          .append("form")
            .attr("class", "form-horizontal");

        var chooserGroup = form.append("div")
            .attr("class", "form-group")
        ;
        chooserGroup.append("label")
            .attr("class", "col-sm-2 control-label")
            .text("Question")
        ;

        var descriptionGroup = form.append("div")
            .attr("class", "form-group")
        ;
        descriptionGroup.append("label")
            .attr("class", "col-sm-2 control-label")
            .text("Description")
        ;
        var descriptionContainer = descriptionGroup
          .append("div")
            .attr("class", "col-sm-10")
          .append("p")
        ;

        chooserGroup
          .append("div")
            .attr("class", "col-sm-10")
          .append("select")
            .attr("class", "chooser form-control")
            .on("change", function() {
                updateSelectedField(disclosureFields[this.value]);
              })
            .selectAll("option")
              .data(disclosureFields)
            .enter().append("option")
              .attr("value", function(d, i) { return i; })
              .text(function(d) { return d["Short Label"]; })
        ;

        function updateSelectedField(d){
            descriptionContainer.text(d["Question on Data Entry Form"]);
            grid
                .selectedColumn(d["Field Name"])
              () // call grid()
            ;
        }

        // Initialize the content to the first field.
        updateSelectedField(disclosureFields[0]);
    });
} // initDisclosuresSection()

// Cache fetched fields
var fetchDisclosureFields = (function (){
    var disclosureFields;
    return function(callback) {
        if(disclosureFields) {
            callback(disclosureFields);
        } else {
            d3.csv("../data/disclosure-fields.csv", function(data) {
                disclosureFields = data;
                callback(disclosureFields);
            });
        }
    };
}());

}());
