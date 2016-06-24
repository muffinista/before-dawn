window.addEventListener("load", function() {
  var slidersRound = document.querySelectorAll(".slider.slider-round");
  for (var i = 0; i < slidersRound.length; i++) {
    sliderHighlightArea(slidersRound[i]);
  }
  var slidersVertical = document.querySelectorAll(".slider.slider-vertical");
  for (var i = 0; i < slidersVertical.length; i++) {
    slidersVertical[i].style.marginBottom = slidersVertical[i].offsetWidth + "px";
  }
}, false);
function sliderHighlightArea(e) {
  if (e.min == "") {
    e.min = 0;
  }
  if (e.max == "") {
    e.max = 100;
  }
  e.addEventListener("input", function() {
    this.sliderVisualCalc();
  }, false);
  e.sliderVisualCalc = function() {
    this.style.backgroundSize = (100 * ((this.value - this.min) / (this.max - this.min))) + "% 100%";
  }
  e.sliderVisualCalc();
}
