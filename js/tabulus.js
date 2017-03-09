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
      if(!container) setup(sel);

      wiring.on("choice", function(arg) {
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
    // Setup the data and callbacks for the user input controls
    function setup(sel) {
        container = container || sel;
        dropdowns = dropdowns || container.selectAll("select");

        // create a datum object for each option from data-* attributes
        dropdowns.selectAll("option")
            .datum(function() { return this.dataset; })
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
    } // setup()

    // Set the state for the various controls, based on the query
    function initialize() {
        if (curry.question){ // Process this as a Q&A field
            // If the question request matches our current question, exit
            if(query.question === curry.question.value) return;
        } else if (curry._question) { // Process this as a multi-dropdown tab
            // If the question request matches our current combination, exit
            if(query.question === curry._question) return;
        }
        if(!query.question)
            // Spark all the dropdowns
            dropdowns.each(function(d, i) {
                d3.select(this).on("change").apply(this, []);
              })
            ;

        var inputs = container.selectAll(".chooser").size();
        console.log(inputs)
        if(inputs > 1) { // Multiple dropdowns
            // Process as a multi-dropdown tab
            var split = query.question.split("_Max")[0].split("To")
              , q = { donor: split[0] }
              , receiver = split[1].split('Limit')
            ;
            q.recipient = receiver[0];
            q.branch = receiver[1] || null;

            d3.keys(q).forEach(function(k) {
                var dd = container.select(".chooser[data-name='" + k +  "']")
                  , def = dd.select("option").node().value
                ;
                console.log(k, dd, def);
                dd.node().value = q[k] || null;
                dd.node().value = dd.node().value || def;
                dd.each(function() { d3.select(this).on("change").apply(this, []); });
              })
            ;
        } else if(inputs == 1) { // Process this as a Q&A tab (single dropdown)
            var dd = container.select(".chooser[data-name='question']")
              , def = dd.select("option").node().value
            ;
            dd.node().value = query.question || null;
            dd.node().value = dd.node().value || def;
            dd.each(function() { d3.select(this).on("change").apply(this, []); });
        }

    } // initialize()

    // Update the query from the states of the various controls
    function update() {
        if(!curry.question) {
            if(!(curry.donor && curry.recipient)) return;
            if(curry.recipient.value === "Cand" && !curry.branch) return;

            curry._question = query.question = curry.donor.value
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
        // if there's a new question, set the state
        initialize();

        return my;
      } // my.query()
    ;

    /*
    ** This is ALWAYS the last thing returned
    */
    return my;
} // Tabulus()
