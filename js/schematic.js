---
---
(function () {
  var signal = d3.dispatch(
        "query"
        , "update"
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
    , query = { // These are the defaults
          section: 'contribution-limits'
        , question: null
        , label: null
        , legend: 'default'
        , state: null
        , year: null
      }
  ;
  // {% capture tabs %}{% for tab in site.data.tabs %}{{ tab.section }},{% endfor %}{% endcapture %}
  liquidToArray('{{ tabs }}').forEach(function(tab) {
      tabs[tab] = Tabulus()
          .connect(signal)
      ;
  });

  // Load the data and kick-off the visualization.
  d3.queue()
    .defer(d3.json, "data/usa.json")
    .defer(d3.csv, "data/CSVs/Laws_02_Contributions_1.csv")
    .defer(d3.csv, "data/CSVs/Laws_02_Contributions_2.csv")
    .defer(d3.csv, "data/CSVs/Laws_02_Contributions_3.csv")
    .defer(d3.csv, "data/CSVs/Laws_03_Disclosure_1.csv")
    .defer(d3.csv, "data/CSVs/Laws_03_Disclosure_2.csv")
    .defer(d3.csv, "data/CSVs/Laws_03_Disclosure_3.csv")
    .defer(d3.csv, "data/CSVs/Laws_04_PublicFinancing.csv")
    .defer(d3.csv, "data/CSVs/Laws_05_Other.csv")
      .await(visualize)
  ;

  // Responsive
  d3.select(window)
      .on("resize", function() {
          grid.resize()
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
  function visualize(error, usa, contribs, contribs2, contribs3, disclosure1, disclosure2, disclosure3, publicFinancing, other){
      if(error) throw error;

      var data = ingest(d3.merge([
            contribs, contribs2, contribs3
          , disclosure1, disclosure2, disclosure3
          , publicFinancing
          , other
        ]))
      ;
      console.log(data);
      initializeYearSelector(data.keys());

      atlas
          .svg(d3.select("svg#map"))
          .geo(usa)
          .data(data)
          .tooltip(tip)
        () // Call atlas()
      ;
      grid
          .svg(d3.select("svg#main"))
          .data(d3.merge(data.values().map(function(v) { return v.values(); })))
          .tooltip(tip)
        () // Call grid()
      ;


      // Initialize the navigation state.
      queryFromURL(); // populate the query variable
      console.log("from url", query)
      setupTabNavigation();
      setupSignals();

      // If the query section doesn't have a valid link, default to the first tab
      var tab = d3.select("a[href='#" + query.section + "']");
      tab = tab.size() ? tab : d3.select(".nav-tabs a");

      // Click the section tab
      tab.node().click();
      d3.select("#chooser-year").each(function() {
          var self = d3.select(this)
            , def = self.select("option").node().value
          ;
          this.value = query.year;
          this.value = this.value || def; // if year is invalid, show default
          self.on("change").apply(this, []);
      })
  } // visualize()

  function ingest(dataset) {
      return d3.nest()
          .key(function(d) { return d.Year; })
          .key(function(d) { return d.State; })
          .rollup(function(leaves) { return Object.assign.apply(null, leaves); })
          .map(dataset
  {% comment %}Check Jekyll config to see if a year is being worked on{%endcomment %}
  {% if site.filterYear %}
          .filter(function(d) { return d.Year != +{{ site.filterYear }}; })
  {% endif %})
      ;
  } // ingest()

  function initializeYearSelector(yrs) {
      var years = yrs.map(function(d) { return +d; }).sort(d3.descending);
      // Populate Year Selector
      d3.select("#chooser-year")
          .on("change", function() {
              query.year = +this.value;
              signal.call("query", this, query);
            })
        .select("optgroup").selectAll("option")
          .data(years, identity)
        .enter().append("option")
          .attr("value", identity)
          .text(identity)
      ;
  } // initializeYearSelector(

  function setupTabNavigation() {
      d3.select(".nav").selectAll("li a")
          .on("click", function (d){
              signal.call("navigate", null, this.href.split('#')[1]);
          })
      ;
  } // setupTabNavigation()

  function setupSignals() {
      // Signal Handling
      d3.select(".controls .checkbox input")
          .on("change", function() { grid.empty(this.checked)(); })
      ;
      d3.select(".alphabetize-states-button")
          .on("click", function() { grid.reset()(); })
      ;
      signal.on("downloadAllLimits", function (xColumn, yColumn){
          var filename = "CFI-contribution-limits-all.csv";
          var projectedData = project(data, [xColumn, yColumn].concat(columnsRaw));
          downloadCSV(projectedData, filename);
        })
      ;
      signal.on("downloadCurrentLimits", function (xColumn, yColumn, selectedColumn){
          var filename = "CFI-contribution-limits-" + selectedColumn + ".csv";
          var projectedData = project(data, [xColumn, yColumn, selectedColumn]);
          downloadCSV(projectedData, filename);
        })
      ;
      // Set the URL history to the current section.
      signal.on("navigate.history", function (section) {
          window.location.hash = '#' + section;
        })
      ;
      // Update the visualization according to the current section.
      signal.on("navigate.vis", function (tab){
          query.section = tab;
          tabs[tab].query(query)();
        });

      signal.on("query", function(question) {
        // update grid
        question.colorScale = colorScale[question.section][question.legend];
        question.sortMode = "alphabetical"; // TODO: MAKE THIS DyNAMIC

        grid.query(question) ();
        atlas.query(question) ();
        d3.select("#chooser-year").node().value = query.year;

        // toggle legend
        d3.selectAll(".legend ul")
            .style("display", function() {
                return d3.select(this).classed("legend-" + question.legend)
                  ? null
                  : "none"
                ;
              })
        ;
        // Set the year
        queryToURL(question);
      });
  } // setupSignals()


  // Helper Utility Functions
  function identity(d) { return d; }

  // Capture URL query param
  function queryFromURL() {
      var arg // loop variable
        , args = {}// store the incoming request
        , location = window.location.hash.substring(1).split("?")
        , qstr = (location[1] || "").split('&')
      ;
      qstr.forEach(function(q) {
          arg = q.split("=");
          if(arg[0].length && arg[1].length)
              args[arg[0].toLowerCase()] = decodeURIComponent(arg[1]);
        })
      ;
      // Now populate the query object from the URL
      d3.keys(query).forEach(function(k) { query[k] = args[k]; });
      // Populate section from the hash only
      query.section = location[0].toLowerCase();
  } // queryFromURL()

  function queryToURL(question) {
      var val = []
      ;
      ['question', 'year', 'state'].forEach(function(k) {
          if(!question[k]) return;
          val.push([k, encodeURIComponent(question[k])].join('='));
      })
      history.pushState(null, null, '#' + question.section + '?' + val.join('&'));
  } // set_url()

  // Convert a formatted liquid template string into a usable array for Javascript
  //  Basically, it takes a list of strings and splits into an array
  function liquidToArray(str) {
      return str
        .split(',')
        .filter(identity)
      ;
  } // liquidToArray()

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

  /*
  ** Set up the colorScale object, which is keyed by the tab/section
  ** The colors and labels for the various colorScales are all defined in
  ** Jekyll, so we're using Jekyll template statements to populate the object.
  */
  var colorScale = {};
{% for section in site.data.sections %}
  colorScale["{{ section[0] }}"] = {};
  {% for legend in section[1].legends %}
    {% capture bins %}{% for item in legend.scale %}{% unless forloop.last %}{{ item.max }}{% endunless %},{% endfor %}{% endcapture %}
    {% capture colors %}{% for item in legend.scale %}{{ item.color }},{% endfor %}{% endcapture %}
    {% capture labels %}{% for item in legend.scale %}{{ item.label }},{% endfor %}{% endcapture %}
    {% capture type %}{% if legend.type == "threshold" %}Threshold{% else %}Ordinal{% endif %}{% endcapture %}
  colorScale["{{ section[0] }}"]["{{ legend.name }}"] = d3.scale{{ type }}()
      .range(liquidToArray('{{ colors }}'))
    {% if legend.type == "threshold" %}
      .domain(liquidToArray('{{ bins }}').map(function(d) { return +d + 1; }))
    {% elsif legend.type == "ordinal" %}
      .domain(liquidToArray('{{ labels }}'))
    {% endif %}
  ;
  {% if legend.type == "threshold" %}colorScale["{{ section[0] }}"]["{{ legend.name }}"].emptyValue = {{ legend.fallback }};{% endif %}
{% endfor %}{% endfor %}

  d3.selectAll(".tab-pane").each(function(d, i) {
      var name = this.id;
      d3.select(this).call(tabs[name]);
    })
  ;
}());
