function Tabulus() {
    /*
    ** Private variables
    */
    var container
      , colorScale
      , grid
      , dropdown
      , section
      , query = { question: null }
    ;
    /*
    ** Main Function Object
    */
    function my(sel) {
        container = sel;
        dropdown = dropdown || sel.select("select")
            .on("change", function(d) {
                query.question = this.value;
                query.answer = d3.select(this)
                  .select("option[value='" + this.value + "']")
                    .datum()
                ;
                update();
              })
        ;
        dropdown.selectAll("option")
            .datum(function() { return this.dataset; })
          .each(function(d, i) {
              if(!i) {
                query.question = this.value;
                query.answer = d;
              }
            })
        ;
        update();
    } // my()

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
    * Private Helper Functions
    */
    function update() {
        toggleLegend(query.answer.legend);

        container.select(".field-description")
            .html(query.answer.note ? (query.answer.question + "*\n\n* " + query.answer.note) : query.answer.question)
        ;
        grid
            .colorScale(colorScale[query.answer.legend])
            .selectedColumn(query.question)
            .selectedColumnLabel(query.answer.label)
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
