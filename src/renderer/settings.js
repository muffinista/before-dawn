import "~/css/styles.scss";

import { mount } from 'svelte';

import SettingsScreen from "./SettingsScreen.svelte";

const app = mount(SettingsScreen, {
  target: document.getElementById("root")
});

export default app;
