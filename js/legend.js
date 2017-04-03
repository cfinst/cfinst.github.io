---
---
function Legend() {
    /*
    ** Private variables
    */
    var container
      , query
      , dispatch
      , data = { {% for section in site.data.sections %}
          "{{ section[0] }}": d3.nest().key(function(d) { return d.name; })
                .rollup(function(leaves) { return Object.assign.apply(null, leaves); })
                .object({{ section[1].legends | jsonify }}){% unless forloop.last %},{% endunless %}
        {% endfor %} }
      , englishUSLocale = d3.formatLocale({
        "decimal": ".",
        "thousands": ",",
        "grouping": [3],
        "currency": ["$", ""]
      })
      , commaFormat = englishUSLocale.format(",")
      , visibleValues
      , dataset
      , valueAccessor
    ;

    /*
    ** Main Function Object
    */
    function my() {
        var legendEntries = data[query.section][query.legend].scale;

        // Prune the legend items such that only values that are
        // visible in the visualization (present in the data)
        // are shown in the legend.
        if(visibleValues !== "all"){
          legendEntries = legendEntries.filter(function (d){
            return visibleValues.has(d.label)
          });
        }

        var li = container.selectAll("li")
            .data(legendEntries)
        ;
        li.exit().remove();
        li = li.enter()
          .append("li")
            .each(function() {
                var self = d3.select(this);
                self.append("svg")
                    .attr("role", "presentation")
                  .append("use")
                    .attr("xlink:href", "#cell")
                ;
                self.append("span")
                ;
              })
          .merge(li)
        ;

        li
            .each(function(d, i) {
                var self = d3.select(this);
                self.select("svg").attr("fill", d.color);
                self.select("span")
                    .text(d.label || "$" + commaFormat(d.min) + " - " + "$" + commaFormat(d.max))
                ;
            })
            .on("mouseover", function (d){
                var highlightData = dataset.filter(function (datum){
                    return valueAccessor(datum) === d.label;
                });
                dispatch.call("highlight", null, highlightData);
            })
            .on("mouseout", function (){
                dispatch.call("highlight", null, []);
            });
    } // my()

    /*
    ** Private Helper Functions
    */

    /*
    ** Private Utility Functions
    */

    /*
    ** API - Getter/Setter Methods
    */
    my.container = function (_){
        if(!arguments.length) return container;
        container = _;
        return my;
      } // my.container()
    ;
    my.query = function (_){
        if(!arguments.length) return query;
        query = _;
        return my;
      } // my.query()
    ;
    my.connect = function (_){
        if(!arguments.length) return dispatch;
        dispatch = _;
        return my;
      } // my.connect()
    ;

    // Sets the set of values to show in the legend.
    // If the values is "all", than all values are retained.
    // Otherwise the value is a D3 set containing data values
    // that should be retained in the legend (all others are not shown).
    my.visibleValues = function (_){
        if(!arguments.length) return visibleValues;
        visibleValues = _;
        return my;
      } // my.visibleValues()
    ;

    my.dataset = function (_){
        if(!arguments.length) return dataset;
        dataset = _;
        return my;
      } // my.dataset()
    ;

    my.valueAccessor = function (_){
        if(!arguments.length) return valueAccessor;
        valueAccessor = _;
        return my;
      } // my.valueAccessor()
    ;

    /*
    ** This is ALWAYS the LAST thing returned
    */
    return my;
} // Legend()
