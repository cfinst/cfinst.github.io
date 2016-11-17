function Grid(){

  // Configuration parameters.
  var margin = { left: 40, right: 40, top: 35, bottom: 5 }
    , side = 16 // length of each square cell
    , width, height // of the viz
    , xColumn = "State"
    , yColumn = "Year"
    , moneyFormat = function (n){ return "$" + d3.format(",")(n); }
    , bins = [1000, 2500, 5000, 10000]
      // Color Palettes:
      // Blues: http://colorbrewer2.org/#type=diverging&scheme=RdBu&n=11
      // Reds: http://colorbrewer2.org/#type=sequential&scheme=Reds&n=9
    , colors = [
          "#67000d" // Prohibited - Dark red from CFI site
          , "#053061", "#2166ac", "#4393c3", "#92c5de", "#d1e5f0" // Thresholds
          , "#cb181d" // Unlimited - Light red
        ]
  ;

  // DOM Elements.
  var svg
    , xAxisG
    , yAxisG
    , yAxis2G
    , legendG
    , buttonG
    , tooltip
  ;

  // D3 Objects.
  var xScale = d3.scaleBand().padding(0).align(0)
    , yScale = d3.scaleBand().padding(0).align(0)
    , colorScale = d3.scaleThreshold().range(colors)
    , legend = d3.legendColor()
          .scale(colorScale)
          .shape("rect")
          .labelOffset(5)
          .labelFormat(moneyFormat)
    , axisX = d3.axisTop()
    , axisY = d3.axisLeft()
    , axisY2 = d3.axisRight()
  ;
  // Internal state variables.
  var selectedColumn, keyColumn
    , data
    , sortYear
    , scorecard
    , empty = false
    , reset = true
    , dispatch
  ;

  // Main Function Object
  function my() {
      if(!data) return;

      // Adjust to the size of the HTML container
      size_up();

      // Sort, if a year has been selected
      if(sortYear) resort();

      // Set up the domains
      domainify();

      // Render DOM elements
      render_cells();
      render_axes();
      render_legend();
      render_button();

      // Set up data download buttons.
      connect_download_buttons();

      // Further changes will cause a reset
      reset = true;
  } // Main Function Object


  // Internal Helper Functions
  function size_up() {
      width = xScale.domain().length * side;
      height = yScale.domain().length * side;

      xScale.rangeRound([0, width]);
      yScale.rangeRound([0, height]);

      svg.attr(
          "viewBox"
        , "0 0 "
            + (width + margin.left + margin.right)
            + " "
            + (height + margin.top + margin.bottom)
      );
  } // size_up()


  // Visualize the selectedColumn.
  function render_cells() {
    var rects = svg.select(".viz").selectAll("rect")
          .data(data, function (d){ return d.Identifier; })
      , w = xScale.step()
      , h = yScale.step()
      , msg = []
    ;
    rects
      .enter()
        .append("rect")
        .attr("x", function (d){ return xScale(d[xColumn]); })
        .attr("y", function (d){ return yScale(d[yColumn]); })
        .attr("width", 0)
        .attr("height", 0)
      .merge(rects)
        .attr("class", "grid-rect")
        .classed("unlimited", function (d){
            return d[keyColumn] === "Unlimited";
          })
        .on("mouseover", function(d) {
            var value = d[keyColumn] === "Unlimited" ? "No Limit"
              : d[keyColumn] === "Limited"
                ? moneyFormat(d[selectedColumn])
                : "Prohibited"
            ;
            tooltip
                .html("<span style='text-align: center;'>"
                    + "<h4>" + d[xColumn] + " " + d[yColumn] + "</h4>"
                    + "<p>" + selectedColumn + ":</p>"
                    + "<p>" + value + "</p>"
                    + "</span>"
                  )
                .show()
            ;
          })
        .on("mouseout", tooltip.hide)
      .transition().duration(500)
        .attr("x", function (d){ return xScale(d[xColumn]); })
        .attr("y", function (d){ return yScale(d[yColumn]); })
        .attr("width", w)
        .attr("height", h)
        .style("color", function (d){
            var value = d[keyColumn] === "Limited"
              ? d[selectedColumn]
              : d[keyColumn] === "No"
                ? -Infinity
                : Infinity
            ;
            if(d.Year === sortYear)
                msg.push({
                    state: d[xColumn]
                  , year: d[yColumn]
                  , color: colorScale(value)
                  , column: selectedColumn
                  , limit: d[selectedColumn]
                });


            return colorScale(value);
          })
    ;
    dispatch.call("update", this, msg);
  } // render_cells()

  function render_legend() {
    // Work out the legend's labels
    var binmax = d3.max(bins)
      , labels = d3.pairs( // Infinity padding
              [-Infinity]
                .concat(colorScale.domain())
                .concat(Infinity)
            )
          .map(function(d, idx) {
              var money = [d[0], d[1] - (idx > 0 ? 1 : 0)].map(moneyFormat);

              // within the bounds of the infinity padding
              if(d.every(isFinite)) {
                  if(d[0] === 0)
                      return "Less than " + moneyFormat(d[1]);
                  if(d[0] === binmax)
                      return money[0] + " or Greater";

                  return money[0] + " - " + money[1];
              }
              // At the extremes (one of the infinity paddings)
              if(d[0] < 0)
                  return "Prohibited";

              return "No Limit";
            })
    ;
    // Render the legend
    legendG.call(legend.labels(labels));

    // Handle the empty rect case.
    legendG.selectAll("rect")
        .attr("class", "grid-rect")
        .classed("empty", function(color) {
            return color === colors[colors.length - 1] && empty;
          })
        .style("color", function (color){ return color; })
    ;

    // Remove the automatically added "label" class,
    // because it unintentionally triggered the "label" class from Bootstrap,
    // which made the font small and bold.
    legendG.selectAll("text")
        .classed("label", false);

  } // render_legend()

  function render_axes() {
      var t = d3.transition().duration(500);
      xAxisG
        .transition(t)
          .call(axisX.scale(xScale))
      ;
      xAxisG.selectAll(".tick line")
          .attr("transform", "translate(" + (xScale.step() / 2) + ",0)")
      ;
      xAxisG.selectAll(".tick text")
          .attr("dy", "-1em")
      ;
      yAxisG
        .transition(t)
          .call(axisY.scale(yScale))
      ;
      yAxis2G
          .attr("transform", "translate(" + width + ",0)")
        .transition(t)
          .call(axisY2.scale(yScale))
      ;
      svg.selectAll(".y.axis .tick line")
          .attr("transform", "translate(0," + (yScale.step() / 2) + ")")
      ;
      svg.selectAll(".y.axis .tick text")
          // Sort dataset when y-axis labels are clicked
          .on("click", function (d){
              signal.call("selectYear", null, d);
            }
          );
      ;
      if(reset)
          // Set the ticks to normal font-weight
          svg.selectAll(".y.axis .tick text")
              .classed("sortby", false)
          ;
  } // render_axes()


  function render_button() {
      buttonG
          .attr("transform", "translate(" + width + ",0)")
        .selectAll("foreignObject")
          .data([1])
        .enter().append("foreignObject")
          .attr("width", side)
          .attr("height", side)
          .each(function(d) {
              d3.select(this)
                .append("button")
                .append("i")
                  .attr("class", "fa fa-sort-alpha-asc")
                  .text("Blah")
              ;
            })
      ;
  } // render_button()

  function domainify() {
      colorScale.domain(
        [0]
            .concat(bins)
            .concat(100000000000) // The "or greater" limit of "10,000 or greater"
      );
      if(reset) {
          xScale.domain(
            data
                .map(function (d){ return d[xColumn]; })
                .sort(d3.ascending)
          );
          yScale.domain(
            data
                .map(function (d){ return d[yColumn]; })
                .sort(d3.descending)
          );
      }
  } // domainify()

  function score() {
      scorecard = d3.nest()
          .key(function(d) { return d[xColumn]; })
          // .key(function(d) { return d[yColumn]; })
          // .rollup(function(leaves) { return leaves[0]; })
          .object(data);
      ;
  } // score();

  function resort() {
      var sorted = data
          .filter(function(d) { return d[yColumn] === sortYear; })
          .sort(function(m, n) {
              var akey = m[keyColumn]
                , bkey = n[keyColumn]
                , aval = m[selectedColumn]
                , bval = n[selectedColumn]
                , acol = colorScale(m[selectedColumn])
                , bcol = colorScale(n[selectedColumn])
              ;
              if(akey != bkey) {
                  if(akey === "No") {
                      if(bkey != "No") return -1;
                  }
                  else {
                      if(bkey === "No") return 1;
                      return akey === "Limited" ? -1 : 1;
                  }
              }

              if(aval != bval) return aval - bval;

              if(acol === bcol) {
                  var acols = scorecard[m[xColumn]]
                          .map(function(d) { return colorScale(d[selectedColumn]); })
                          .filter(function(d) { return d === acol; })
                          .length
                    , bcols = scorecard[n[xColumn]]
                          .map(function(d) { return colorScale(d[selectedColumn]); })
                          .filter(function(d) { return d === bcol; })
                          .length
                  ;
                  if(acols != bcols) return acols - bcols;
              }

              // As a last resort tie breaker, use alphabetical ordering.
              return d3.ascending(m.State, n.State);
            })
          .map(function(d) { return d[xColumn]; })
      ;
      xAxisG
        .transition(d3.transition().duration(500))
          .call(d3.axisTop().scale(xScale.domain(sorted)))
      ;
      render_cells();
  } // resort()

  // Sets up the click handlers on the data download buttons.
  function connect_download_buttons() {

    d3.select("#data-download-button")
      .on("click", function (){
          dispatch.call("downloadAllLimits", null, xColumn, yColumn);
      })

    d3.select("#data-download-button-current-view")
      .on("click", function (){
          dispatch.call("downloadCurrentLimits", null, xColumn, yColumn, selectedColumn);
      })

  } // connect_download_buttons()


  // API - Getter/Setter Methods
  my.svg = function(_) {
      if(!arguments.length) return svg;
      svg = _
            .attr("preserveAspectRatio", "xMinYMin meet")
      ;
      var g = svg.append("g")
              .attr("transform", "translate(" + [margin.left, margin.top] + ")")
        , viz = g.append("g")
              .attr("class", "viz")
        , axes = g.append("g")
              .attr("class", "axes")
      ;
      xAxisG = axes.append("g")
          .attr("class", "x axis")
      ;
      yAxisG = axes.append("g")
          .attr("class", "y axis")
      ;
      yAxis2G = axes.append("g")
          .attr("class", "y axis")
      ;
      legendG = d3.select("#color-legend").append("g")
          .attr("transform", "translate(16, 10) scale(1.4)")
      ;
      buttonG = g.append("g")
          .attr("class", "reset-sort")
      ;
      return my;
    } // my.svg()
  ;
  my.tooltip = function (_){
      if(!arguments.length) return tooltip;
      tooltip = _;
      svg.call(tooltip);
      return my;
    } // my.tooltip();
  ;
  my.data = function (_){
      if(!arguments.length) return data;
      data = _
          .sort(function(a, b) {
              return d3.ascending(a.Year, b.Year);
            })
          // UPDATE THIS WHEN THE YEAR IS COMPLETE
          .filter(function(d) { return d.Year != 2016; })
      ;
      reset = true;
      domainify();
      score();
      return my;
    } // my.data()
  ;
  my.selectedColumn = function (_){
      if(!arguments.length) return selectedColumn;
      selectedColumn = _;
      keyColumn = selectedColumn.split('Limit')[0];
      reset = false;
      return my;
    } // my.selectedColumn()
  ;
  my.resize = function (){
      size_up();
      reset = false;
      return my;
    } // my.resize()
  ;
  my.empty = function (_){
      if(!arguments.length) return empty;
      empty = _;
      reset = false;
      return my;
    } // my.empty()
  ;
  my.reset = function (){ // setter only
      reset = true;
      sortYear = null;
      return my;
    } // my.reset()
  ;
  my.connect = function (_){
      if(!arguments.length) return dispatch;
      dispatch = _;
      return my;
    } // my.connect()
  ;
  my.selectedYear = function(_) {
      if(!arguments.length) return sortYear;

      sortYear = _;
      resort();

      // Highlight the tick for the selected year.
      svg.selectAll(".y.axis .tick text")
          .each(function(d) {
              var self = d3.select(this);
              self.classed("sortby", sortYear === d);
              d3.select(self.node().parentNode).select("line")
                  .attr()
          })
      ;
    }
  ;

  // This is always the last thing returned
  return my;
} // Grid()
