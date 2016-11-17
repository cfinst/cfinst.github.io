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
  , data_files = ["Laws_02_Contributions_1", "Laws_02_Contributions_2"]
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
      "switchTab"
    )
;

// Load the data and kick-off the visualization.
d3.queue()
  .defer(d3.csv, "../data/CSVs/Laws_02_Contributions_1.csv")
  .defer(d3.csv, "../data/CSVs/Laws_02_Contributions_2.csv")
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
function visualize(error, contribs, contribs2, usa){
    corpus(error, contribs, contribs2);
    carto(error, usa);

    setupTabNavigation();

    // Initialize the selected year to the most recent.
    var maxYear = d3.max(grid.data(), function (d){ return d.Year; });
    signal.call("selectYear", null, maxYear);
}

function corpus(error, contribs, contribs2) {
    var data = d3.nest()
            .key(function(d) { return d.Identifier; })
            .rollup(function(leaves) {
                // Combine the two datasets
                var leaf = leaves[0]
                  , newleaf = leaves[1]
                ;
                d3.keys(newleaf).forEach(function(k) { leaf[k] = newleaf[k]; })
                leaf.Year = +leaf.Year;
                return leaf;
              })
            .map(d3.merge([contribs, contribs2]))
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
    var chooserGroup = d3.select("form").selectAll(".chooser")
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
        .svg(d3.select("svg#main"))
        .data(data)
        .tooltip(tip)
        .connect(signal)
        .selectedColumn(querify())
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
    d3.select(".nav-tabs")
        .selectAll("li a")
        .on("click", function (d){
            console.log("Tab clicked");
        })
    ;
    console.log("here");
}
