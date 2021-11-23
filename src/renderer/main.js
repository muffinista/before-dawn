import { createApp } from "vue";

import PrefsScreen from "./PrefsScreen";
import SettingsScreen from "./SettingsScreen";
import EditorScreen from "./EditorScreen";
import NewScreensaverScreen from "./NewScreensaverScreen";
import AboutScreen from "./AboutScreen";

import "@/../css/styles.scss";

const actions = {
  "prefs": { components: { PrefsScreen }, template: "<PrefsScreen/>" },
  "settings": { components: { SettingsScreen }, template: "<SettingsScreen/>" },
  "editor": { components: { EditorScreen }, template: "<EditorScreen/>" },
  "new": { components: { NewScreensaverScreen }, template: "<NewScreensaverScreen/>" },
  "about": { components: { AboutScreen }, template: "<AboutScreen/>" }
};


const id = document.querySelector("body").dataset.id;
const opts = actions[id];

createApp(opts).mount("body");
