---
---
(function () {
var signal = d3.dispatch(
      "update"
      , "selectYear"
      , "downloadCurrentLimits"
      , "downloadAllLimits"
      , "navigate"
      , "highlight"
      , "sortMode"
    )
  , grid = Grid()
        .tooltipContent(tooltipContent)
        .connect(signal)
  , atlas = Atlas()
        .tooltipContent(tooltipContent)
        .connect(signal)
  , tip = d3.tip().attr('class', 'd3-tip')
  , tabs = {}
  , navs = {}
;
// {% capture tabs %}{% for tab in site.data.tabs %}{{ tab.section }},{% endfor %}{% endcapture %}
liquidToArray('{{ tabs }}').forEach(function(tab) {
    tabs[tab] = Tabulus();
});

// Load the data and kick-off the visualization.
d3.queue()
  .defer(d3.csv, "data/CSVs/Laws_02_Contributions_1.csv")
  .defer(d3.csv, "data/CSVs/Laws_02_Contributions_2.csv")
  .defer(d3.csv, "data/CSVs/Laws_02_Contributions_3.csv")
  .defer(d3.csv, "data/CSVs/Laws_03_Disclosure_1.csv")
  .defer(d3.csv, "data/CSVs/Laws_03_Disclosure_2.csv")
  .defer(d3.csv, "data/CSVs/Laws_03_Disclosure_3.csv")
  .defer(d3.csv, "data/CSVs/Laws_04_PublicFinancing.csv")
  .defer(d3.csv, "data/CSVs/Laws_05_Other.csv")
  .defer(d3.json, "data/usa.json")
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

    carto(usa);
    corpus(contribs, contribs2, contribs3, disclosure1, disclosure2, disclosure3, publicFinancing, other);

    setupTabNavigation();

    // Initialize the selected year to the most recent.
    signal.call("selectYear", null, d3.select("#chooser-year").node().value);

    // Initialize the sort mode to by-value.
    signal.call("sortMode", null, "by-value");

    // Initialize the navigation state.
    var section = getQueryVariables().section;

    d3.select("a[href='#" + section + "']")
      .node()
      .click()
    ;
} // visualize()

function corpus() {
    var data = d3.nest()
            .key(function(d) {
                // Construct the identifier from these two fields,
                // because the value of d.Identifier is not reliable (sometimes "l").
                return d.State + d.Year;
            })
            .rollup(function(leaves) { return Object.assign.apply(null, leaves); })
            .map(d3.merge(arguments){% if site.filterYear %}.filter(function(d) { return d.Year != +{{ site.filterYear }}; }){% endif %})
            .values()
    ;
    grid
        .svg(d3.select("svg#main"))
        .data(data)
        .tooltip(tip)
      () // Call grid()
    ;
    var years = d3.extent(data, function(d){ return +d.Year; });

    // Populate Year Selector
    d3.select("#chooser-year")
        .on("change", function() {
            signal.call("selectYear", null, this.value);
          })
      .select("optgroup").selectAll("option")
        .data(d3.range(years[1], years[0], -2), identity)
      .enter().append("option")
        .attr("value", identity)
        .text(identity)
        .property("selected", function(d, i) { return !i ? "selected" : null; })
    ;

    // Set up sort mode toggle buttons.
    d3.selectAll(".sort-mode-buttons button")
        .on("click", function() {
            signal.call("sortMode", null, this.value);
          })
    ;
    signal.on("sortMode.buttons", function (sortMode){
        d3.selectAll(".sort-mode-buttons button")
          .classed("active", function (){
            return this.value === sortMode;
          })
      })
    ;

    // Signal Handling
    signal.on("selectYear.grid", grid.selectedYear);
    signal.on("selectYear.chooser", function (selectedYear){
      d3.select("#chooser-year").node().value = selectedYear;
    });
    signal.on("sortMode.grid", grid.sortMode);
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
        window.location.hash = '#' + section;
    });

    // Update the visualization according to the current section.
    signal.on("navigate.vis", function (section) { navs[section](data); });

} // corpus()


function carto (usa){
    d3.select("svg#map")
        .datum(usa)
        .call(atlas.tooltip(tip))
    ;
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
    var defaultSection = 'contribution-limits';
    vars.section = window.location.hash.substring(1).toLowerCase() || defaultSection;
    return vars;
} // getQueryVariables()

// Convert a formatted liquid template string into a usable array for Javascript
//  Basically, it takes a list of strings and splits into an array
function liquidToArray(str) {
    return str
      .split(',')
      .filter(identity)
    ;
} // liquidToArray()

// Convert a formatted liquid template string into a usable hash for Javascript
// Convert a list of key:value pairs (separated by a ':' and generates a Map)
function liquidToMap(str) {
    return new Map(liquidToArray(str)
        .map(function(d) {
            return d.split(':')
                .map(function(e) { return e.trim(); })
            ;
          })
      )
    ;
} // liquidToMap()


// Causes the given data to be downloaded as a CSV file with the given name.
// Draws from
// http://stackoverflow.com/questions/12676649/javascript-programmatically-trigger-file-download-in-firefox
function downloadCSV(data, filename) {
    var csvStr = d3.csvFormat(data);
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

{% for section in site.data.sections %}
navs["{{ section[0] }}"] = function(data) {
  {% if section[0] == 'contribution-limits' %}
    var colorScale = {
          {% for scale in section[1].legends %}{% for legend in scale[1] %}
            {% capture bins %}{% for item in legend[1] %}{% unless forloop.last %}{{ item.max }}{% endunless %},{% endfor %}{% endcapture %}
            {% capture colors %}{% for item in legend[1] %}{{ item.color }},{% endfor %}{% endcapture %}
            {% unless forloop.first %}, {% endunless %}{{ legend[0] }}: d3.scaleThreshold()
                .domain(liquidToArray('{{ bins }}').map(function(d) { return +d + 1; }))
                .range(liquidToArray('{{ colors }}'))
          {% endfor %}{% endfor %}
          {% capture abbrs %}{% for group in section[1].controls %}{% for dropdown in group.dropdowns %}{% for option in dropdown.options %}{% if option.abbr %}{{ option.abbr }}: {{ option.text }},{% endif %}{% endfor %}{% endfor %}{% endfor %}{% endcapture %}
        }
      , abbrs = liquidToMap('{{ abbrs | strip }}')
      , query = {}
      , tab = tabs["{{ section[0] }}"]
    ;

    // A missing entry in Contribution Limits means "Unlimited".
    colorScale.default.emptyValue = Infinity;

    d3.selectAll("#{{ section[0] }} select")
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
            if(this.id === "chooser-donor") {
                // State Party cannot donate to local party, so disable those
                disablePartyAsRecipient(this.value === "StateP");
            }

            query[this.id.split("chooser-")[1]] = this.value;

            update();
          })
    ;

    // Set up the legend so it can be toggled depending on the donor.
    tab.container(d3.select("#{{ section[0] }}"));

    // Initial render.
    update();

    // Updates the grid and legend based on the current query.
    function update(){
      var legend = legendify();
      grid
          .colorScale(colorScale[legend])
          .selectedColumn(querify(), true)
          .selectedColumnLabel(labelify())
        () // Call grid()
      ;
      tab.toggleLegend(legend);
    } // renderGrid()
      
    function legendify(){
      switch(query.donor){
        case "StateP":
          return "partyAsDonor";
        case "Individual":
          return "noProhibited";
        case "PAC":
          return "noProhibited";
        default:
          return "default";
      }
    }

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
          , branch = !d3.map(data[0]).has([col + "_Max"]);
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
        var dropdown = d3.select("#chooser-recipient")
          , first = dropdown.select("option").attr("value")
          , recip = dropdown.node().value
        ;
        dropdown.select("option[value='Party']")
            .property("disabled", bool)
            .style("visibility", bool ? "hidden" : "visible")
        ;
        // Set the recipient dropdown to the first (non-party) option
        dropdown.node().value = first;
        // Set the query variable with the new recipient dropdown value
        query[dropdown.node().id.split("chooser-")[1]] = dropdown.node().value;
    } // disablePartyAsRecipient()
} // navs["{{ sections[0]}}"]()
{% else %}
    var colorScale = {
    {% for scale in section[1].legends %}{% unless forloop.first %}, {% endunless %}{% for legend in scale[1] %}
    {% capture colors %}{% for item in legend[1] %}{{ item.color }},{% endfor %}{% endcapture %}
    {% unless forloop.first %}, {% endunless %}
    {% if scale[0] == "threshold" %}
      {% capture bins %}{% for item in legend[1] %}{% unless forloop.last %}{{ item.max }}{% endunless %},{% endfor %}{% endcapture %}
        {{ legend[0] }}: d3.scaleThreshold()
            .domain(liquidToArray('{{ bins }}').map(function(d) { return +d + 1; }))
    {% elsif scale[0] == "ordinal" %}
      {% capture labels %}{% for item in legend[1] %}{{ item.label }},{% endfor %}{% endcapture %}
        {{ legend[0] }}: d3.scaleOrdinal()
            .domain(liquidToArray('{{ labels }}'))
    {% endif %}
            .range(liquidToArray('{{ colors }}'))
    {% endfor %}{% endfor %}
    };
    {% if scale[0] == "threshold" %}
    colorScale.small.emptyValue = colorScale.big.emptyValue = -Infinity;
    {% endif %}
    d3.select("#{{ section[0] }}")
        .call(tabs["{{ section[0] }}"].colorScale(colorScale).grid(grid))
    ;
} // navs["{{ section[0]}}"]()
{% endif %}
{% endfor %}
}());
