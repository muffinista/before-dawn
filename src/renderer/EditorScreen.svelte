<!-- #editor -->
<script>
  import { onMount, onDestroy } from "svelte";

  import Notarize from "@/components/Notarize";
  import SaverForm from "@/components/SaverForm.svelte";
  import SaverOptions from "@/components/SaverOptions.svelte";
  import SaverOptionInput from "@/components/SaverOptionInput.svelte";

  import ReloadIcon from "@/components/icons/ReloadIcon.svelte";
  import FolderIcon from "@/components/icons/FolderIcon.svelte";
  import SaveIcon from "@/components/icons/SaveIcon.svelte";
  import BugIcon from "@/components/icons/BugIcon.svelte";

  console.log = window.api.log;
  window.addEventListener("error", console.log);
  window.addEventListener("unhandledrejection", console.log);


  let size = undefined;
  let saver = $state({options: [], requirements: []});
  let optionValues = $state({});
  let disabled = $state(false);
  let lastIndex = 0;
  let previewUrl = $state(undefined);

  let validOptions = $derived(saver?.options?.filter((o) => o.name !== ""));
  let params = $derived(new URLSearchParams(document.location.search));
  let src = $derived(params.get("src"));
  let screenshot = $derived(params.get("screenshot"));

  onMount(async () => {
    size = await window.api.getDisplayBounds();
    saver = await window.api.loadSaver(src);

    if (saver.settings === undefined) {
      saver.settings = {};
    }
    if (saver.options === undefined) {
      saver.options = [];
    }

    lastIndex = saver.options.length;

    window.api.onFolderUpdate(() => {
      updatePreview();
    });
    window.api.watchFolder(src);
    addEventListener("resize", updatePreview);

    // wait a tick so that all our required elements actually exist
    setTimeout(() => {
      updatePreview();
    }, 0);
  });

  onDestroy(() => {
    window.api.unwatchFolder(src);
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
  }

  function optionDefaults() {
    var result = {};
    for (var i = 0; i < saver.options.length; i++) {
      var opt = saver.options[i];
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

  function onDeleteOption(deletedOption) {
    saver.options = saver.options.filter(o => o.index !== deletedOption.index);
  }

  async function saveData() {
    if (document.querySelectorAll(":invalid").length > 0) {
      document.querySelectorAll("form:invalid").forEach((el) => el.classList.add("submit-attempt"));
      return;
    }

    disabled = true;
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
    max-width: calc((100vw - var(--sidebar-width)) - 10);
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
    <button variant="default" title="Open screensaver folder" onclick={openFolder}>
      <FolderIcon />
    </button>
    <button variant="default" title="Save changes" disabled="{disabled}" class="save" onclick={saveData}>
      <SaveIcon />
    </button>
    <button variant="default" title="Reload preview" onclick={updatePreview}>
      <ReloadIcon />
    </button>
    <button variant="default" title="View Developer Console" onclick={openConsole}>
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
        ></iframe>
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

        <!-- eslint-disable no-unused-vars -->
        {#each saver.options as option, index (option.name)}
          <div class="saver-option-input" data-index="{index}">
            <SaverOptionInput
              bind:option={saver.options[index]}
              on:optionsChanged={updatePreview}
              index={index}
            />
            <div class="form-actions">          
              <button
              type="button"
              class="btn btn-danger remove-option"
              onclick={() => { onDeleteOption(option) }}
            >
              Remove this Option
              </button>
            </div>

          </div>
        {/each}

        <div class="padded-top padded-bottom">
          <button
            type="button"
            class="btn add-option"
            onclick={addSaverOption}
          >
            Add Option
          </button>
        </div>
      </section>
    </div>
  </main>
</div>
