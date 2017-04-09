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
      , valueAccessor
      , backgroundRectFadeOpacity = 0.7
    ;

    function my() {
      if(data.has(query.year))
          update();
    } // Main Function Object


    function reset() {
        usa.selectAll(".state path")
            .style("fill", "#ccc")
            .style("stroke", "white")
        ;
    } // reset()

    function update() {
      if(!valueAccessor) return ;
      svg.selectAll(".state path").each(function(d) {
          var self = d3.select(this)
            , state = d.feature.properties.usps
            , datayear = data.get(query.year)
          ;
          if(!datayear.has(state)) return;

          var datum = datayear.get(state);
          var value = valueAccessor(datum)
            , keyColumn = query.question.split('Limit')[0]
            , keyAnswer = datum[keyColumn]
          ;
          self
            .on("mouseover", function(d) {
                tooltip
                    .html(tooltipContent(datum))
                    .show()
                ;
                dispatch.call("highlight", null, [datum]);
              })
            .on("mouseout", function(d) {
                tooltip.hide();
                dispatch.call("highlight", null, []);
              })
          .style("fill", function() {
              return query.colorScale(value);
            })
          ;
        });

        // TODO reinstate this
        // Part of https://github.com/cfinst/cfinst.github.io/issues/170
        //overlay.selectAll(".state")
        //    .classed("chosen", function(d) {
        //        if(!d.feature || !d.feature.properties) return false;
        //        return d.feature.properties.usps === query.state;
        //      })
        //  .transition().duration(500)
        //    .style("stroke-opacity", function(d) {
        //        if(!d.feature || !d.feature.properties) return 0;
        //        return (d.feature.properties.usps === query.state) ? 1 : 0;
        //      })
        //;
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
    ;
    my.reset = function (){
       reset();
       return my;
     } // my.reset()
    ;
    my.query = function(_) {
        if(!arguments.length) return query;
        query = _;

        return my;
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
        dispatch = _.on("highlight.atlas", function(highlightData) {

            // Only highlight data in the current year.
            var highlightedStates = d3.set(
                highlightData
                    .filter(function (d){
                        return +d.Year === +query.year;
                    })
                    .map(function (d){
                        return d.State;
                    })
                )
            ;

            overlay.select(".fade-rect")
                .attr("width", width)
                .attr("height", height)
              .transition().duration(500)
                .attr("fill-opacity", highlightData.length ? backgroundRectFadeOpacity : 0);

            overlay
              .selectAll(".state")
                .attr("fill-opacity", function(d) {
                    if(!d.feature || !d.feature.properties) return 0;
                    var highlighted = highlightedStates.has(d.feature.properties.usps);
                    return highlighted ? 1 : 0;
                  })
            ;
              // TODO reinstate this
              // Part of https://github.com/cfinst/cfinst.github.io/issues/170
              //.selectAll(".state:not(.chosen)")
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
        // TODO reinstate this
        // Part of https://github.com/cfinst/cfinst.github.io/issues/170
        //usa.selectAll("path")
        //    .on("click", function(d) {
        //        if(!d.feature || !d.feature.properties) return;
        //        var usps = d.feature.properties.usps;
        //        query.state = (query.state === usps) ? null : usps;
        //        dispatch.call("query", null, query);
        //      })
        //;
        overlay.selectAll(".state")
            .data(gjson)
            .call(initStateShapes)
        ;
        overlay.selectAll(".state")
            .attr("fill-opacity", 0)
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
        overlay = svg.select("#highlight-overlay")
            .attr("class", "highlight-overlay")
        ;

        overlay
          .append("rect")
            .attr("class", "fade-rect")
            .attr("fill", "white");

        return my;
      } // my.svg()
    ;

    my.valueAccessor = function (_){
        valueAccessor = _;
        return my;
      }
    ;

    my.backgroundRectFadeOpacity = function (_){
        if(!arguments.length) return backgroundRectFadeOpacity;
        backgroundRectFadeOpacity = _;
        return my;
      } // my.backgroundRectFadeOpacity()
    ;

    // This is always the last thing returned
    return my;
} // Atlas()
