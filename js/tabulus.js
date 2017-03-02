function Tabulus() {
    /*
    ** Private variables
    */
    var container
      , colorScale
      , grid
      , dropdown
      , section
      , query = {}
    ;
    /*
    ** Main Function Object
    */
    function my(sel) {
        dropdown = dropdown || sel.selectAll("select");
        if(!container) {
            container = sel;
            dropdown
                .on("change", function() {
                    var key = this.id.split("chooser-")[1] || "question"
                      , datum = d3.select(this)
                          .select("option[value='" + this.value + "']")
                            .datum()
                    ;
                    query[key] = this.value;
                    query.answer = datum;
                    update();
                  })
              .selectAll("option")
                .datum(function() { return this.dataset; }) // create datum from data-* attributes
                .attr("selected", function(d, i) {
                    return !i ? "selected" : null;
                  })
            ;
        }
        dropdown.each(function(d, i) {
            // Call the "change" handler function for each dropdown
            d3.select(this)
              .on("change")
                .apply(this, [d, i])
            ;
          })
        ;
    } // my()


    /*
    * Private Helper Functions
    */
    function update() {
        toggleLegend(query.answer.legend);
        if(query.question) {
            container.select(".field-description")
                .html(
                    query.answer.note
                      ? (query.answer.question + "*\n\n* " + query.answer.note)
                      : query.answer.question
                    )
            ;
            grid
                .colorScale(colorScale[query.answer.legend])
                .selectedColumn(query.question)
                .selectedColumnLabel(query.answer.label)
              () // Call grid()
            ;
        } else {
            if(!(query.donor && query.recipient)) return;
            if(query.recipient === "Cand" && !query.branch) return;
            console.log(query);
        }
    } // update()

    function toggleLegend(legend){
        container.selectAll(".legend ul")
            .style("display", function() {
                return d3.select(this).classed("legend-" + legend)
                  ? null
                  : "none"
                ;
              })
        ;
    } // toggleLegend()

    /*
    ** API - Getter/Setter Methods
    */
    my.colorScale = function(_) {
        if(!arguments.length) return colorScale;
        colorScale = _;
        return my;
      } // my.colorScale()
    ;
    my.grid = function(_) {
        if(!arguments.length) return grid;
        grid = _;
        return my;
      } // my.grid()
    ;
    my.container = function(_) {
        if(!arguments.length) return container;
        container = _;
        return my;
      } // my.container()
    ;
    my.toggleLegend = toggleLegend;

    /*
    ** This is ALWAYS the last thing returned
    */
    return my;
} // Tabulus()
