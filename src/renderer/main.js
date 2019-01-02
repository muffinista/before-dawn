import Vue from "vue";
import VueElectron from "vue-electron";
import BootstrapVue from "bootstrap-vue"

import Prefs from "./Prefs";
import Watcher from "./Watcher";
import NewScreensaver from "./NewScreensaver";
import About from "./About";

import "bootstrap/dist/css/bootstrap.css"
import "bootstrap-vue/dist/bootstrap-vue.css"
import "../css/styles.scss";


if (!process.env.IS_WEB) {
  Vue.use(require("vue-electron"));
}
Vue.config.productionTip = false;

Vue.use(VueElectron);
Vue.use(BootstrapVue);

if ( document.getElementById('prefs') ) {
  // eslint-disable no-new 
  new Vue({
    components: { Prefs },
    template: "<Prefs/>"
  }).$mount("#prefs");
}

if ( document.getElementById('editor') ) {
  // eslint-disable no-new 
  new Vue({
    components: { Watcher },
    template: "<Watcher/>"
  }).$mount("#editor");
}

if ( document.getElementById('new') ) {
  // eslint-disable no-new 
  new Vue({
    components: { NewScreensaver },
    template: "<NewScreensaver/>"
  }).$mount("#new");
}

if ( document.getElementById('about') ) {
  // eslint-disable no-new 
  new Vue({
    components: { About },
    template: "<About/>"
  }).$mount("#about");
}
