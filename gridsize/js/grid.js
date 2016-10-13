function Grid(){

  // Configuration parameters.
  var margin = { left: 50, right: 15, top: 35, bottom: 750 }
    , radius = 10
    , axisPadding = 0.6
    , xColumn = "State"
    , yColumn = "Year"
    , columns = [
        "IndividualToCandLimit_H_Max",
        "IndividualToCandLimit_S_Max",
        "IndividualToCandLimit_G_Max",
        "PACToCandLimit_H_Max",
        "PACToCandLimit_S_Max",
        "PACToCandLimit_G_Max",
        "CorpToCandLimit_H_Max",
        "CorpToCandLimit_S_Max",
        "CorpToCandLimit_G_Max",
        "LaborToCandLimit_H_Max",
        "LaborToCandLimit_S_Max",
        "LaborToCandLimit_G_Max"
      ]
    , legendSpacing = 20
    , legendPadding = 5
    , moneyFormat = d3.format("($,")
    , tip = d3.tip().attr("class", "d3-tip")
  ;

  // DOM Elements.
  var svg = d3.select("svg").call(tip)
    , g = svg.append("g")
    , xAxisG = g.append("g")
        .attr("class", "y axis")
    , yAxisG = g.append("g")
        .attr("class", "x axis")
    , legendG = svg.append("g")
        .attr("transform", "translate(20,270)")
  ;

  // D3 Objects.
  var xScale = d3.scalePoint().padding(axisPadding)
    , yScale = d3.scalePoint().padding(axisPadding)
    , rScale = d3.scaleSqrt()
      .range([0, radius])
  ;

  // Internal state variables.
  var selectedColumn
    , data
  ;

  function my(){

    if(data){

      // Compute X and Y ranges based on current size.
      var width = svg.attr("width")
        , height = svg.attr("height")
        , innerWidth = width - margin.right - margin.left
        , innerHeight = height - margin.bottom - margin.top
        , filteredData = data.filter(function (d){
            return d[selectedColumn] ? true : false;
          })
      ;
      xScale.range([0, innerWidth]);
      yScale.range([innerHeight, 0]);
      rScale.domain([0, d3.max(filteredData, function (d){ return +d[selectedColumn]; })]);

      // Transform the g container element.
      g.attr("transform", "translate(" + [margin.left, margin.top] + ")");

      // Visualize the selectedColumn.
      var circles = g.selectAll("circle").data(
        filteredData,
        function (d){ return d.Identifier; }
      );
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
          .attr("r", function (d){ return rScale(d[selectedColumn]); })
          .attr("fill", "rgba(0,0,0,0.2)")
          .attr("stroke", "black")
      ;
      circles.exit()
        .transition().duration(500)
          .attr("r", 0)
        .remove();

      // Render the axes.
      xAxisG.call(d3.axisLeft().scale(yScale));
      yAxisG.call(d3.axisTop().scale(xScale).ticks(30));


    }
  }

  my.data = function (_){
    if(_){

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

    } else {
      return data;
    }
  };

  my.selectedColumn = function (_){
    if(!arguments.length) return selectedColumn;

    selectedColumn = _;
    return my;
  };

  // Computes the list of available columns,
  // excluding the xColumn and yColumn.
  my.columns = function (){
    return columns;
  };

  return my;
} // Grid()
