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
        d3.selectAll("a[data-toggle='modal']")
            .each(function() {
                var self = d3.select(this)
                  , name = [query.section, self.attr("data-name")]
                  , id = name.join('-')
                  , uri = name.join('/')
                  , modalSelector = "#" + id + "-modal"
                  , modal = $(modalSelector)
                ;
                self
                    .attr("id", id + "-button")
                    .attr("data-target", modalSelector)
                    .attr("href", "../modals/" + uri + ".html")
                ;
                modal.on("loaded.bs.modal", setupTourButtons(modal));
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
                option = option.size() ? option : self.select("optgroup option");
                msg.set(key, option.datum());
                wiring.call("choice", this, msg);
              }) // onChange
        ;
        wiring.on("choice", function(arg) {
            arg.each(function(value, key) {
                if(value.disable) {
                  // e.g. Disable the "branch" if recipient is not Candidate
                    container.selectAll("select").each(function() {
                        var self = d3.select(this)
                          , name = self.attr("data-name")
                          , altname = "_" + name
                        ;
                        if(value.disable === name) {
                            if(this.disabled) return; // no need to act if already disabled
                            curry[altname] = this.value;
                            this.value = "";
                            this.disabled = true;
                        } else if(value.disable === altname) {
                            if(!this.disabled) return;
                            this.disabled = false;
                            this.value = curry[altname]
                              || self.select("optgroup option").node().value
                            ;
                        }
                      })
                    ;
                } // if(value.disable)
                // show the question if this is a question
                if(value.question) {
                    container.select(".field-description")
                        .html(value.question
                            + (value.note ? ("*\n\n* " + value.note) : "")
                          )
                    ;
                }
                curry[key] = value;
              })
            ;
            update();
          })
        ;
    } // setup()

    // Set the state for the various controls, based on the query
    function run_query() {
        var curr = (curry.question ? curry.question.value : curry._question) || "";
        if(curr && (query.question === curr)) return
        query.question = query.question || curr;

        if(container.selectAll(".chooser").size() > 1) { // Multiple dropdowns
            // Process as a multi-dropdown tab
            var split = query.question.split("_Max")[0].split("To")
              , receiver = (split[1] || "").split('Limit')
            ;
            query.donor = split[0];
            query.recipient = receiver[0];
            query.branch = (receiver[1] || "").split("_")[1];
        }
        container.selectAll(".chooser").each(function() {
            var self = d3.select(this)
              , name = self.attr("data-name")
              , def = this.value
            ;
            this.value = query[name] || def;
            self.on("change").apply(this, []);
        })
    } // run_query()

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
            if(curry.donor.value === "StateP" && curry.recipient.value === "Party")
                query.legend = "Party2Party";
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
        run_query(); // run the query through the system

        return my;
      } // my.query()
    ;

    /*
    ** This is ALWAYS the last thing returned
    */
    return my;
} // Tabulus()
