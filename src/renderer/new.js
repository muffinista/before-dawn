import "~/css/styles.scss";

import { mount } from 'svelte';

import NewScreensaverScreen from "./NewScreensaverScreen.svelte";

const app = mount(NewScreensaverScreen, {
  target: document.getElementById("root")
});

export default app;
