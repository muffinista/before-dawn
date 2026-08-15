import "~/css/styles.scss";

import { mount } from 'svelte';

import PrefsScreen from "./PrefsScreen.svelte";

const app = mount(PrefsScreen, {
  target: document.getElementById("root")
});

export default app;
