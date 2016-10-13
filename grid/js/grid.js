function Grid(){

  // Configuration parameters.
  var margin = { left: 50, right: 15, top: 35, bottom: 5 }
    , xColumn = "State"
    , yColumn = "Year"
    , moneyFormat = function (n){ return "$" + d3.format(",")(n); }
    , bins = [1000, 2500, 5000, 10000]
    // ColorBrewer Sequential 6-class YlGnBu
    // From http://colorbrewer2.org/#type=sequential&scheme=YlOrRd&n=6
    , colors = ["#ffffcc","#c7e9b4","#7fcdbb","#41b6c4","#2c7fb8","#253494"]
  ;

  // DOM Elements.
  var svg
    , xAxisG
    , yAxisG
    , legendG
  ;

  // D3 Objects.
  var xScale = d3.scaleBand().padding(0).align(0)
    , yScale = d3.scaleBand().padding(0).align(0)
    , colorScale = d3.scaleThreshold().range(colors)
    , tip = d3.tip().attr("class", "d3-tip")
    , legend = d3.legendColor()
          .scale(colorScale)
          .shape("rect")
          .labelFormat(moneyFormat)
          .title("Maximum Contribution Limits")
    , axisX = d3.axisTop()
    , axisY = d3.axisLeft()
  ;
  // Internal state variables.
  var selectedColumn
    , data
    , scorecard
    , empty = false
    , reset = true
  ;

  // Main Function Object
  function my() {
      if(!data) return;

      // Adjust to the size of the HTML container
      size_up();

      // Set up the domains
      domainify();

      // Render DOM elements
      render_cells();
      render_axes();
      render_legend();

      // Initialize the tooltip
      svg.call(tip);

      // Further changes will cause a reset
      reset = true;
  } // Main Function Object


  // Internal Helper Functions
  function size_up() {
      // Compute X and Y ranges based on current size.
      var width = parseInt(svg.style("width"))
        , height = parseInt(svg.style("height"))
        , innerWidth = width - margin.right - margin.left
        , innerHeight = height - margin.bottom - margin.top
      ;

      // Set the scales
      xScale.rangeRound([0, innerWidth]);
      yScale.rangeRound([0, innerHeight]);

      // Set the dimensions of the grid cells
      var w = xScale.step()
        , h = yScale.step()
      ;
      if(w < h)
          yScale.rangeRound([0, w * yScale.domain().length]);
      else
          xScale.rangeRound([0, h * xScale.domain().length]);
  } // size_up()

  function render_cells() {
    // Visualize the selectedColumn.
    var rects = svg.select(".viz").selectAll("rect")
          .data(data, function (d){ return d.Identifier; })
      , w = xScale.step()
      , h = yScale.step()
    ;
    rects
      .enter()
        .append("rect")
        .attr("x", function (d){ return xScale(d[xColumn]); })
        .attr("y", function (d){ return yScale(d[yColumn]); })
        .attr("width", 0)
        .attr("height", 0)
      .merge(rects)
        .attr("class", function (d){
            var unltd = !d[selectedColumn];
            return "grid-rect "
              + (unltd ? "unlimited" + (empty ? " empty" : "") : "")
            ;
          })
        .on("mouseover", function(d) {
            tip
                .html(
                    "<h4>" + d[xColumn] + "</h4>"
                    + "<h4>" + d[yColumn] + "</h4>"
                    + (d[selectedColumn]
                        ? moneyFormat(d[selectedColumn])
                        : "No Limit"
                      )
                  )
                .show()
            ;
          })
        .on("mouseout", tip.hide)
      .transition().duration(500)
        .attr("x", function (d){ return xScale(d[xColumn]); })
        .attr("y", function (d){ return yScale(d[yColumn]); })
        .attr("width", w)
        .attr("height", h)
        .style("color", function (d){
            return colorScale(d[selectedColumn] ? d[selectedColumn] : Infinity);
          })
    ;
  } // render_cells()

  function render_legend() {
    // Work out the legend's labels
    var binmax = d3.max(bins)
      , labels = d3.pairs( // Infinity padding
              [ -Infinity ]
                .concat(colorScale.domain())
                .concat(Infinity)
            )
          .map(function(d, idx) {
              var money = [d[0], d[1] - (idx > 0 ? 1 : 0)].map(moneyFormat);

              // within the bounds of the infinity padding
              if(d.every(isFinite))
                  return money[0]
                      + (d[0] === binmax ? " or Greater" : " - " + money[1])
                  ;
              // At the extremes (one of the infinity paddings)
              return !isFinite(d[0])
                ? "Less than " + money[1]
                : "No Limit"
              ;
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
  } // render_legend()

  function render_axes() {
      xAxisG
        .transition().duration(500)
          .call(axisX.scale(xScale))
      ;
      xAxisG.selectAll(".tick line")
          .attr("transform", "translate(" + (xScale.step() / 2) + ",0)")
      ;
      yAxisG
        .transition().duration(500)
          .call(axisY.scale(yScale))
      ;
      yAxisG.selectAll(".tick line")
          .attr("transform", "translate(0," + (yScale.step() / 2) + ")")
      ;
      yAxisG.selectAll(".tick text")
          .on("click", function(d) {
              // Sort dataset when y-axis labels are clicked
              resort(d);
              // Highlight the clicked tick
              yAxisG.selectAll(".tick text")
                  .classed("sortby", function(e) { return d === e; })
              ;
            })
      ;
      if(reset)
          // Set the ticks to normal font-weight
          yAxisG.selectAll(".tick text")
              .classed("sortby", false)
          ;
  } // render_axes()

  function domainify() {
      colorScale.domain(
        bins.concat(d3.max(data, function(d) { return +d[selectedColumn] + 1; }))
      );
      if(reset) {
          xScale.domain(
            data
                .map(function (d){ return d[xColumn]; })
                .sort()
          );
          yScale.domain(
            data
                .map(function (d){ return d[yColumn]; })
                .sort()
          );
      }
  } // domainify()

  function resort(tick) {
      var sorted = data
          .filter(function(d) { return d[yColumn] === tick; })
          .sort(function(m, n) {
              var a = m[selectedColumn] || Infinity
                , b = n[selectedColumn] || Infinity
              ;

              // If the values differ, perform straightforward sorting.
              if(a != b) return a - b;

              // First try to break ties based on the count of unlimited values.
              a = scorecard[m.State].unltd[selectedColumn];
              b = scorecard[n.State].unltd[selectedColumn];
              if(a != b) return a - b;

              // If there is also a tie in terms of the count of unlimired values,
              // then break ties by the sum across all years.
              a = scorecard[m.State].sum[selectedColumn];
              b = scorecard[n.State].sum[selectedColumn];
              if(a != b) return a - b;

              // As a last resort tie breaker, use alphabetical ordering.
              return d3.ascending(m.State, n.State);
            })
          .map(function(d) { return d[xColumn]; })
      ;
      xAxisG.call(d3.axisTop().scale(xScale.domain(sorted)));
      render_cells();
  } // resort()

  // API - Getter/Setter Methods
  my.svg = function(_) {
      if(!arguments.length) return svg;
      svg = _;
      var g = svg.append("g")
              .attr("transform", "translate(" + [margin.left, margin.top] + ")")
        , viz = g.append("g")
              .attr("class", "viz")
        , axes = g.append("g")
              .attr("class", "axes")
      ;
      xAxisG = axes.append("g")
          .attr("class", "x axis")
      yAxisG = axes.append("g")
          .attr("class", "y axis")
      legendG = d3.select("#meta svg").append("g")
          .attr("transform", "translate(20, 20)")
      ;
      return my;
    } // my.svg()
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
      return my;
    } // my.data()
  ;
  my.selectedColumn = function (_){
      if(!arguments.length) return selectedColumn;
      selectedColumn = _;
      return my;
    } // my.selectedColumn()
  ;
  my.resize = function (){
      size_up();
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
      return my;
    } // my.reset()
  ;
  my.scorecard = function (_){
      if(!arguments.length) return scorecard;
      scorecard = _;
      return my;
    } // my.scorecard()
  ;

  // This is always the last thing returned
  return my;
} // Grid()
