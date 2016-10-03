function Grid(){

  // Configuration parameters.
  var margin = { left: 50, right: 15, top: 35, bottom: 5 }
    , axisPadding = 0.6
    , xColumn = "State"
    , yColumn = "Year"
    , legendSpacing = 20
    , legendPadding = 5
    , moneyFormat = function (n){ return isFinite(n) ? "$" + d3.format(",")(n) : null; }
    , bins = [1000, 2500, 5000, 10000]
    // ColorBrewer YlOrRd
    // From https://bl.ocks.org/mbostock/5577023
    , colors = ["#fed976","#feb24c","#fd8d3c","#f03b20","#bd0026"]
    , tip = d3.tip().attr("class", "d3-tip")
  ;

  // DOM Elements.
  var svg = d3.select("svg").call(tip)
    , g = svg.append("g")
    , xAxisG = g.append("g")
        .attr("class", "y axis")
    , yAxisG = g.append("g")
        .attr("class", "x axis")
    , legendG = d3.select("#meta svg")
  ;

  // D3 Objects.
  var xScale = d3.scalePoint().padding(axisPadding)
    , yScale = d3.scalePoint().padding(axisPadding)
    , colorScale = d3.scaleThreshold()
        .domain(bins)
        .range(colors)
  ;

  // Internal state variables.
  var selectedColumn
    , data
  ;

  function my() {
      if(!data) return;
      // Compute X and Y ranges based on current size.
      var width = parseInt(svg.style("width"))
        , height = parseInt(svg.style("height"))
        , innerWidth = width - margin.right - margin.left
        , innerHeight = height - margin.bottom - margin.top
        , filteredData = data.filter(function(d) { return d[selectedColumn]; })
      ;
      xScale.range([0, innerWidth]);
      yScale.range([innerHeight, 0]);
      var radius = d3.min([xScale.step(), yScale.step()]) * .45;

      // Transform the g container element.
      g.attr("transform", "translate(" + [margin.left, margin.top] + ")");

      // Visualize the selectedColumn.
      var circles = g.selectAll("circle")
            .data(filteredData, function (d){ return d.Identifier; })
      ;
      circles
        .enter()
          .append("circle")
          .attr("r", 0)
        .merge(circles)
          .attr("cx", function (d){ return xScale(d[xColumn]); })
          .attr("cy", function (d){ return yScale(d[yColumn]); })
          .on("mouseover", function(d) {
              tip
                  .html(
                      "<h4>" + d[xColumn] + "</h4>"
                      + "<h4>" + d[yColumn] + "</h4>"
                      + moneyFormat(d[selectedColumn])
                    )
                  .show()
              ;
            })
          .on("mouseout", tip.hide)
        .transition().duration(500)
          .attr("r", radius)
          .attr("fill", function (d){ return colorScale(d[selectedColumn]); })
      ;
      circles.exit()
        .transition().duration(500)
          .attr("r", 0)
        .remove();

      // Render the axes.
      xAxisG.call(d3.axisLeft().scale(yScale));
      yAxisG.call(d3.axisTop().scale(xScale).ticks(30));

      // Render the color legend.
      // var legendGroups = legendG.selectAll("g")
      //   .data(colorScale.range(), identity);
      // var legendGroupsEnter = legendGroups.enter().append("g");
      // legendGroupsEnter.append("rect");
      // legendGroupsEnter.append("text");
      // legendGroups = legendGroupsEnter.merge(legendGroups)
      //     .attr("transform", function (d, i){
      //         return "translate(0," + (i * legendSpacing) + ")";
      //       })
      // ;
      // legendGroups.select("rect")
      //   .attr("x", 0)
      //   .attr("y", 0)
      //   .attr("width", legendSpacing - legendPadding)
      //   .attr("height", legendSpacing - legendPadding)
      //   .attr("fill", identity)
      // ;
      // legendGroups.select("text")
      //   .attr("x", 23)
      //   .attr("y", 12)
      //   .text(function (d){
      //       var range = colorScale.invertExtent(d);
      //
      //       if(!range[0]) return "Less than " + moneyFormat(range[1]);
      //       if(!range[1]) return "Greater than " + moneyFormat(range[0]);
      //
      //       return moneyFormat(range[0]) + " - " + moneyFormat(range[1]);
      //   })
      // ;
  } // Main Function Object

  my.data = function (_){
      if(!arguments.length) return data;
      data = _;

      // Compute X and Y domains.
      xScale.domain(
        data
          .map(function (d){ return d[xColumn]; })
          .sort()
      );
      yScale.domain(
        data
          .map(function (d){ return parseInt(d[yColumn]); })
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

  return my;
} // Grid()
