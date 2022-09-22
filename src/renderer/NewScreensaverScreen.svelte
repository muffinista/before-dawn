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

      <div id="saver-form">
        <form>
          <div class="form-group">
            <label for="name">Name:</label>
            <input
              bind:value="{saver.name}"
              type="text"
              name="name"
      
              required
            >
            <div class="hint">
              The name of your screensaver.
            </div>
          </div>
          
          <div class="form-group">
            <label for="name">Description:</label>
            <input
              bind:value="{saver.description}"
              type="text"
              name="description"
      
              required
            >
            <div class="hint">
              A brief description of your screensaver.
            </div>
          </div>
          <div class="form-group">
            <label for="aboutUrl">About URL:</label>
            <input
              bind:value="{saver.aboutUrl}"
              type="text"
              name="aboutUrl"
      
            >
            <div class="hint">
              If you have a URL with more details about your work, put it here!
            </div>
          </div>
          <div class="form-group">
            <label for="author">Author:</label>
            <input
              bind:value="{saver.author}"
              type="text"
              name="author"
      
            >
            <div class="hint">
              The author of this screensaver.
            </div>
          </div>
    
          <div class="form-group">
            <h3>Requirements:</h3>
            <input
              type="checkbox"
              name="requirements"
              bind:group="{saver.requirements}"
              value="screen"
            >
            <label for="screen">Screen capture</label>
            <div class="hint">
              This screensaver will be sent an image of the desktop
            </div>
          </div>
        </form>
      </div>
      {:else}
      <div class="need-setup-message">
        <p>
          Screensavers in Before Dawn are web pages, so if you can use HTML, 
          CSS, and/or Javascript, you can make your own screensaver. But before 
          you can do that, you'll need to set a local directory!
        </p>
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
import { onMount } from "svelte";

let prefs = {};
let screenshot = undefined;
let saver = {
  requirements: ["screen"]
};
let disabled = false;

$: canAdd = prefs !== undefined && prefs.localSource !== undefined && prefs.localSource !== "";
// $: {
//   console.log(saver);
// }

onMount(async () => {
  prefs = await window.api.getPrefs();
  screenshot = await window.api.getScreenshot();
});

function closeWindow() {
  window.api.closeWindow("addNew");
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
