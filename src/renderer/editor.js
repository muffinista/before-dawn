import "~/css/styles.scss";

import { mount } from 'svelte';

import EditorScreen from "./EditorScreen.svelte";

const app = mount(EditorScreen, {
  target: document.getElementById("root")
});

export default app;
