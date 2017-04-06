---

---
(function () {
  var signal = d3.dispatch(
        "query"
        , "downloadVisibleData"
        , "navigate"
        , "highlight"
      )
    , grid = Grid()
          .tooltipContent(tooltipContent)
          .connect(signal)
    , atlas = Atlas()
          .tooltipContent(tooltipContent)
          .connect(signal)
    , legend = Legend()
          .connect(signal)
    , tip = d3.tip().attr('class', 'd3-tip')
    , tabs = {}
    , query = { // These are the defaults
          section: 'contribution-limits'
        , legend: 'default'
        , question: null
        , label: null
        //, state: null // TODO reinstate this. https://github.com/cfinst/cfinst.github.io/issues/170
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
        + "<h5>" + query.label + "</h5>"
        + "<h4>" + grid.format()(grid.valueAccessor()(d)) + "</h4>"
        + "</span>"
      ;
  }

  /*
  ** Main Functions
  */
  function visualize(error, usa, contribs, contribs2, contribs3, disclosure1, disclosure2, disclosure3, publicFinancing, other){
      if(error) throw error;

      var dataset = d3.merge([
              contribs, contribs2, contribs3
            , disclosure1, disclosure2, disclosure3
            , publicFinancing
            , other
          ])
        , data = ingest(dataset)
      ;
      
      // Reassign dataset here so it only includes years not filtered out.
      dataset = d3.merge(data.values().map(function(v) { return v.values(); }));

      initializeYearSelector(data.keys());

      grid
          .svg(d3.select("svg#main"))
          .data(dataset)
          .tooltip(tip)
      ;
      atlas
          .svg(d3.select("svg#map"))
          .geo(usa)
          .data(data)
          .tooltip(tip)
      ;
      legend
          .container(d3.select("ul#legend"))
      ;

      // Initialize the navigation state.
      queryFromURL(); // populate the query variable
      setupTabNavigation();
      connectSorterButtons();
      setupSignals(dataset);

      // If the query section doesn't have a valid link, default to the first tab
      query.section = query.section || d3.select(".nav-tabs a").attr("href").split('#')[1];
      var tab = tabs[query.section].query(query);

      // Click the section tab
      d3.select("a[href='#" + query.section + "']").node().click();

      // Select a year
      d3.select("#chooser-year").each(function() {
          var self = d3.select(this)
            , def = self.select("option").node().value
          ;
          this.value = query.year;
          this.value = this.value || def; // if year is invalid, show default
          self.on("change").apply(this, []);
        })
      ;

      // Initialize the sort mode to "Alphabetically" (first button encountered).
      // This in turn causes the "query" signal to be dispatched,
      // which kicks off the initial rendering of the grid.
      d3.select(".sorter-slicer").select(".btn").node().click();

  } // visualize()

  function ingest(dataset) {
      return d3.nest()
          .key(function(d) { return d.Year; })
          .key(function(d) { return d.State; })
          .rollup(function(leaves) { return Object.assign.apply(null, leaves); })
          .map(dataset{% if site.filterYear %}
  {% comment %}Check Jekyll config to see if a year is excluded.{% endcomment %}
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

  function connectSorterButtons() {
      d3.select(".sorter-slicer").selectAll(".btn")
          .on("click", function() {
              query.sortMode = d3.select(this).select("input").node().value;
              signal.call("query", null, query);
            })
      ;
  } // connectSorterButtons()

  function setupTabNavigation() {
      d3.select(".nav").selectAll("li a")
          .on("click", function (d){
              signal.call("navigate", null, this.href.split('#')[1]);
          })
      ;
  } // setupTabNavigation()

  function setupSignals(dataset) {

      signal.on("downloadVisibleData", function (){
          var selectedColumn = query.question;
          var valueAccessor = grid.valueAccessor();
          var format = grid.format();

          var filename = "CFI-" + query.section + "-" + selectedColumn + ".csv";
          var projectedData = dataset.map(function (d){
              var row = {
                State: d.State,
                Year: +d.Year // Don't use quotes around years in the CSV.
              };
              row[selectedColumn] = format(valueAccessor(d)) // Match Tooltip value presentation.
              return row;
            })
          ;
          downloadCSV(projectedData, filename);
      });

      // Set the URL history to the current section.
      signal.on("navigate.history", function (section) {
          window.location.hash = '#' + section;
        })
      ;
      // Update the visualization according to the current section.
      signal.on("navigate.vis", function (tab){
          query.section = tab;
          query.question = null;
          tabs[tab].query(query)();
        });

      signal.on("query", function(question) {
        question.colorScale = colorScale[question.section][question.legend];
        grid
            .query(question)
          ()
        ;

        var valueAccessor = grid.valueAccessor();
        atlas
            .valueAccessor(valueAccessor)
            .query(question)
          ()
        ;

        var visibleValues = "all";
        if(question.colorScale.type === "ordinal"){
          visibleValues = d3.set(dataset.map(valueAccessor))
        }

        legend
            .query(question)
            .visibleValues(visibleValues)
            .valueAccessor(valueAccessor)
            .dataset(dataset)
          ()
        ;

        d3.select("#chooser-year").node().value = question.year;

        // toggle legend
        // Set the URL
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
      ['question', 'year'].forEach(function(k) {
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

  /*
  ** Set up the colorScale object, which is keyed by the tab/section
  ** The colors and labels for the various colorScales are all defined in
  ** Jekyll, so we're using Jekyll template statements to populate the object.
  */
  var sectionconfig = d3.entries({{ site.data.sections | jsonify }});
  var colorScale = {};
  sectionconfig.forEach(function(sec) {
      colorScale[sec.key] = {};
      sec.value.legends.forEach(function(leg) {
          var thresh = leg.type === "threshold"
            , sc = thresh ? d3.scaleThreshold() : d3.scaleOrdinal()
            , range = leg.scale.map(function(s) { return s.color; })
            , domain = leg.scale.map(function(s, i) {
                  if(thresh) {
                      s.max = s.max === "Infinity"
                        ? 1 / 0
                        : s.max
                      ;
                  }
                  return thresh ? (s.max + 1) : s.label;
                })
          ;
          if(thresh) sc.emptyValue = leg.fallback;
          sc.type = leg.type;
          colorScale[sec.key][leg.name] = sc.range(range).domain(domain);
      });
  });

  d3.selectAll(".tab-pane").each(function(d, i) {
      var name = this.id;
      d3.select(this).call(tabs[name]);
    })
  ;
}());
