<div class="input-group">
  <input
    type="text"
    readonly="readonly"
    bind:value="{source}"
  >
  <button
    type="button"
    class="pick"
    on:click="{showPathChooser}"
  >
    ...
  </button>
  <button
    type="button"
    class="clear"
    on:click="{clearLocalSource}"
  >
    X
  </button>
</div>

<script>
import { createEventDispatcher } from "svelte";

const dispatch = createEventDispatcher();
export let source;

async function showPathChooser() {
  const result = await window.api.showOpenDialog();
  handlePathChoice(result);
}

function handlePathChoice(result) {
  if ( result === undefined || result.canceled ) {
    return;
  }

  const choice = result.filePaths[0];
  source = choice;

  dispatch("picked", {
    folder: source
  });
}

function clearLocalSource() {
  source = "";
}
</script>
