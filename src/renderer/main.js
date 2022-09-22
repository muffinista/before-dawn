// import { createApp } from "vue";

// import PrefsScreen from "./PrefsScreen";
// import SettingsScreen from "./SettingsScreen";
// import EditorScreen from "./EditorScreen";
// import NewScreensaverScreen from "./NewScreensaverScreen";
// import AboutScreen from "./AboutScreen";

// import "@/../css/styles.scss";

// const actions = {
//   "prefs": { components: { PrefsScreen }, template: "<PrefsScreen/>" },
//   "settings": { components: { SettingsScreen }, template: "<SettingsScreen/>" },
//   "editor": { components: { EditorScreen }, template: "<EditorScreen/>" },
//   "new": { components: { NewScreensaverScreen }, template: "<NewScreensaverScreen/>" },
//   "about": { components: { AboutScreen }, template: "<AboutScreen/>" }
// };


// const id = document.querySelector("body").dataset.id;
// const opts = actions[id];

// createApp(opts).mount("body");

// import App from "./App.svelte";
import PrefsScreen from "./PrefsScreen.svelte";
import SettingsScreen from "./SettingsScreen.svelte";
import AboutScreen from "./AboutScreen.svelte";
import NewScreensaverScreen from "./NewScreensaverScreen.svelte";
import EditorScreen from "./EditorScreen.svelte";

import "~/css/styles.scss";

const actions = {
  "prefs": PrefsScreen,
  "settings": SettingsScreen,
  "about": AboutScreen,
  "new": NewScreensaverScreen,
  "editor": EditorScreen
};

const id = document.querySelector("body").dataset.id;
const klass = actions[id];
//const opts = actions[id];

const app = new klass({
  target: document.getElementById("root"), // entry point in ../public/index.html
});

export default app;
