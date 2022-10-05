<div id="new">
  <div class="content">
    <div>
      <h1>New Screensaver</h1>
      {#if canAdd}
        <p>
          Screensavers in Before Dawn are web pages, so if you can use HTML, 
          CSS, and/or Javascript, you can make your own screensaver.
        </p>

        <p>
          Use this form to create a new screensaver. A template will be
          added to the system that you can fill in with your code.
        </p>
        <SaverForm bind:saver></SaverForm>
      {:else}
      <div class="need-setup-message">
        <p>
          Screensavers in Before Dawn are web pages, so if you can use HTML, 
          CSS, and/or Javascript, you can make your own screensaver. But before 
          you can do that, you'll need to set a local directory!
        </p>

        <form>
          <div class="form-group full-width">
            <label for="localSource">Local Source:</label>
            <FolderChooser bind:source="{prefs.localSource}" on:picked="{updatePrefs}" />
            <small class="form-text text-muted">
              We will load screensavers from any directories listed here. Use this to add your own screensavers!
            </small>
          </div>
        </form>
      </div>
      {/if}
    </div>
  </div>
  <footer class="footer">
    <div>
      <button
        class="btn cancel"
        on:click="{closeWindow}"
      >
        Cancel
      </button>
      <button
        class="btn save"
        disabled="{disabled || !canAdd}"
        on:click="{saveData}"
      >
        Save
      </button>
    </div>
  </footer>
</div> <!-- #new -->

<script>
import SaverForm from "./components/SaverForm.svelte";
import FolderChooser from "@/components/FolderChooser.svelte";
import { onMount } from "svelte";

let prefs = {};
let screenshot = undefined;
let saver = {
  requirements: ["screen"]
};
let disabled = false;

$: canAdd = prefs !== undefined && prefs.localSource !== undefined && prefs.localSource !== "";

onMount(async () => {
  prefs = await window.api.getPrefs();
  screenshot = await window.api.getScreenshot();
});

function closeWindow() {
  window.api.closeWindow("addNew");
}

async function updatePrefs() {
  const clone = JSON.parse(JSON.stringify(prefs));   
  return await window.api.updatePrefs(clone);
}

async function saveData() {
  if ( document.querySelectorAll(":invalid").length > 0 ) {
    var form = document.querySelector("form");
    form.classList.add("submit-attempt");

    return;
  }

  disabled = true;
  // https://forum.vuejs.org/t/how-to-clone-property-value-as-simple-object/40032/2
  const clone = JSON.parse(JSON.stringify(saver));
  const data = await window.api.createScreensaver(clone);

  window.api.saversUpdated();

  window.api.openWindow("editor", {
    src: data.dest,
    screenshot
  });
  window.api.closeWindow("addNew");
}
</script>
