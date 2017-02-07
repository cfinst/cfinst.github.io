function Tabulus() {
    /*
    ** Private variables
    */
    var container
      , colorScale
      , grid
      , dropdown
      , section
      , query = { question: null, label: null }
    ;
    /*
    ** Main Function Object
    */
    function my(sel) {
        container = sel;
        dropdown = dropdown || sel.select("select")
            .on("change", function() { update(this.value); })
        ;
        dropdown.selectAll("option")
            .datum(function() { return this.dataset; })
            .each(function(d) {
              d3.select(this).select("optgroup").selectAll("option")
                  .attr("selected", function(d, i) {
                      return !i ? "selected" : null;
                    })
              ;
              var key = this.id.split("chooser-")[1];
              query[key] = this.value;
            })
        ;
    } // my()

    /*
    * Private Helper Functions
    */
    function update(val) {
        datum = dropdown.select("option[value='" + val + "']").datum();
        container.selectAll(".legend ul")
            .style("display", function() {
                return d3.select(this).classed("legend-" + datum.legend)
                  ? null
                  : "none"
                ;
              })
        ;
        container.select(".field-description")
            .html(datum.note ? (datum.question + "*\n\n* " + datum.note) : datum.question)
        ;
        grid
            .colorScale(colorScale[datum.legend])
            .selectedColumn(val)
            .selectedColumnLabel(val)
          () // Call grid()
        ;
    } // update()


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

    /*
    ** This is ALWAYS the last thing returned
    */
    return my;
} // Tabulus()
