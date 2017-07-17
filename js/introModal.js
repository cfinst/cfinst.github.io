---
---
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
        // Show the modal, via Bootstrap"s API.
        // See http://getbootstrap.com/javascript/#via-javascript
        $("#intro-modal").modal({

            // This option tells Bootstrap to load the content from this file,
            // which is compiled using Jekyll based on configurable content
            // from _modals/intro.md.
            remote: "/modals/intro.html"
        });
        // The cookie will expire after one day.
        var expiryDate = d3.timeDay.offset(new Date, 1);

        // Track that the current user has visited this page using cookies.
        document.cookie = "pageSeen=true;expires=" + expiryDate.toUTCString();
    }
    // Run the tour always, until a "Start Tour" button is added to intro-popup.
    tour = new Shepherd.Tour({
        defaults: {
              classes: 'shepherd-theme-arrows'
            , scrollTo: true
          }
      })
    ;
  {% for stop in site.data.tour %}
  console.log('{{ stop }}', "{{ stop.node }}")
    tour.addStep('step{{ forloop.index }}', {
        text: '{{ stop.text }}'
        , attachTo: '{{ stop.node }} {{ stop.orientation }}'
        , buttons: [
              {
                  text: {% unless forloop.last %}'Next'{% else %}'Start Over'{% endunless %}
                , action: {% unless forloop.last %}tour.next{% else %}tour.first{% endunless %}
              }
          ]
    });
  {% endfor %}
    tour.start();
}
