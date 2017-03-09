function Grid(){

  // Configuration parameters.
  var margin = { left: 40, right: 40, top: 35, bottom: 5 }
    , side = 16 // length of each square cell
    , width, height // of the viz
    , xColumn = "State"
    , yColumn = "Year"
    , moneyFormat = function (n){ return "$" + d3.format(",")(n); }
    , colorScale
    , tooltipContent
  ;

  // DOM Elements.
  var svg
    , xAxisG
    , yAxisG
    , yAxis2G
    , tooltip
  ;

  // D3 Objects.
  var xScale = d3.scaleBand().padding(0).align(0)
    , yScale = d3.scaleBand().padding(0).align(0)
    , axisX = d3.axisTop()
    , axisY = d3.axisLeft()
    , axisY2 = d3.axisRight()
  ;
  // Internal state variables.
  var selectedColumn
    , selectedColumnLabel
    , valueAccessor // The accessor function(d) for the value to visualize.
    , format // The formatter function, works from the output of valueAccessor(d).
    , data
    , selectedYear
    , sortMode
    , empty = false
    , dispatch
  ;

  // Main Function Object
  function my() {
      if(!data || !colorScale || !sortMode || !selectedYear) return;

      // Extract the color scale domain before rendering,
      // for detecting unanticipated data values later.
      var before = colorScale.domain().slice();

      // Set up the domains
      domainify();

      // Adjust to the size of the HTML container
      size_up();

      // Render DOM elements
      render_axes();
      svg.select(".viz")
          .call(render_cells, data)
          .call(render_year_indicators)
      ;
      // Set up data download buttons.
      connect_download_buttons();

      // Set up highlighting.
      dispatch.on("highlight.grid", function (highlightData){
          svg.select(".highlight-overlay")
              .call(render_cells, highlightData, true);
      });

      // Detect and warn about unexpected values,
      // because these cause the visualization to display misleading colors.
      var after = colorScale.domain().slice();
      if(before.length !== after.length){
          var unexpectedValues = after.slice(before.length);
          console.warn("WARNING");
          console.warn("There are values present in the data that are not part of the legend configurations:");
          console.warn(JSON.stringify(unexpectedValues));
          console.warn("Please be sure to account for these values in the legend configurations located in _data/sections");
          console.warn("The following values are already accounted for:");
          console.warn(JSON.stringify(before));
      }
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
  function render_cells(selection, data, highlighted) {
    if(!colorScale) return;
    var rects = selection.selectAll("rect")
          .data(data, function (d){ return d.Identifier; })
      , w = xScale.step()
      , h = yScale.step()
      , msg = []
    ;
    rects
      .enter()
        .append("rect")
        .attr("x", function (d){ return xScale(d[xColumn]) + w/2; })
        .attr("y", function (d){ return yScale(d[yColumn]) + h/2; })
        .attr("width", 0)
        .attr("height", 0)
        .classed("grid-rect", true)
        .attr("stroke-opacity", 0)
        .on("mouseover", function(d) {
            tooltip
                .html(tooltipContent(d))
                .show()
            ;

            highlight(d);
          })
          .on("mouseout", function() {
              tooltip.hide();
              dispatch.call("highlight", null, []);
          })
          .on("click", function (d){
              dispatch.call("selectYear", null, d.Year);
              highlight(d);
            }
          )
      .merge(rects)
        .classed("highlighted", highlighted)
      .transition().duration(500)
        .attr("x", function (d){ return xScale(d[xColumn]); })
        .attr("y", function (d){ return yScale(d[yColumn]); })
        .attr("width", w)
        .attr("height", h)
        .attr("stroke-opacity", 1)
        .style("color", function (d){
            var value = valueAccessor(d);
            return colorScale(value);
          })
    ;
    rects
      .exit()
      .transition().duration(500)
        .attr("x", function (d){ return xScale(d[xColumn]) + w/2; })
        .attr("y", function (d){ return yScale(d[yColumn]) + h/2; })
        .attr("width", 0)
        .attr("height", 0)
        .attr("stroke-opacity", 0)
      .remove()
    ;
  } // render_cells()

  function render_year_indicators(){
      // Highlight the tick for the selected year.
      svg.selectAll(".y.axis .tick text")
          .each(function(d) {
              var self = d3.select(this);
              self.classed("sortby", selectedYear === d);
              d3.select(self.node().parentNode).select("line")
                  .attr()
          })
      ;
      var yearRect = svg.select(".year-indicator-overlay")
        .selectAll("rect").data([1]);
      yearRect.merge(yearRect.enter().append("rect"))
        .transition().duration(500)
          .attr("x", 0)
          .attr("y", function (d){ return yScale(selectedYear); })
          .attr("width", xScale.range()[1])
          .attr("height", yScale.step())
  } // render_year_indicators()

  function highlight(d){
      // Highlight the cell with the current sort year,
      // so the map highlighting corresponds with the grid highlighting.
      var highlightData = [Object.assign({}, d, { Year: selectedYear })];
      dispatch.call("highlight", null, highlightData);
  }

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
              dispatch.call("selectYear", null, d);
            }
          );
      ;
  } // render_axes()


  function domainify() {
      if(sortMode === "alphabetical"){
        xScale.domain(
          data
              .map(function (d){ return d[xColumn]; })
              .sort(d3.ascending)
        );
      } else {
        xScale.domain(
          data
            .filter(function(d) { return d[yColumn] === selectedYear; })
            .sort(function(m, n) {
                return d3.ascending(valueAccessor(m), valueAccessor(n));
              })
            .map(function(d) { return d[xColumn]; })
        );
      }
      yScale.domain(
        data
            .map(function (d){ return d[yColumn]; })
            .sort(d3.descending)
      );
  } // domainify()

  // Sets up the click handlers on the data download buttons.
  function connect_download_buttons() {
    d3.selectAll("#data-button-download-current-view")
      .on("click", function (){
          dispatch.call("downloadVisibleData");
        })
    ;
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
        , highlightOverlay = g.append("g")
              .attr("class", "highlight-overlay")
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
  my.tooltipContent = function (_){
      if(!arguments.length) return tooltipContent;
      tooltipContent = _;
      return my;
    } // my.tooltipContent()
  ;
  my.data = function (_){
      if(!arguments.length) return data;
      data = _
          .sort(function(a, b) {
              return d3.ascending(a.Year, b.Year);
            })
      ;
      return my;
    } // my.data()
  ;

  my.selectedColumn = function (_, useKeyColumn){
      if(!arguments.length) return selectedColumn;

      selectedColumn = _;
      var keyColumn = useKeyColumn && (
          ~selectedColumn.indexOf('Limit')
          ? selectedColumn.split('Limit')[0]
          : undefined
      );

      valueAccessor = function (d){
          var value;
          // Handle the case of a threshold scale.
          if(keyColumn){

              // Use the key column values to extract
              // "Unlimited" and "Prohibited" values.
              value = d[keyColumn] === "Limited"
                ? +d[selectedColumn]
                : (d[keyColumn] === "No" || d[keyColumn] === "Prohibited")
                  ? -Infinity // Treated as "Prohibited"
                  : Infinity // Treated as "Unlimited"
              ;

              // Treat a value of 0 as "Prohibited"
              value = value === 0 ? -Infinity : value;
          } else {
              value = d[selectedColumn];
              value = (
                value === undefined ? "Missing Field" :
                value.trim() === "" ? (colorScale.emptyValue || "Missing Data") :
                isNaN(+value) ? value :
                +value
              );
          }
          return value;
      }

      format = function (value){
          return (
              value === -Infinity
                ? "Prohibited"
                : value === Infinity
                  ? "Unlimited"
                  : typeof value === "string"
                    ? value
                    : moneyFormat(value)
          );
      };

      return my;
    } // my.selectedColumn()
  ;
  my.valueAccessor = function (_){
      if(!arguments.length) return valueAccessor;
      valueAccessor = _;
      return my;
    } // my.valueAccessor()
  ;
  my.format = function (_){
      if(!arguments.length) return format;
      format = _;
      return my;
    } // my.format()
  ;
  my.selectedColumnLabel = function (_){
      if(!arguments.length) return selectedColumnLabel;
      selectedColumnLabel = _;
      return my;
    } // my.selectedColumnLabel()
  ;
  my.resize = function (){
      size_up();
      return my;
    } // my.resize()
  ;
  my.empty = function (_){
      if(!arguments.length) return empty;
      empty = _;
      return my;
    } // my.empty()
  ;
  my.connect = function (_){
      if(!arguments.length) return dispatch;
      dispatch = _;
      return my;
    } // my.connect()
  ;
  my.selectedYear = function(_) {
      if(!arguments.length) return selectedYear;

      selectedYear = _;
      my();
    }
  ;
  my.colorScale = function (_){
      if(!arguments.length) return colorScale;
      colorScale = _;
      return my;
    } // my.colorScale()
  ;
  my.sortMode = function (_){
      if(!arguments.length) return sortMode;
      sortMode = _;
      my();
      return my;
    } // my.sortMode()
  ;

  // This is always the last thing returned
  return my;
} // Grid()
