(function() {
  var addClassToList = function(lookup, klass) {
    var list = document.querySelectorAll(lookup);
    for ( var i = 0; i < list.length; i++ ) {
      list[i].classList.add(klass);
    }  
  };
  var removeClassFromList = function(lookup, klass) {
    var list = document.querySelectorAll(lookup);
    for ( var i = 0; i < list.length; i++ ) {
      list[i].classList.remove(klass);
    }
  };
  
  var updateDisplay = function() {
    var a = document.querySelector(".tab-item.active a");
    var klass = a.getAttribute("href");

    removeClassFromList(".window-content .pane-group", "hide");
    addClassToList(".window-content .pane-group:not(." + klass + ")", "hide");
  };
  
  var handleTabClick = function() {
    var a = this.querySelector("a");
    document.querySelector(".tab-item.active").classList.remove("active");

    var p = a.parentNode;
    p.classList.add("active");

    updateDisplay();
  };
  
  var tabs = document.querySelectorAll(".tab-group > .tab-item");
  for ( var i = 0; i < tabs.length; i++ ) {
    tabs[i].addEventListener('click', handleTabClick, false);
  }

  // only need this if we don't pre-set css classes in prefs html
  //updateDisplay();
  

})();
