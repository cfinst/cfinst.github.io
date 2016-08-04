function atlas() {
    var path = d3.geoPath().projection(null)
      , width = 960
      , height = 600
      , margin = { top: 10, left: 20, right: 20, bottom: 10 }
      , svg
      , colors = d3.scaleOrdinal()
          .range(["#f1a340", "#998ec3"])
    ;

    function widget(el) {
      svg = el
        .append("svg")
          .attr("viewBox", "0 0 " + width + " " + height)
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
    widget.update = function(data, field) {
        console.log(field);
        svg.selectAll(data.keys().map(function(k) { return "." + k; }))
            .each(function(s) {
                var blah = data.get(s.feature.properties.usps);

                console.log(blah, field, blah[field]);

                d3.select(this).select("path")
                    .style("fill", colors(blah[field]))
                ;
              })

        return widget;
    } // update()

    // This is always the last thing returned
    return widget;
} // atlas()
