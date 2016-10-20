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

    /*
     * API Functions
     */
    my.update = function(data, field) {
        svg.selectAll(data.keys().map(function(k) { return "." + k; }))
            .each(function(s) {
                var blah = data.get(s.feature.properties.usps);
                d3.select(this).select("path")
                    .style("fill", function() {
                        return blah[field]
                          ? colors(blah[field])
                          : "#ccc"
                        ;
                      })
                ;
                d3.select(this)
                    .on("mouseover", function() {
                        tip
                            .html(blah[field])
                            .show()
                        ;
                      })
                    .on("mouseout", tip.hide)
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

    // This is always the last thing returned
    return my;
} // Atlas()
