function Tabulus() {
    /*
    ** Private variables
    */
    var container
      , dropdowns
      , signal
      , wiring = d3.dispatch("choice")
      , query = {}
      , curry = {}
    ;
    /*
    ** Main Function Object
    */
    function my(sel) {
      if(!container) initialize(sel);

      d3.map(query).each(function(value, key) {
          container.select("select.chooser-" + key)
              .each(function(d, i) { this.value = value; })
          ;
      });
      // Call the "change" handler function for the dropdowns to trigger render
      container.selectAll("select").each(function() {
          d3.select(this).on("change").apply(this, []);
        })
      ;
      wiring.on("choice", function(arg) {
        console.log("chose", arg);
          arg.each(function(value, key) {
              container.selectAll("select")
              // disable neighbor dropdowns that need to be disabled
                  .property("disabled", function() {
                      return d3.select(this).attr("data-name") === value.disable;
                    })
              ;
              // show the question if this is a question
              if(value.question) {
                  container.select(".field-description")
                      .html(value.question + (
                          value.note
                            ? ("*\n\n* " + value.note)
                            : ""
                        ))
                  ;
              }
              curry[key] = value;
            })
          ;
          update();
        })
      ;
    } // my()


    /*
    * Private Helper Functions
    */
    function initialize(sel) {
        container = container || sel;
        dropdowns = dropdowns || container.selectAll("select");

        dropdowns.selectAll("option")
            // create datum for each option from data-* attributes
            .datum(function() { return this.dataset; })
             // automatically select the first option
            .property("selected", function(d, i) {
                return !i ? "selected" : null;
              })
        ;
        dropdowns
            .on("change", function() {
                // Q&A dropdowns have no id, just the class "question"
                // The contrib limits dropdowns have unique identifiers
                var self = d3.select(this)
                  , key = self.attr("data-name")
                  , option = self.select("option[value='" + this.value + "']")
                  , msg = d3.map()
                ;
                key = self.attr("disabled") ? "_" + key : key;
                option = option.size() ? option : self.select("option");
                msg.set(key, option.datum());
                wiring.call("choice", this, msg);
              }) // onChange
        ;
    } // initialize()

    function update() {
        if(!curry.question) {
            if(!(curry.donor && curry.recipient)) return;
            if(curry.recipient.value === "Cand" && !curry.branch) return;

            query.question = curry.donor.value
              + "To"
              + curry.recipient.value
              + "Limit"
              + (curry.recipient.disable === "branch"
                  ? ""
                  : "_" + curry.branch.value
                )
              + "_Max"
            ;
            query.label = curry.donor.label + " to "
              + curry.recipient.label
              + (
                  curry.recipient.disable == "branch"
                    ? ""
                    : " (" + curry.branch.label + ")"
                )
            ;
            query.legend = curry.donor.legend || "default";
        } else {
            query.question = curry.question.value;
            query.label = curry.question.label;
            query.legend = curry.question.legend;
        }
        console.log("sending", query);
        signal.call("query", this, query);
    } // update()

    /*
    ** API - Getter/Setter Methods
    */
    my.container = function(_) {
        if(!arguments.length) return container;
        container = _;
        return my;
      } // my.container()
    ;
    my.connect = function (_){
        if(!arguments.length) return signal;
        signal = _;
        return my;
      } // my.connect()
    ;
    my.query = function (_){
        if(!arguments.length) return query;
        query = _;
        return my;
      } // my.query()
    ;

    /*
    ** This is ALWAYS the last thing returned
    */
    return my;
} // Tabulus()
