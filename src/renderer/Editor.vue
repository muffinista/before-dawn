<template>
  <div id="editor">
    <b-button-group>
      <b-button
        v-b-tooltip.hover
        variant="default"
        title="Open screensaver folder"
        @click="openFolder"
      >
        <span class="icon">
          <img
            src="assets/img/folder.svg"
            width="14"
            height="14"
          >
        </span>
      </b-button>
      <b-button
        v-b-tooltip.hover
        variant="default"
        title="Save changes"
        @click="saveData"
      >
        <span class="icon">
          <img
            src="assets/img/save.svg"
            width="14"
            height="14"
          >
        </span>
      </b-button>
      <b-button
        v-b-tooltip.hover
        variant="default"
        title="Reload preview"
        @click="renderPreview"
      >
        <span class="icon">
          <img
            src="assets/img/cycle.svg"
            width="14"
            height="14"
          >
        </span>
      </b-button>
      <b-button
        v-b-tooltip.hover
        variant="default"
        title="View Developer Console"
        @click="openConsole"
      >
        <span class="icon">
          <img
            src="assets/img/bug.svg"
            width="14"
            height="14"
          >
        </span>
      </b-button>
    </b-button-group>

    <div id="preview">
      <div class="container-fluid space-at-bottom">
        <template v-if="saver !== undefined">
          <template v-if="options.length > 0">
            <h4>Options</h4>
            <small>
              Tweak the values here and they will be sent along
              to your preview.
            </small>
            <saver-options
              :saver="saver"
              :options="options"
              :values="optionDefaults"
              @change="onOptionsChange"
            />
          </template>
          
          <h4>Preview</h4>
          <div class="saver-detail">
            <iframe
              :src="previewUrl"
              scrolling="no"
              class="saver-preview"
            />
          </div>
        </template>
      </div>
    </div>
    <div id="description">
      <div class="container-fluid">
        <h4>Description</h4>
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
          <h4>Configurable Options</h4>
          <small>
            You can offer users configurable options to control
            your screensaver. Manage those here.
          </small>
          
          
          <!--
              note: is track-by ok here?
              https://v1.vuejs.org/guide/list.html#track-by-index 
            -->
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

    <footer class="footer d-flex justify-content-between">
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
import Noty from "noty";


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

      await window.api.saveScreensaver(this.saver, this.src);
      window.api.saversUpdated(this.src);

      new Noty({
        type: "success",
        layout: "bottomRight",
        timeout: 2000,
        text: "Changes saved!",
        animation: {
          open: null
        }
      }).show();

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
