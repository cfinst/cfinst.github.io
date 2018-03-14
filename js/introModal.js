---
---

// This function starts the Shepherd tour.
function takeTour(){
    var tour = new Shepherd.Tour({
        defaults: {
              classes: 'shepherd-theme-arrows'
            , scrollTo: true
            , showCancelLink: true
          }
      })
    ;
  {% comment %}Create the tour using Jekyll{% endcomment %}
  {% for stop in site.data.tour %}
    tour.addStep('step{{ forloop.index }}', {
        text: '{{ stop.text }}'
        , attachTo: '{{ stop.node }} {% if stop.orientation %}{{ stop.orientation }}{% else %}bottom{% endif %}'
        , buttons: [
              {
                  text: 'Exit'
                , action: tour.complete
              }
          {% unless forloop.first %}
            , {
                  text: 'Back'
                , action: tour.back
              }
          {% endunless %}
          {% unless forloop.last %}
            , {
                  text: 'Next'
                , action: tour.next
              }
          {% endunless %}
          ]
    });
  {% endfor %}
    tour.start();
}

// Sets up the "Take the tour" button.
// Expects the `modal` argument to be a jQuery selection
// of the Bootstrap modal that contains the button skeleton.
// We define the classes and text here, in JavaScript,
// so we can change all the buttons at once by modifying only this code.
function setupTourButtons (modal) {
    return function () {
        var container = d3.select(modal[0])
          .select(".tour-guidance-container");

        container.append("button")
            .attr("type", "button")
            .classed("btn btn-primary btn-block", true)
            .text("Take the tour!")
            .style("margin-bottom", "5px")
            .on("click", function (event) {
                modal.modal("hide");
                takeTour();
            });

        container.append("iframe")
            .attr("width", 560)
            .attr("height", 315)
            .attr("src", "https://www.youtube.com/embed/NWDM79Cehlc")
            .attr("frameborder", 0)
            .attr("allowfullscreen", true)
            .style("margin-bottom", "5px");
    };
}

// This triggers the introduction popup
// that shows only the first time the page is loaded.
// This function should be invoked once, on page load.
function triggerIntroModal(){

    // Determine whether or not the current user has seen
    // this page any time in the previous 24 hours, using cookies.
    // Cookie documentation at https://developer.mozilla.org/en-US/docs/Web/API/Document/cookie
    var pageSeen = document.cookie.indexOf("pageSeen") !== -1;

    // Only show the intro modal if the current user
    // is visiting the page for the first time.
    if(!pageSeen){
        var introModal = $("#intro-modal")

        // Show the modal, via Bootstrap"s API.
        // See http://getbootstrap.com/javascript/#via-javascript
        introModal.modal({

            // This option tells Bootstrap to load the content from this file,
            // which is compiled using Jekyll based on configurable content
            // from _modals/intro.md.
            remote: "/modals/intro.html"
        });

        // The cookie will expire after one day.
        var expiryDate = d3.timeDay.offset(new Date, 1);

        // Track that the current user has visited this page using cookies.
        document.cookie = "pageSeen=true;expires=" + expiryDate.toUTCString();

        // Add an event listener to the "Take tour" button after the modal loads.
        // `loaded` event documented at http://getbootstrap.com/javascript/#modals-events
        introModal.on("loaded.bs.modal", setupTourButtons(introModal));
    }
}
