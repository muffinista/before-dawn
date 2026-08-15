import "~/css/styles.scss";

import { mount } from 'svelte';

import AboutScreen from "./AboutScreen.svelte";

const app = mount(AboutScreen, {
  target: document.getElementById("root")
});

export default app;
