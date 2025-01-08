import "~/css/styles.scss";

import { mount } from 'svelte';

import PrefsScreen from "./PrefsScreen.svelte";
import SettingsScreen from "./SettingsScreen.svelte";
import AboutScreen from "./AboutScreen.svelte";
import NewScreensaverScreen from "./NewScreensaverScreen.svelte";
import EditorScreen from "./EditorScreen.svelte";
// import * as Sentry from "@sentry/electron/renderer";

// if ( process.env.SENTRY_DSN !== undefined ) {
//   Sentry.init({
//     dsn: process.env.SENTRY_DSN,
//     enableNative: false,
//     onFatalError: console.log
//   });  
// }

const actions = {
  "prefs": PrefsScreen,
  "settings": SettingsScreen,
  "about": AboutScreen,
  "new": NewScreensaverScreen,
  "editor": EditorScreen
};

const id = document.querySelector("body").dataset.id;
const klass = actions[id];

const app = mount(klass, {
  target: document.getElementById("root"), // entry point in ../public/index.html
});

export default app;
