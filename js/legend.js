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
          "{{ section[0] }}": {{ section[1].legends | jsonify }}{% unless forloop.last %},{% endunless %}
        {% endfor %} }
    ;

    /*
    ** Main Function Object
    */
    function my() {
        console.log(data[query.section], query.legend)
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
      } // my.container()
    ;
    my.connect = function (_){
        if(!arguments.length) return dispatch;
        dispatch = _;
        return my;
      } // my.connect()
    ;
    /*
    ** This is ALWAYS the LAST thing returned
    */
    return my;
} // Legend()
