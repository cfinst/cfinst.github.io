function Tabulus() {
    /*
    ** Private variables
    */
    var container
      , colorScale
      , grid
      , dropdown
      , query = {}
    ;
    /*
    ** Main Function Object
    */
    function my(sel) {
        dropdown = dropdown || sel.selectAll("select");
        if(!container) {
            container = sel;
            dropdown.selectAll("option")
                .datum(function() { return this.dataset; }) // create datum from data-* attributes
                .attr("selected", function(d, i) {
                    return !i ? "selected" : null;
                  })
            ;
            dropdown
                .on("change", function() {
                    var key = this.id.split("chooser-")[1] || "question"
                      , self = d3.select(this)
                      , datum = self.select("option[value='" + this.value + "']")
                            .datum()
                    ;
                    query[key] = datum;
                    query.question = null;
                    query.disabled = self.attr("disabled");

                    if(datum.disable) {
                        dropdown.each(function() {
                            var name = this.id.split("chooser-")[1]
                              , value = this.value
                            ;
                            d3.select(this)
                                .attr("disabled"
                                    , name === datum.disable ? "disabled" : null
                                  )
                                .property("value"
                                    , name === datum.disable ? "" : value
                                  )
                            ;
                          })
                        ;
                    }
                    update();
                  })
            ;
        }
        // Call the "change" handler function for the first dropdown to trigger render
        container.select("select").each(function() {
            d3.select(this).on("change").apply(this, []);
          })
        ;
    } // my()


    /*
    * Private Helper Functions
    */
    function update() {
        if(query.question) {
            var question = query.question;
            container.select(".field-description")
                .html(question.question + (
                    question.note
                      ? ("*\n\n* " + question.note)
                      : ""
                  ))
            ;
        } else {
            if(!(query.donor && query.recipient)) return;
            if(query.recipient.value === "Cand" && !query.branch) return;
            query.question = {};
            query.question.value = query.donor.value
              + "To"
              + query.recipient.value
              + "Limit"
              + (query.branch
                  ? (query.branch.disabled ? "" : "_" + query.branch.value)
                  : ""
                )
              + "_Max"
            ;
            query.question.label = query.donor.label
              + " to "
              + query.recipient.label
              + (query.branch
                  ? (query.branch.disabled ? "" : "(" + query.branch.label + ")")
                  : ""
                )
            ;
            query.question.legend = query.donor.legend || "default";
        }
        grid
            .colorScale(colorScale[query.question.legend])
            .selectedColumn(query.question.value)
            .selectedColumnLabel(query.question.label)
          () // Call grid()
        ;
        toggleLegend(query.question.legend);
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
