function Atlas() {
    var path = d3.geoPath().projection(null)
      , width = 960
      , height = 530
      , margin = { top: 10, left: 20, right: 20, bottom: 10 }
      , tooltip
      , tooltipContent
      , svg
      , selectedYear
      , usa
      , overlay
      , dispatch
      , data
      , query = {}
    ;

    function my() {
    } // Main Function Object


    function reset() {
        usa.selectAll(".state path")
            .style("fill", "#ccc")
            .style("stroke", "white")
        ;
    } // reset()

    function update(datayear) {
        svg.select("#usa").selectAll(".state path").each(function(d) {
            var self = d3.select(this)
              , state = d.feature.properties.usps
            ;
            if(!datayear.has(state)) return "black";
            var answer = datayear.get(state)[query.question]
              , keyColumn = query.question.split('Limit')[0]
              , keyAnswer = datayear.get(state)[keyColumn]
              , value = answer
            ;
            self.style("fill", function() {
                if(query.donor) {
                    if(keyColumn === query.question){
                        value = (
                          value === undefined
                            ? "Missing Field"
                            : value.trim() === ""
                              ? (query.colorScale.emptyValue || "Missing Data")
                              : isNaN(+value)
                                ? value
                                : +value
                        );
                    } else {
                        // Use the key column values to extract
                        // "Unlimited" and "Prohibited" values.
                        value = keyAnswer === "Limited"
                          ? +answer
                          : keyAnswer === "No"
                            ? -Infinity // Treated as "Prohibited"
                            : Infinity // Treated as "Unlimited"
                        ;

                        // Treat a value of 0 as "Prohibited"
                        value = value === 0 ? -Infinity : value;
                    }
                }
                return query.colorScale(value);
              })
            ;
        })
    } // update()


    /*
    ** Helper Functions
    */
    function initStateShapes(selection) {
        return selection
          .enter().append("g")
            .attr("class", function(d) {
                return d.feature.properties.usps + " state";
              })
          .append("path")
            .attr("d", function(d) { return path(d.feature); })
        ;
    } // initStateShapes()

    // Helper Utility Functions
    function identity(d) { return d; }


    /*
     * API Functions
    **/
    my.update = function(data) {
        if(!data || !data.length) return;

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
    my.query = function(_) {
        if(!arguments.length) return query;
        query = _;
        if(data.has(query.year))
            update(data.get(query.year));

        return my();
      } // my.query()
    ;
    my.tooltip = function (_){
        if(!arguments.length) return tooltip;
        svg.call(tooltip = _);
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
        dispatch = _.on("highlight.atlas", function (highlightData){
            overlay.transition().duration(500)
                .attr("stroke-opacity", function (d){
                    return highlightData.some(function (highlightDatum){
                        return (d.feature.properties.usps || "") === highlightDatum.State;
                    }) ? 1 : 0;
                })
            ;
        });

        return my;
      } // my.connect()
    ;
    my.data = function (_){
        if(!arguments.length) return data;
        data = _;
        return my;
      } // my.data()
    ;
    my.geo = function (_){
        if(!arguments.length) return null;
        var gjson = topojson.feature(_, _.objects.states).features
            .map(function(d) {
                var centroid = path.centroid(d);

                if(centroid.some(isNaN)) return;
                centroid.feature = d;
                return centroid;
            })
        ;
        usa.selectAll(".state")
            .data(gjson)
            .call(initStateShapes)
        ;
        overlay.selectAll(".state")
            .data(gjson)
            .call(initStateShapes)
          .selectAll(".state path")
            .classed("highlighted", true)
            .attr("stroke-opacity", 0)
        ;
        return my;
    }
    my.svg = function (_){
        if(!arguments.length) return svg;
        svg = _
            .attr("viewBox", [0, 0, width, height].join(' '))
        ;
        svg.selectAll("*").remove(); // wipe it clean before use
        var g = svg.selectAll("g")
            .data(["usa", "highlight-overlay"], identity)
        ;
        g = g.enter()
          .append("g")
            .attr("id", identity)
          .merge(g)
        ;
        usa = svg.select("#usa");
        overlay = svg.select("#highlight-overlay");

        return my;
      } // my.svg()
    ;
    // This is always the last thing returned
    return my;
} // Atlas()
