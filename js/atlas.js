function Atlas() {
    var path = d3.geoPath().projection(null)
      , width = 960
      , height = 530
      , margin = { top: 10, left: 20, right: 20, bottom: 10 }
      , tooltip
      , tooltipContent
      , svg
      , selectedYear
      , dispatch
    ;

    function my(el) {
      svg = el
          .attr("viewBox", "0 0 " + width + " " + height)
          .call(tooltip)
      ;
      var usa = svg.append("g").attr("id", "usa");
      var overlay = svg.append("g").attr("id", "highlight-overlay");

      usa.call(initStateShapes);

      // Set up highlighting.
      var overlayStates = overlay.call(initStateShapes)
        .selectAll(".state path")
          .classed("highlighted", true)
          .attr("stroke-opacity", 0)
      ;
      dispatch.on("highlight.atlas", function (highlightData){
          overlayStates.transition().duration(500)
              .attr("stroke-opacity", function (d){
                  return highlightData.some(function (highlightDatum){
                      return d.feature.properties.usps === highlightDatum.State;
                  }) ? 1 : 0;
              })
          ;
      });
      reset();
    } // Main Function Object

    function initStateShapes(selection) {
        selection
          .selectAll(".state")
          .data(geogrify)
          .enter().append("g")
            .attr("class", function(d) {
                return d.feature.properties.usps + " state";
              })
          .append("path")
            .attr("d", function(d) { return path(d.feature); })
        ;
    }

    function geogrify(usa) {
      return topojson.feature(usa, usa.objects.states).features
          .map(function(d) {
              var centroid = path.centroid(d);

              if(centroid.some(isNaN)) return;
              centroid.feature = d;
              return centroid;
            })
      ;
    } // geogrify()

    function reset() {
        svg.select("#usa").selectAll(".state path")
            .style("fill", "#ccc")
            .style("stroke", "white")
        ;
    } // reset()

    /*
     * API Functions
    **/
    my.update = function(data) {
        if(!data || !data.length) return;

        data = d3.nest()
            .key(function(d) { return d.state; })
            .rollup(function(leaves) { return leaves[0]; })
            .entries(data)
        ;

        var usa = svg.select("#usa");
        data.forEach(function(datum) {
            usa.selectAll(".state" + "." + datum.key + " path")
                .style("fill", datum.value.color)
                .style("stroke", "white")
                .on("mouseover", function() {
                    tooltip
                        .html(tooltipContent(datum.value.d))
                        .show()
                    ;
                    dispatch.call("highlight", null, [datum.value.d]);
                  })
                .on("mouseout", function() {
                    tooltip.hide();
                    dispatch.call("highlight", null, []);
                })
            ;
          })
        ;
        return my;
      } // update()
    ;
    my.reset = function (){
       reset();
       return my;
     } // my.reset()
    ;
    my.tooltip = function (_){
        if(!arguments.length) return tooltip;
        tooltip = _;
        return my;
      } // my.tooltip()
    ;
    my.tooltipContent = function (_){
        if(!arguments.length) return tooltipContent;
        tooltipContent = _;
        return my;
      } // my.tooltipContent()
    ;
    my.connect = function (_){
        if(!arguments.length) return dispatch;
        dispatch = _;
        return my;
      } // my.connect()
    ;

    // This is always the last thing returned
    return my;
} // Atlas()
