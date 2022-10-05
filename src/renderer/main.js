import "~/css/styles.scss";

import PrefsScreen from "./PrefsScreen.svelte";
import SettingsScreen from "./SettingsScreen.svelte";
import AboutScreen from "./AboutScreen.svelte";
import NewScreensaverScreen from "./NewScreensaverScreen.svelte";
import EditorScreen from "./EditorScreen.svelte";

const actions = {
  "prefs": PrefsScreen,
  "settings": SettingsScreen,
  "about": AboutScreen,
  "new": NewScreensaverScreen,
  "editor": EditorScreen
};

const id = document.querySelector("body").dataset.id;
const klass = actions[id];

const app = new klass({
  target: document.getElementById("root"), // entry point in ../public/index.html
});

export default app;
