function Atlas() {
    var path = d3.geoPath().projection(null)
      , width = 960
      , height = 600
      , margin = { top: 10, left: 20, right: 20, bottom: 10 }
      , svg
      , tooltip
    ;

    function my(el) {
      svg = el
          .attr("viewBox", "0 0 " + width + " " + height)
      ;
      svg
        .append("g")
          .attr("id", "usa")
          .call(tooltip)
        .selectAll(".state")
          .data(geogrify)
        .enter().append("g")
          .attr("class", function(d) {
              return d.feature.properties.usps + " state";
            })
        .append("path")
          .attr("d", function(d) { return path(d.feature); })
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
     */
    my.update = function(data) {
        if(!data || !data.length) return;
        data = d3.nest().key(function(d) { return d.state; }).map(data);
        svg.selectAll(".state")
            .each(function(s) {
                var blah = data.get(s.feature.properties.usps);
                d3.select(this).select("path")
                    .style("fill", function() {
                        return (blah && blah.length) ? blah[0].color : "#ccc";
                      })
                    .style("stroke", "white")
                ;
              })

        return my;
      } // update()
    ;
    my.tooltip = function (_){
        if(!arguments.length) return tooltip;
        tooltip = _;
        return my;
      } // my.tooltip()
    ;
    my.reset = function (){
       reset();
       return my;
     } // reset()
    ;
    // This is always the last thing returned
    return my;
} // Atlas()
