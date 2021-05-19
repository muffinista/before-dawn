import { createApp } from "vue";

import Prefs from "./Prefs";
import Settings from "./Settings";
import Editor from "./Editor";
import NewScreensaver from "./NewScreensaver";
import About from "./About";

import "@/../css/styles.scss";

var actions = {
  "prefs": { components: { Prefs }, template: "<Prefs/>" },
  "settings": { components: { Settings }, template: "<Settings/>" },
  "editor": { components: { Editor }, template: "<Editor/>" },
  "new": { components: { NewScreensaver }, template: "<NewScreensaver/>" },
  "about": { components: { About }, template: "<About/>" }
};


var id = document.querySelector("body").dataset.id;
var opts = actions[id];

createApp(opts).mount("body");
