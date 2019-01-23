import Vue from "vue";
import VueElectron from "vue-electron";
import VueObserveVisibility from "vue-observe-visibility";
import BootstrapVue from "bootstrap-vue"

import Prefs from "./Prefs";
import Watcher from "./Watcher";
import NewScreensaver from "./NewScreensaver";
import About from "./About";

import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-vue/dist/bootstrap-vue.css";
import "../css/styles.scss";


if (!process.env.IS_WEB) {
  Vue.use(require("vue-electron"));
}
Vue.config.productionTip = false;

Vue.use(VueElectron);
Vue.use(BootstrapVue);
Vue.use(VueObserveVisibility);

var actions = {
  "prefs": { components: { Prefs }, template: "<Prefs/>" },
  "editor": { components: { Watcher }, template: "<Watcher/>" },
  "new": { components: { NewScreensaver }, template: "<NewScreensaver/>" },
  "about": { components: { About }, template: "<About/>" }
}

var id = document.querySelector("body > div").id;
var opts = actions[id];

new Vue(opts).$mount("#" + id);
