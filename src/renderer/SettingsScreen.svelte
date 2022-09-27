<div id="settings">
  {#if prefs}
  <div>
    <div id="prefs-form">
      <h1>Settings</h1>
      <form class="grid">
        <div class="options">
          <div class="form-check">
            <label>
              <input
                id="lock"
                :checked="lock"
                type="checkbox"
                class="form-check-input"
              >
              Lock screen after running?
            </label>
            <small class="form-text text-muted">
              When the screen saver turns off, the user will need to enter their password.
            </small>
          </div>
  
          <div class="form-check">
            <label>
              <input
                id="disableOnBattery"
                :checked="disableOnBattery"
                type="checkbox"
                class="form-check-input"
              >
              Disable when on battery?
            </label>
            <small class="form-text text-muted">
              If checked, Before Dawn won't
              activate when you're not plugged in -- your
              computer's power settings can blank the screen
              instead.
            </small>
          </div>
          <!-- ' -->
          <div class="form-check">
            <label>
              <input
                :checked="auto_start"
                type="checkbox"
                class="form-check-input"
              >
              Auto start on login?
            </label>
            <small class="form-text text-muted">
              If checked, Before Dawn will start when your computer starts.
            </small>
          </div>
  
          <div class="form-check">
            <label>
              <input
                id="primary-display"
                :checked="runOnSingleDisplay"
                type="checkbox"
                class="form-check-input"
              >
              Only run on the primary display?
            </label>
            <small class="form-text text-muted">
              If you have multiple displays, only run on the primary one.
            </small>
          </div>
        </div>
      </form>
    </div> 
  </div>
  <div>
    {#if hasScreensaverUpdate === true}
      <button
        class="btn reset-to-defaults"
        on:click="{downloadScreensaverUpdates}"
      >
        Download screensaver updates
        {#if downloadingUpdates}
          <Spinner />
        {/if}
      </button>
    {/if}
  </div>
  <div>
    <div id="advanced-prefs-form">
      <h1>Advanced Options</h1>
      <p class="form-text text-muted">
        Be careful with these!
      </p>
      <form>
        <div class="form-group full-width">
          <label for="localSource">Local Source:</label>
          <FolderChooser bind:source="{prefs.localSource}" />
          <small class="form-text text-muted">
            We will load screensavers from any directories listed here. Use this to add your own screensavers!
          </small>
        </div>
  
        <div class="form-group">
          <label for="hotkey">Global hotkey:</label>
          <input
            bind:value="{prefs.launchShortcut}"
            type="text"
            name="hotkey"
            readonly="readonly"
            class="form-control form-control-sm"
            on:keydown="{updateHotkey}"
          >
          <small class="form-text text-muted">
            Enter a key combination that will be used to run a screensaver.
          </small>
        </div>
      </form>
    </div>
  </div>
  {/if}

  <footer class="footer ">
    <div>
      <button
        class="btn reset-to-defaults"
        on:click="{resetToDefaults}"
      >
      Reset to Defaults
      </button>
    </div>
    <div>
      <button
        class="btn close-window"
        disabled="{disabled}"
        on:click="{closeWindow}"
      >
      Cancel
      </button>
      <button
        class="btn save"
        disabled="{disabled}"
        on:click="{saveDataClick}"
      >
      Save
      </button>
    </div>
  </footer>
</div> <!-- #settings -->

<script>
import { onMount } from "svelte";
import Spinner from "@/components/Spinner.svelte";
import Notarize from "@/components/Notarize";
import FolderChooser from "@/components/FolderChooser.svelte";

let prefs = undefined;
let release = undefined;
let disabled = false;
let hasScreensaverUpdate = false;
let downloadingUpdates = false;

// $: {
//   console.log(prefs);
// }

onMount(async () => {
  prefs = await window.api.getPrefs();
  release = await window.api.getScreensaverPackage();

  hasScreensaverUpdate = typeof(release) !== "undefined" && release.is_update === true;
});

async function downloadScreensaverUpdates() {
  if ( downloadingUpdates === true ) {
    return;
  }

  try {
    downloadingUpdates = true;
    await window.api.downloadScreensaverPackage();
    new Notarize({timeout: 1000}).show("Screensavers updated!");
  }
  finally {
    downloadingUpdates = false;
  }
}

async function resetToDefaults() {
  const result = await window.api.resetToDefaultsDialog();
  if ( result === 1 ) {
    prefs = await window.api.getDefaults();        
    await handleSave("Settings reset");
  }
}

async function showPathChooser() {
  const result = await window.api.showOpenDialog();
  handlePathChoice(result);
}

function handlePathChoice(result) {
  if ( result === undefined || result.canceled ) {
    return;
  }

  const choice = result.filePaths[0];
  prefs.localSource = choice;
}

function clearLocalSource() {
  prefs.localSource = "";
}

function updateHotkey(event) {
  if ( event.key == "Control" || event.key == "Shift" || event.key == "Alt" || event.key == "Meta" ) {
    return;
  }

  let output = [];
  if ( event.ctrlKey ) {
    output.push("Control");
  }
  if ( event.altKey ) {
    output.push("Alt");
  }
  if ( event.metaKey) {
    output.push("Command");
  }
  if ( event.shiftKey ) {
    output.push("Shift");
  }

  if ( output.length === 0 ) {
    if ( event.key == "Backspace" ) {
      event.target.value = "";
    }

    return;
  }

  output.push(`${event.key}`.toUpperCase());
  output = output.join("+");

  event.target.value = output;
}

function closeWindow() {
  window.api.closeWindow("settings");
}

async function saveDataClick() {
  handleSave("Changes saved!");
  closeWindow();
}

async function handleSave(output) {
  disabled = true;

  try {
    // https://forum.vuejs.org/t/how-to-clone-property-value-as-simple-object/40032/2
    const clone = JSON.parse(JSON.stringify(prefs));
    await window.api.updatePrefs(clone);
    await window.api.saversUpdated();

    window.api.setAutostart(prefs.auto_start);
    window.api.setGlobalLaunchShortcut(prefs.launchShortcut);
  }
  catch(e) {
    output = "Something went wrong!";
  }

  disabled = false;
  new Notarize({timeout: 1000}).show(output);
}
</script>

<style>
</style>
