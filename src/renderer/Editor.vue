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
          <div class="saver-detail" />
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
          <!-- NOTE: passing the attrs here because its really all
              we need for this form and makes saving the data later a
              lot easier -->
          <saver-form
            v-if="isLoaded"
            :saver="saver.attrs"
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
const fs = require("fs");
const path = require("path");
const url = require("url");
const exec = require("child_process").execFile;

import SaverForm from "@/components/SaverForm";  
import SaverOptionInput from "@/components/SaverOptionInput";
import SaverOptions from "@/components/SaverOptions";
import Noty from "noty";

import SaverPrefs from "@/../lib/prefs";
import SaverListManager from "@/../lib/saver-list";

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
    currentWindow: function() {
      return this.$electron.remote.getCurrentWindow();
    },
    ipcRenderer: function() {
      return this.$electron.ipcRenderer;
    },
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
    screenshot: function() {
      return this.params.get("screenshot");
    },
    folderPath: function() {
      return path.dirname(this.src);
    },
    optionDefaults: function() {
      var result = {};
      for ( var i = 0; i < this.options.length; i++ ) {
        var opt = this.options[i];
        result[opt.name] = opt.default;
      }

      return result;
    },
    previewWrapper: function() {
      return document.querySelector(".saver-detail");
    }
  },
  async mounted() {
    if ( this.src === null ) {
      return;
    }

    this.ipcRenderer.on("console-message", (sender, event, level, message, line, sourceId) => {
      // only output messages from the screensaver folder itself
      if ( sourceId.indexOf(this.folderPath) !== -1 ) {
        // eslint-disable-next-line no-console
        console.log(message);
      }
    });
    this.ipcRenderer.on("preview-error", (sender, event) => {
      // eslint-disable-next-line no-console
      console.log(`Error on line ${event.lineno}: ${event.message}`);
    });

    let opts = this.$electron.remote.getCurrentWindow().saverOpts;
    this._prefs = new SaverPrefs({
      baseDir: opts.base,
      systemSource: opts.systemDir
    });

    this._savers = new SaverListManager({
      prefs: this._prefs
    });

    this._savers.loadFromFile(this.src).then((result) => {
      this.saver = result;
      this.options = result.options;
      this.lastIndex = result.options.length;

      // make sure folder actually exists
      if ( fs.existsSync(this.folderPath) ) {
        fs.watch(this.folderPath, (eventType, filename) => {
          if (filename) {
            this.renderPreview();
          }
        });
      }

      this.resizeInterval = window.setInterval(() => {
        this.checkResize();
      }, 50);
    });
  },
  beforeDestroy() {
    window.clearInterval(this.resizeInterval);
  },
  methods: {
    // https://github.com/stream-labs/streamlabs-obs/blob/163e9a7eaf39200077874ae80d00e66108c106dc/app/components/Chat.vue.ts#L41
    rectChanged(rect) {
      return (
        rect.left !== this.currentPosition.x ||
        rect.top !== this.currentPosition.y ||
        rect.width !== this.currentPosition.width ||
        rect.height !== this.currentPosition.height
      );
    },
    checkResize() {
      const rect = this.previewWrapper.getBoundingClientRect();
      if (this.currentPosition == null || this.rectChanged(rect)) {
        this.currentPosition = { 
          x: rect.left, 
          y: rect.top, 
          width: rect.width, 
          height: rect.height 
        };
        this.ipcRenderer.send("preview-bounds", {
          target: "editor",
          bounds: this.currentPosition,
          url: this.saver.getUrl(this.urlOpts(this.saver))
        });
      }
    },
    urlOpts() {
      var screen = this.$electron.remote.screen;
      var size = screen.getPrimaryDisplay().bounds;

      var base = {
        width: size.width,
        height: size.height,
        preview: 1,
        platform: process.platform,
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
      this.currentWindow.close();
    },
    saveData() {
      this.disabled = true;

      this.saver.attrs.options = this.options;
      this.saver.write(this.saver.attrs, this.saver.key);
      this.ipcRenderer.send("savers-updated", this.saver.key);

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
    saveDataAndClose() {
      this.saveData();
      this.closeWindow();
    },
    openFolder() {
      var cmd;
      var args = [];
      
      // figure out the path to the screensaver folder. use
      // decodeURIComponent to convert %20 to spaces
      var filePath = path.dirname(decodeURIComponent(url.parse(this.src).path));

      switch(process.platform) {
      case "darwin":
        cmd = "open";
        args = [ filePath ];
        break;
      case "win32":
        if (process.env.SystemRoot) {
          cmd = path.join(process.env.SystemRoot, "explorer.exe");
        }
        else {
          cmd = "explorer.exe";
        }
        args = [`/select,${filePath}`];
        break;
      default:
        // # Strip the filename from the path to make sure we pass a directory
        // # path. If we pass xdg-open a file path, it will open that file in the
        // # most suitable application instead, which is not what we want.
        cmd = "xdg-open";
        args = [ filePath ];
      }
      
      exec(cmd, args, function() {});
    },
    renderPreview() {
      //console.log("load", this.saver.getUrl(this.urlOpts(this.saver)));
      this.ipcRenderer.send("preview-url", {
        target: "editor",
        bounds: this.currentPosition,
        url: this.saver.getUrl(this.urlOpts(this.saver)),
        force: true
      });
    },
    openConsole() {
      this.currentWindow.toggleDevTools();
    },   
  }
}; 
</script>
