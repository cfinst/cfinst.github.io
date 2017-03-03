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
                      , self = d3.select(this)
                      , datum = self.select("option[value='" + this.value + "']")
                            .datum()
                    ;
                    query.question = null;
                    query[key] = self.attr("disabled") ? null : datum;
                    update();
                  })
              .selectAll("option")
                .datum(function() { return this.dataset; }) // create datum from data-* attributes
                .attr("selected", function(d, i) {
                    return !i ? "selected" : null;
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
            grid
                .colorScale(colorScale[question.legend])
                .selectedColumn(question.value)
                .selectedColumnLabel(question.label)
              () // Call grid()
            ;
            toggleLegend(question.legend);
        } else {
            if(!(query.donor && query.recipient)) return;
            if(query.recipient.value === "Cand" && !query.branch) return;
            toggleLegend(query.donor.legend || "default");
            query.question = query.donor.value
              + "To"
              + query.recipient.value
              + "Limit"
              + (query.branch ? "_" + query.branch.value : "") + "_Max"
            ;
            query.label = query.donor.label + " to " + query.recipient.label
              + (query.branch ? "(" + query.branch.label + ")" : "")
            ;
            grid
                .colorScale(colorScale[query.donor.legend])
                .selectedColumn(query.question, true)
                .selectedColumnLabel(query.label)
              ()
            ;
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
