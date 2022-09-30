<!-- #editor -->
<script>
  import Notarize from "@/components/Notarize";
  import SaverForm from "./components/SaverForm.svelte";
  import SaverOptions from "@/components/SaverOptions.svelte";
  import SaverOptionInput from "@/components/SaverOptionInput.svelte";

  import ReloadIcon from "./components/icons/ReloadIcon.svelte";
  import FolderIcon from "@/components/icons/FolderIcon.svelte";
  import SaveIcon from "./components/icons/SaveIcon.svelte";
  import BugIcon from "./components/icons/BugIcon.svelte";

  import { onMount } from "svelte";
  let size = undefined;
  let saver = {options: [], requirements: []};
  let options = [];
  let optionValues = {};
  let disabled = false;
  let lastIndex = 0;
  let previewUrl = undefined;

  $: validOptions = saver?.options?.filter((o) => o.name !== "");
  $: params = new URLSearchParams(document.location.search);
  $: src = params.get("src");
  $: screenshot = params.get("screenshot");

  onMount(async () => {
    size = await window.api.getDisplayBounds();
    saver = await window.api.loadSaver(src);

    if (saver.settings === undefined) {
      saver.settings = {};
    }

    options = saver.options;
    lastIndex = saver.options.length;

    window.api.watchFolder(src, updatePreview);
    addEventListener("resize", updatePreview);

    // wait a tick so that all our required elements actually exist
    setTimeout(() => {
      updatePreview();
    }, 0);
  });

  function addSaverOption() {
    saver.options.push({
      index: lastIndex + 1,
      name: `New Option ${lastIndex + 1}`,
      type: "slider",
      description: "",
      min: "1",
      max: "100",
      default: "75",
    });

    lastIndex += 1;
    saver = saver;
  }

  function optionDefaults() {
    var result = {};
    for (var i = 0; i < options.length; i++) {
      var opt = options[i];
      result[opt.name] = opt.default;
    }

    return result;
  }

  function urlOpts(s) {
    var base = {
      width: size.width,
      height: size.height,
      preview: 1,
      platform: window.api.platform(),
      screenshot: screenshot,
    };

    if (typeof s === "undefined") {
      s = saver;
    }

    const mergedOpts = Object.assign(
      base,
      optionValues,
      optionDefaults(),
      saver.settings
    );

    return mergedOpts;
  }

  function resizePreview() {
    const docStyle = getComputedStyle(document.documentElement);
    const sidebarWidth = Number(docStyle.getPropertyValue("--sidebar-width").replace("px", ""));

    const maxWidth = window.innerWidth - sidebarWidth - 50;
    // const maxHeight = wrapper.clientHeight;

    document.documentElement.style.setProperty(
      "--preview-width",
      `${size.width}px`
    );
    document.documentElement.style.setProperty(
      "--preview-height",
      `${size.height}px`
    );
    const scale = maxWidth / size.width;

    document.documentElement.style.setProperty(
      "--preview-wrapper-width",
      `${size.width * scale}px`
    );
    document.documentElement.style.setProperty(
      "--preview-wrapper-height",
      `${size.height * scale}px`
    );

    document.documentElement.style.setProperty("--preview-scale", `${scale}`);
  }

  function updatePreview() {
    resizePreview();

    const urlParams = new URLSearchParams(urlOpts(saver));
    previewUrl = `${saver.url}?${urlParams.toString()}`;

    const el = document.getElementById("saver-preview");
    if (el) {
      // force a reload (just binding it doesnt work)
      el.src = previewUrl;
    }
  }

  function openFolder() {
    window.api.openFolder(src);
  }

  function openConsole() {
    window.api.toggleDevTools();
  }

  function onOptionsChange() {
    updatePreview();
  }

  async function saveData() {
    console.log("saveData");
    if (document.querySelectorAll(":invalid").length > 0) {
      document.querySelectorAll("form:invalid").forEach((el) => el.classList.add("submit-attempt"));
      return;
    }

    disabled = true;
    // https://forum.vuejs.org/t/how-to-clone-property-value-as-simple-object/40032/2
    const clone = JSON.parse(JSON.stringify(saver));
    await window.api.saveScreensaver(clone, src);
    window.api.saversUpdated(src);

    new Notarize({ timeout: 1000 }).show("Changes saved!");

    document.querySelectorAll("form:invalid").forEach((el) => el.classList.remove("submit-attempt"));

    disabled = false;
  }
</script>

<style>
  :root {
    --sidebar-width: 500px;
    --navbar-height: 25px;
  }

  #editor {
    overflow-x: hidden;
    overflow-y: hidden;
    padding-left: 7px;
    padding-top: 0px;
    padding-bottom: 0px;
    padding-right: 0px;
  }
  nav {
    position: fixed;
    top: 0px;
    height: var(--navbar-height);
    z-index: 1000;
    background-color: white;
    width: 100%;
  }
  main {
    position: absolute;
    top: var(--navbar-height);
    left: 7;
    width: 99%;
    display: grid;
    grid-template-columns: 1fr var(--sidebar-width);
    grid-area: main;
    height: calc(100vh - var(--navbar-height));
  }

  .saver-detail {
    width: var(--preview-wrapper-width);
    height: var(--preview-wrapper-height);
  }

  #preview {
    max-width: calc(100vw - var(--sidebar-width)) - 10;
    overflow-y: scroll;
  }
  #sidebar {
    width: var(--sidebar-width);
    overflow-y: scroll;
  }
  #sidebar > * {
    padding-left: 7px;
    width: 95%;
  }

  section {
    font-size: 90%;
  }
  section > h2 {
    margin-top: 0px;
    font-size: 140%;
  }

  .saver-option-input {
    margin-bottom: 25px;
  }
</style>

<div id="editor">
  <nav>
    <button variant="default" title="Open screensaver folder" on:click={openFolder}>
      <FolderIcon />
    </button>
    <button variant="default" title="Save changes" disabled="{disabled}" on:click={saveData}>
      <SaveIcon />
    </button>
    <button variant="default" title="Reload preview" on:click={updatePreview}>
      <ReloadIcon />
    </button>
    <button variant="default" title="View Developer Console" on:click={openConsole}>
      <BugIcon />
    </button>
  </nav>
  <main>
    <div id="preview">
      <div class="saver-detail">
        <iframe
          id="saver-preview"
          title="preview"
          src={previewUrl}
          scrolling="no"
          class="saver-preview"
        />
      </div>

      {#if validOptions && validOptions.length > 0}
        <h3>Preview settings</h3>
        <small>
          Tweak the values here and they will be sent along to your preview.
        </small>
        <SaverOptions bind:saver on:optionsChanged={onOptionsChange} />
      {/if}
    </div>
    <div id="sidebar">
      <section id="description">
        <h2>Details</h2>
        <small> You can enter the basics about this screensaver here.</small>
        <SaverForm bind:saver></SaverForm>
      </section>
      <hr />
      <section id="options">
        <h2>Custom Options</h2>
        <small>
          You can offer users configurable options to control your screensaver.
          Add and remove those here.
        </small>

        {#each saver.options as _option, index}
          <div class="saver-option-input">
            <SaverOptionInput
              bind:saver
              bind:option={saver.options[index]}
              on:optionsChanged={updatePreview}
            />
          </div>
        {/each}

        <div class="padded-top padded-bottom">
          <button
            type="button"
            class="btn add-option"
            on:click={addSaverOption}
          >
            Add Option
          </button>
        </div>
      </section>
    </div>
  </main>
</div>
