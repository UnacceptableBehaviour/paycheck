// high level functionality
// https://developer.mozilla.org/en-US/docs/Web/API/Page_Visibility_API
// https://developer.mozilla.org/en-US/docs/Web/API/Document/visibilitychange_event
//
// detect when app goes in/out of visibility


// Set the name of the hidden property and the change event for visibility
var hidden, visibilityChange;                 // document[hidden] 
if (typeof document.hidden !== "undefined") { // Opera 12.10 and Firefox 18 and later support 
  hidden = "hidden";
  visibilityChange = "visibilitychange";                  // event name for version
} else if (typeof document.msHidden !== "undefined") {
  hidden = "msHidden";
  visibilityChange = "msvisibilitychange";                // event name for version
} else if (typeof document.webkitHidden !== "undefined") {
  hidden = "webkitHidden";
  visibilityChange = "webkitvisibilitychange";            // event name for version
}
 

var appVisibilityState = 'waitingToLoad';
var lostFocus = null;
var gainedFocus = null;

export function registerLostFocusCallback(callback) {
  lostFocus = callback;
  console.log('registered LostFocusCallback');
}

export function registerGainedFocusCallback(callback) {
  gainedFocus = callback;
  console.log('registered GainedFocusCallback');
}



// if hiding store payCheck state
// if showing, display payCheck state
function handleVisibilityChange() {
  
  if (document[hidden]) {
    // not visible store data
    appVisibilityState = 'lostFocus';
    console.log(`GONE DARK - storing data: ${appVisibilityState} <`);
    if (lostFocus) {
      lostFocus();
    } else {
      console.log('WARNING LostFocusCallback not registered'); // raise
    }
        
  } else {
    // visible refresh screen
    appVisibilityState = 'gainedFocus';    
    console.log(`HELOOO THERE I'm BACK - no action needed: ${appVisibilityState}`);
    if (gainedFocus) {
      gainedFocus();
    } else {
      console.log('WARNING GainedFocusCallback not registered'); // raise
    }
  }
}




// Warn if the browser doesn't support addEventListener or the Page Visibility API
if (typeof document.addEventListener === "undefined" || hidden === undefined) {
  console.log("** W A R N I N G ** addEventListener or the Page Visibility API - NOT SUPPORTED: Requires browser such as Google Chrome or Firefox, that supports the Page Visibility API.");
} else {
  // Handle page visibility change   
  document.addEventListener(visibilityChange, handleVisibilityChange, false);
}
