// This triggers the introduction popup
// that shows only the first time the page is loaded.
// This function should be invoked once, on page load.
function triggerIntroModal(){

  // TODO get from cookie.
  var pageSeen = false;

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

    // TODO set cookie here:
    // Track that the current user has visited this page.
  }
}
