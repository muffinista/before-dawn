<template>
  <div id="editor">
    <div class="button-group">
      <button
        variant="default"
        title="Open screensaver folder"
        @click="openFolder"
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
      <button
        variant="default"
        title="Save changes"
        @click="saveData"
      >
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
      <button
        variant="default"
        title="Reload preview"
        @click="renderPreview"
      >
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
        @click="openConsole"
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

    <div id="preview">
      <div class="container-fluid space-at-bottom">
        <template v-if="saver !== undefined">
          <h3>Preview</h3>
          <div class="saver-detail">
            <iframe
              :src="previewUrl"
              scrolling="no"
              class="saver-preview"
            />
          </div>

          <template v-if="validOptions.length > 0">
            <h3>Options</h3>
            <small>
              Tweak the values here and they will be sent along
              to your preview.
            </small>
            <saver-options
              :saver="saver"
              :options="validOptions"
              :values="optionDefaults"
              @change="onOptionsChange"
            />
          </template>
        </template>
      </div>
    </div>
    <div id="description">
      <div class="container-fluid">
        <h2>Description</h2>
        <small>
          You can enter the basics about this screensaver
          here.
        </small>
        <template v-if="saver !== undefined">
          <saver-form
            v-if="isLoaded"
            :saver="saver"
          />
        </template>
      </div>
    </div>
    <div id="options">
      <div class="container-fluid">
        <template v-if="saver !== undefined">
          <h2>Configurable Options</h2>
          <small>
            You can offer users configurable options to control
            your screensaver. Manage those here.
          </small>

          <div v-if="isLoaded">
            <saver-option-input
              v-for="(option, index) in options"
              :key="option.index"
              :option="option"
              :index="index"
              @deleteOption="deleteOption(option)"
            />      
          </div>
          
          <div class="padded-top padded-bottom">
            <button
              type="button"
              class="btn btn-primary add-option"
              @click="addSaverOption"
            >
              Add Option
            </button>
          </div>
        </template>
      </div>
    </div>

    <footer class="footer">
      <div>
        <button
          class="btn btn-large btn-secondary cancel"
          @click="closeWindow"
        >
          Cancel
        </button>
        <button
          class="btn btn-large btn-primary save"
          :disabled="disabled"
          @click.stop.prevent="saveData"
        >
          Save
        </button>
        <button
          class="btn btn-large btn-primary save"
          :disabled="disabled"
          @click.stop.prevent="saveDataAndClose"
        >
          Save and Close
        </button>        
      </div>
    </footer>
  </div> <!-- #editor -->
</template>

<script>
import SaverForm from "@/components/SaverForm";  
import SaverOptionInput from "@/components/SaverOptionInput";
import SaverOptions from "@/components/SaverOptions";
import Notarize from "@/components/Notarize";


export default {
  name: "Editor",
  components: {
    SaverForm, SaverOptionInput, SaverOptions
  },
  data() {
    return {
      saver: undefined,
      lastIndex: 0,
      options: [],
      optionValues: {},
      disabled: false
    };
  },
  computed: {
    isLoaded: function() {
      return typeof(this.saver) !== "undefined";
    },
    params: function() {
      // parse incoming URL params -- we'll get a link to the current screen images for previews here
      return new URLSearchParams(document.location.search);
    },
    src: function() {
      return this.params.get("src");
    },
    optionDefaults: function() {
      var result = {};
      for ( var i = 0; i < this.options.length; i++ ) {
        var opt = this.options[i];
        result[opt.name] = opt.default;
      }

      return result;
    },
    previewUrl: function() {
      const urlParams = new URLSearchParams(this.urlOpts(this.saver));
      return `${this.saver.url}?${urlParams.toString()}`;
    },
    validOptions: function() {
      return this.options.filter(o => o.name !== "");
    }
  },
  async mounted() {
    if ( this.src === null ) {
      return;
    }

    this.size = await window.api.getDisplayBounds();
    this.screenshot = await window.api.getScreenshot();

    this.saver = await window.api.loadSaver(this.src);
    this.options = this.saver.options;
    this.lastIndex = this.saver.options.length;

    window.api.watchFolder(this.src, this.renderPreview);
  },
  methods: {
    urlOpts() {
      var base = {
        width: this.size.width,
        height: this.size.height,
        preview: 1,
        platform: window.api.platform(),
        screenshot: this.screenshot
      };
      
      var mergedOpts = Object.assign(
        base,
        this.saver.settings,
        this.optionDefaults,
        this.optionValues);

      return mergedOpts;
    },
    onOptionsChange(e) {
      var name = e.target.name;
      var value = e.target.value;
      var result = {};

      // rebuild the option value hash so that if a key is
      // renamed it isn't left behind in the data
      for ( var i = 0; i < this.options.length; i++ ) {
        var opt = this.options[i];
        if ( this.optionValues[opt.name]) {
          result[opt.name] = this.optionValues[opt.name];
        }
        else {
          result[opt.name] = opt.default;
        }
      }

      // add the new name/value
      result[name] = value;

      this.optionValues = Object.assign({}, result);
      this.renderPreview();
    },
    deleteOption(opt) {
      let index = this.options.indexOf(opt);
      this.options.splice(index, 1);
    },
    addSaverOption() {
      this.options.push({
        "index": this.lastIndex + 1,
        "name": "", //New Option,
        "type": "slider",
        "description": "", //Description,
        "min": "1",
        "max": "100",
        "default": "75"
      });

      this.lastIndex = this.lastIndex + 1;
    },   
    closeWindow() {
      window.api.closeWindow("editor");
    },
    async saveData() {
      this.disabled = true;

      this.saver.options = this.options;

      // https://forum.vuejs.org/t/how-to-clone-property-value-as-simple-object/40032/2
      const clone = JSON.parse(JSON.stringify(this.saver));

      await window.api.saveScreensaver(clone, this.src);
      window.api.saversUpdated(this.src);

      new Notarize({timeout: 1000}).show("Changes saved!");

      this.disabled = false;
    },
    async saveDataAndClose() {
      await this.saveData();
      this.closeWindow();
    },
    openFolder() {
      window.api.openFolder(this.src);
    },
    getUrl() {
      const urlParams = new URLSearchParams(this.urlOpts(this.saver));
      return `${this.saver.url}?${urlParams.toString()}`;
    },
    renderPreview() {
      window.api.updatePreview({
        target: "editor",
        bounds: this.currentPosition,
        url: this.getUrl(),
        force: true
      });
    },
    openConsole() {
      window.api.toggleDevTools();
    },   
  }
}; 
</script>
