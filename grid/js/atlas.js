function Atlas() {
    var path = d3.geoPath().projection(null)
      , width = 960
      , height = 530
      , margin = { top: 10, left: 20, right: 20, bottom: 10 }
      , tooltip
      , svg
      , selectedYear
    ;

    function my(el) {
      svg = el
          .attr("viewBox", "0 0 " + width + " " + height)
          .call(tooltip)
      ;
      svg
        .append("g")
          .attr("id", "usa")
        .selectAll(".state")
          .data(geogrify)
        .enter().append("g")
          .attr("class", function(d) {
              return d.feature.properties.usps + " state";
            })
        .append("path")
          .attr("d", function(d) { return path(d.feature); })
      ;
      svg.append("text")
          .attr("class", "atlas-selected-year")
          .attr("x", width / 2)
          .attr("y", 45)
      ;
      reset();
    } // Main Function Object

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
        svg.selectAll(".state path")
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
        data.forEach(function(datum) {
            svg.selectAll(".state" + "." + datum.key + " path")
                .style("fill", datum.value.color)
                .style("stroke", "white")
                .on("mouseover", function() {
                    tooltip.
                        html('<span style="text-align: center;">'
                            + "<h4>"
                              + datum.value.state + " " + datum.value.year
                            + "</h4>"
                            + "<p>" + datum.value.column + ":</p>"
                            + "<p>" + datum.value.limit + "</p>"
                            + "</span>"
                          )
                        .show()
                    ;
                  })
                .on("mouseout", tooltip.hide)
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

    my.selectedYear = function (selectedYear) {
        svg.select(".atlas-selected-year").text(selectedYear);
      } // my.selectedYear
    ;

    // This is always the last thing returned
    return my;
} // Atlas()
