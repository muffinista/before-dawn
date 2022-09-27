<!-- #editor -->
<script>
  import Notarize from "@/components/Notarize";
  import SaverOptions from "@/components/SaverOptions.svelte";
  import SaverOptionInput from "@/components/SaverOptionInput.svelte";

  import { onMount } from "svelte";

  let size = undefined;
  let saver = undefined;
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
    addEventListener('resize', updatePreview);

    // wait a tick so that all our required elements actually exist
    setTimeout(() => {
      updatePreview();
    }, 0);
  });

  function closeWindow() {
    window.api.closeWindow("editor");
  }
  function addSaverOption() {
    saver.options.push({
      index: lastIndex + 1,
      name: "New Option", //New Option,
      type: "slider",
      description: "", //Description,
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
    const wrapper = document.querySelector('#preview');

    const docStyle = getComputedStyle(document.documentElement);
    const sidebarWidth = Number(docStyle.getPropertyValue('--sidebar-width').replace('px', ''));

    const maxWidth = window.innerWidth - sidebarWidth - 50;
    const maxHeight = wrapper.clientHeight;

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
    if (document.querySelectorAll(":invalid").length > 0) {
      var form = document.querySelector("form");
      form.classList.add("submit-attempt");

      return;
    }

    disabled = true;
    // https://forum.vuejs.org/t/how-to-clone-property-value-as-simple-object/40032/2
    const clone = JSON.parse(JSON.stringify(saver));
    await window.api.saveScreensaver(clone, src);
    window.api.saversUpdated(src);

    new Notarize({ timeout: 1000 }).show("Changes saved!");

    disabled = false;
  }
</script>

<style>
  :root {
    --sidebar-width: 500px;
  }

  #editor {
    overflow-x: hidden;

    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 40px auto;
    grid-template-areas: 
    'header'
    'main';
  }

  main {
    display: grid;
    grid-template-columns: 1fr var(--sidebar-width);
  }

  .button-group {
    grid-area: header;
  }

  main {
    grid-area: main;
    height: 100vh;
  }

  details {
    width: var(--sidebar-width);
  }

  details > * {
    max-width: 95%;
  }

  summary {
    font-size: 1.2em;
    font-weight: bold;
  }

  .saver-detail {
    width: var(--preview-wrapper-width);
    height: var(--preview-wrapper-height);
  }
</style>

<div id="editor">
  <div class="button-group">
    <button
      variant="default"
      title="Open screensaver folder"
      on:click={openFolder}
    >
      <span class="icon">
        <svg
          x="0px"
          y="0px"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          enable-background="new 0 0 14 14"
          xml:space="preserve"
        >
          <path
            d="M18.405,4.799C18.294,4.359,17.75,4,17.195,4h-6.814C9.827,4,9.051,3.682,8.659,3.293L8.063,2.705
          C7.671,2.316,6.896,2,6.342,2H3.087C2.532,2,2.028,2.447,1.967,2.994L1.675,6h16.931L18.405,4.799z M19.412,7H0.588
          c-0.342,0-0.61,0.294-0.577,0.635l0.923,9.669C0.971,17.698,1.303,18,1.7,18H18.3c0.397,0,0.728-0.302,0.766-0.696l0.923-9.669
          C20.022,7.294,19.754,7,19.412,7z"
          />
        </svg>
      </span>
    </button>
    <button variant="default" title="Save changes" on:click={saveData}>
      <span class="icon">
        <svg
          id="Save"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          width="14"
          height="14"
          viewBox="0 0 20 20"
          enable-background="new 0 0 20 20"
          xml:space="preserve"
        >
          <path
            d="M15.173,2H4C2.899,2,2,2.9,2,4v12c0,1.1,0.899,2,2,2h12c1.101,0,2-0.9,2-2V5.127L15.173,2z M14,8c0,0.549-0.45,1-1,1H7
C6.45,9,6,8.549,6,8V3h8V8z M13,4h-2v4h2V4z"
          />
        </svg>
      </span>
    </button>
    <button variant="default" title="Reload preview" on:click={updatePreview}>
      <span class="icon">
        <svg
          id="Cycle"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          width="14"
          height="14"
          viewBox="0 0 20 20"
          enable-background="new 0 0 20 20"
          xml:space="preserve"
        >
          <path
            d="M5.516,14.224c-2.262-2.432-2.222-6.244,0.128-8.611c0.962-0.969,2.164-1.547,3.414-1.736L8.989,1.8
C7.234,2.013,5.537,2.796,4.192,4.151c-3.149,3.17-3.187,8.289-0.123,11.531l-1.741,1.752l5.51,0.301l-0.015-5.834L5.516,14.224z
M12.163,2.265l0.015,5.834l2.307-2.322c2.262,2.434,2.222,6.246-0.128,8.611c-0.961,0.969-2.164,1.547-3.414,1.736l0.069,2.076
c1.755-0.213,3.452-0.996,4.798-2.35c3.148-3.172,3.186-8.291,0.122-11.531l1.741-1.754L12.163,2.265z"
          />
        </svg>
      </span>
    </button>
    <button
      variant="default"
      title="View Developer Console"
      on:click={openConsole}
    >
      <span class="icon">
        <svg
          id="Bug"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
          x="0px"
          y="0px"
          width="14"
          height="14"
          viewBox="0 0 20 20"
          enable-background="new 0 0 20 20"
          xml:space="preserve"
        >
          <path
            d="M10,1C7.7907715,1,6,2.7908325,6,5h8C14,2.7908325,12.2092285,1,10,1z M19,10h-3V7.5031738
c0-0.02771-0.0065918-0.0535278-0.0080566-0.0808716l2.2150879-2.21521c0.390625-0.3905029,0.390625-1.0236816,0-1.4141846
c-0.3903809-0.390564-1.0236816-0.390564-1.4140625,0l-2.215332,2.21521C14.550293,6.0066528,14.5246582,6,14.4970703,6H5.5029297
C5.4753418,6,5.449707,6.0066528,5.4223633,6.0081177l-2.215332-2.21521c-0.3903809-0.390564-1.0236816-0.390564-1.4140625,0
c-0.390625,0.3905029-0.390625,1.0236816,0,1.4141846l2.2150879,2.21521C4.0065918,7.449646,4,7.4754639,4,7.5031738V10H1
c-0.5522461,0-1,0.4476929-1,1c0,0.5522461,0.4477539,1,1,1h3c0,0.7799683,0.15625,1.520813,0.4272461,2.2037354
c-0.0441895,0.0316162-0.0947266,0.0494995-0.1342773,0.0891724l-2.8286133,2.8283691
c-0.3903809,0.390564-0.3903809,1.0237427,0,1.4142456c0.390625,0.3905029,1.0239258,0.3905029,1.4143066,0L5.4802246,15.93396
C6.3725586,16.9555054,7.6027832,17.6751099,9,17.9100342V8h2v9.9100342
c1.3972168-0.2349243,2.6274414-0.9545288,3.5197754-1.9760132l2.6015625,2.6015015
c0.3903809,0.3905029,1.0236816,0.3905029,1.4143066,0c0.3903809-0.3905029,0.3903809-1.0236816,0-1.4142456l-2.8286133-2.8283691
c-0.0395508-0.0396729-0.0900879-0.0575562-0.1342773-0.0891724C15.84375,13.520813,16,12.7799683,16,12h3
c0.5522461,0,1-0.4477539,1-1C20,10.4476929,19.5522461,10,19,10z"
          />
        </svg>
      </span>
    </button>
  </div>

  <main>
    {#if saver !== undefined}
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

        {#if validOptions.length > 0}
          <h3>Options</h3>
          <small>
            Tweak the values here and they will be sent along to your preview.
          </small>
          <SaverOptions bind:saver on:optionsChanged={onOptionsChange} />
        {/if}
      </div>
      <div class="description-and-options">
        <details id="description">
          <summary>Details</summary>
          <div>
            <small> You can enter the basics about this screensaver here.</small>
            <div id="saver-form">
              <form>
                <div class="form-group">
                  <label for="name">Name:</label>
                  <input bind:value={saver.name} type="text" name="name" required />
                  <div class="hint">The name of your screensaver.</div>
                </div>

                <div class="form-group">
                  <label for="name">Description:</label>
                  <input
                    bind:value={saver.description}
                    type="text"
                    name="description"
                    required
                  />
                  <div class="hint">A brief description of your screensaver.</div>
                </div>
                <div class="form-group">
                  <label for="aboutUrl">About URL:</label>
                  <input bind:value={saver.aboutUrl} type="text" name="aboutUrl" />
                  <div class="hint">
                    If you have a URL with more details about your work, put it
                    here!
                  </div>
                </div>
                <div class="form-group">
                  <label for="author">Author:</label>
                  <input bind:value={saver.author} type="text" name="author" />
                  <div class="hint">The author of this screensaver.</div>
                </div>

                <div class="form-group">
                  <h3>Requirements:</h3>
                  <input
                    type="checkbox"
                    name="requirements"
                    bind:group={saver.requirements}
                    value="screen"
                  />
                  <label for="screen">Screen capture</label>
                  <div class="hint">
                    This screensaver will be sent an image of the desktop
                  </div>
                </div>
              </form>
            </div>
          </div>
        </details>
        <details id="options">
          <summary>Custom Options</summary>
          <div>
            <small>
              You can offer users configurable options to control your screensaver.
              Manage those here.
            </small>

            {#each saver.options as _option, index}
              <SaverOptionInput
                bind:saver
                bind:option={saver.options[index]}
                on:optionsChanged={updatePreview}
              />
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
          </div>
        </details>
      </div>
    {/if}
  </main>
</div>
