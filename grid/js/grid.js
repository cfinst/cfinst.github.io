function Grid(){

  // Configuration parameters.
  var margin = { left: 50, right: 15, top: 35, bottom: 5 }
    , axisPadding = 0.6
    , radius = 9
    , xColumn = "State"
    , yColumn = "Year"
    , moneyFormat = function (n){ return "$" + d3.format(",")(n); }
    , bins = [1000, 2500, 5000, 10000]
    // ColorBrewer Sequential 6-class YlOrRd
    // From http://colorbrewer2.org/#type=sequential&scheme=YlOrRd&n=6
    , colors = ["#fed976","#feb24c","#fd8d3c","#fc4e2a", "#e31a1c", "#800026"]
  ;

  // DOM Elements.
  var svg = d3.select("svg")
    , g = svg.append("g")
    , xAxisG = g.append("g")
        .attr("class", "x axis")
    , yAxisG = g.append("g")
        .attr("class", "y axis")
        , legendG = d3.select("#meta svg").append("g")
            .attr("transform", "translate(20, 20)")
  ;

  // D3 Objects.
  var xScale = d3.scalePoint().padding(axisPadding)
    , yScale = d3.scalePoint().padding(axisPadding)
    , colorScale = d3.scaleThreshold().range(colors)
    , tip = d3.tip().attr("class", "d3-tip")
    , legend = d3.legendColor()
          .scale(colorScale)
          .shape("circle")
          .labelFormat(moneyFormat)
          .title("Maximum Contribution Limits")
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

      // Set the colorScale
      colorScale.domain(
        bins.concat(d3.max(data, function(d) { return +d[selectedColumn] + 1; }))
      );

      // Initialize the tooltip
      svg.call(tip);
      // Transform the g container element.
      g.attr("transform", "translate(" + [margin.left, margin.top] + ")");

      // Render the grid
      render_cells();

      // Render the axes.
      xAxisG
          .call(d3.axisTop().scale(xScale))
        .selectAll(".tick text")
          .attr("dy", "-.7em")
      ;
      yAxisG
          .call(d3.axisLeft().scale(yScale))
        .selectAll(".tick text")
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

      // Render the legend
      render_legend();

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
      // Set the dimensions of the circles and grid cells
      var x = xScale.step()
        , y = yScale.step()
      ;
      if(x < y)
          yScale.rangeRound([0, x * yScale.domain().length]);
      else
          xScale.rangeRound([0, y * xScale.domain().length]);

      // Set the radius of the circles
      radius = d3.min([x, y]) * 0.45;
  } // size_up()

  function render_cells() {
    // Visualize the selectedColumn.
    var circles = g.selectAll("circle")
          .data(data, function (d){ return d.Identifier; })
    ;
    circles
      .enter()
        .append("circle")
        .attr("cx", function (d){ return xScale(d[xColumn]); })
        .attr("cy", function (d){ return yScale(d[yColumn]); })
        .attr("r", 0)
      .merge(circles)
        .attr("class", function (d){
            var unltd = !d[selectedColumn];
            return "grid-circle "
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
        .attr("cx", function (d){ return xScale(d[xColumn]); })
        .attr("cy", function (d){ return yScale(d[yColumn]); })
        .attr("r", radius)
        .style("color", function (d){
            return colorScale(d[selectedColumn] ? d[selectedColumn] : Infinity);
          })
    ;

    circles.exit()
      .transition().duration(500)
        .attr("r", 0)
      .remove()
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

    // Handle the empty circle case.
    legendG.selectAll("circle")
        .attr("class", "grid-circle")
        .style("color", function (color){ return color; })
      .transition(d3.transition().duration(500))
        .style("fill-opacity", function (color){
            return color === colors[colors.length - 1] && empty ? 0 : 1;
          })
    ;
  } // render_legend()

  function resort(tick) {
      var sorted = data
          .filter(function(d) { return d[yColumn] === tick; })
          .sort(function(m, n) {
              var a = m[selectedColumn] || Infinity
                , b = n[selectedColumn] || Infinity
              ;
              if(a != b) return a - b;

              a = scorecard[m.State].unltd[selectedColumn];
              b = scorecard[n.State].unltd[selectedColumn];
              if(a != b) return a - b;

              a = scorecard[m.State].sum[selectedColumn];
              b = scorecard[n.State].sum[selectedColumn];
              if(a != b) return a - b;

              return d3.ascending(m.State, n.State);
            })
          .map(function(d) { return d[xColumn]; })
      ;
      xAxisG.call(d3.axisTop().scale(xScale.domain(sorted)));
      render_cells();
  } // resort()


  // API - Getter/Setter Methods
  my.data = function (_){
      if(!arguments.length) return data;
      data = _
          .sort(function(a, b) {
              return d3.ascending(a.Year, b.Year);
            })
          // UPDATE THIS WHEN THE YEAR IS COMPLETE
          .filter(function(d) { return d.Year != 2016; })
      ;
      // Compute X and Y domains.
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
  my.scorecard = function (_){
      if(!arguments.length) return scorecard;
      scorecard = _;
      return my;
    } // my.scorecard()
  ;

  // This is always the last thing returned
  return my;
} // Grid()
