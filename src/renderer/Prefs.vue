<template>
  <div id="prefs">
    <template v-if="saverIsPicked">
      <div class="saver-detail">
        <iframe
          :src="previewUrl"
          scrolling="no"
          class="saver-preview"
        />
      </div>
      <div class="saver-info space-at-top">
        <saver-summary 
          :saver="saverObj"
          @editSaver="editSaver"
          @deleteSaver="deleteSaver"
        />
        <saver-options
          :saver="saver"
          :options="saverOptions"
          :values="options[saver]"
          @change="onOptionsChange"
          @saverOption="updateSaverOption"
        />
      </div>
    </template>
    <saver-list
      :savers="savers"
      :current="saver"
      @change="onSaverPicked"
    />
    <div class="basic-prefs space-at-top">
      <template v-if="prefs !== undefined">
        <h1>Settings</h1>
        <basic-prefs-form :prefs="prefs" />
      </template>
    </div>

    <footer class="footer d-flex justify-content-between">
      <div>
        <button
          class="align-middle btn btn-large btn-primary create"
          @click.stop="createNewScreensaver"
        >
          Create Screensaver
        </button>
      </div>

      <div>
        <button
          class="btn btn-large btn-primary settings"
          @click.stop="openSettings"
        >
          Advanced Settings
        </button>
        <button
          class="btn btn-large btn-primary save"
          :disabled="disabled"
          @click.stop="saveDataClick"
        >
          Save
        </button>
      </div>
    </footer>
  </div> <!-- #prefs -->
</template>

<script>
import BasicPrefsForm from "@/components/BasicPrefsForm";
import SaverList from "@/components/SaverList";
import SaverOptions from "@/components/SaverOptions";
import SaverSummary from "@/components/SaverSummary";
import Noty from "noty";

const ipcRenderer = window.ipcRenderer;

const log = require("electron-log");

export default {
  name: "Prefs",
  components: {
    BasicPrefsForm, SaverList, SaverOptions, SaverSummary
  },
  data() {
    return {
      savers: [],
      prefs: {},
      options: {},
      saver: undefined,
      disabled: false,
      renderIndex: 0,
      globals: undefined
    };
  },
  computed: {
    isLoaded: function() {
      return ( typeof(this.savers) !== "undefined" &&
               this.savers.length > 0);
    },
    saverIsPicked() {
      return this.savers && this.saverIndex >= 0;
    },
    saverIndex: function() {
      return this.savers.findIndex((s) => s.key === this.saver);
    },
    saverOptions: function() {
      if ( ! this.isLoaded ) {
        return undefined;
      }
      if ( this.saverIndex < 0 ) {
        return {};
      }

      return this.savers[this.saverIndex].options;
    },
    saverObj: function() {
      return this.savers[this.saverIndex];
    },
    previewUrl: function() {
      const urlParams = new URLSearchParams(this.urlOpts(this.saver));
      return `${this.saverObj.url}?${urlParams.toString()}`;
    }
  },
  async mounted() {
    this.size = await ipcRenderer.invoke("get-primary-display-bounds");
    this.screenshot = await ipcRenderer.invoke("get-primary-screenshot");
    this.logger = log.info; //function() {};

    ipcRenderer.on("savers-updated", this.onSaversUpdated);
    await this.setupPrefs();
    await this.getData();

    this.getCurrentSaver();
    this.resizePreview();

    this.globals = await ipcRenderer.invoke("get-globals");
    if ( this.globals.NEW_RELEASE_AVAILABLE ) {
      this.$nextTick(() => {
        this.renderUpdateNotice();
      });
    }
  },
  updated() {
    this.$nextTick(function () {
      if ( !this.didScrollToScreensaver ) {
        const s = document.querySelector("input[name='screensaver']:checked");
        if ( s !== null ) {
          s.parentElement.scrollIntoViewIfNeeded();
          this.didScrollToScreensaver = true;
        }
      }
    });
  },
  beforeDestroy() {
    ipcRenderer.removeListener("savers-updated", this.onSaversUpdated);
  },
  methods: {
    async setupPrefs() {
      this.prefs = await ipcRenderer.invoke("get-prefs");
      this.saver = this.prefs.saver;
    },
    resizePreview() {
      document.documentElement.style
        .setProperty("--preview-width", `${this.size.width}px`);
      document.documentElement.style
        .setProperty("--preview-height", `${this.size.height}px`);
      //const scale = this.size.height/this.size.width;
      // const scale = 320 / this.size.height;
      const scale = 500 / (this.size.width + 40);
      //     zf = incomingBounds.height / (size.height * PREVIEW_PADDING);

      // console.log(`SCALE ${scale}`);
      document.documentElement.style
        .setProperty("--preview-scale", `${scale}`);
    },
    onOptionsChange() {
      ipcRenderer.send("update-preview", {
        target: "prefs",
        bounds: this.currentPosition,
        url: this.previewUrl
      });
    },
    urlOpts(s) {
      var base = {
        width: this.size.width,
        height: this.size.height,
        preview: 1,
        platform: process.platform,
        screenshot: this.screenshot
      };

      if ( typeof(s) === "undefined" ) {
        s = this.saver;
      }
      
      var mergedOpts = Object.assign(
        base,
        s.settings,
        this.options[this.saver]);

      return mergedOpts;
    },
    onSaverPicked(e) {
      this.saver = e.target.value;
      this.updateSaverPreview();
    },
    updateSaverPreview(force) {
      this.renderIndex += 1;
      ipcRenderer.send("update-preview", {
        target: "prefs",
        bounds: this.currentPosition,
        url: this.previewUrl,
        force: force
      });
    },
    openSettings() {
      ipcRenderer.send("open-window", "settings");
    },
    async getData() {
      var tmp = {};
      this.savers = await ipcRenderer.invoke("list-savers");

      if ( this.savers.length <= 0 ) {
        return;
      }
        
      // ensure default settings in the config for all savers
      this.savers = this.savers.map((s) => {
        if ( s.settings === undefined ) {
          s.settings = {};
        }
        return s;
      });

      // generate a hash of saver options by key
      this.savers.forEach((s) => {
        tmp[s.key] = s.settings;
      });

      this.options = Object.assign({}, this.options, tmp);

      // https://vuejs.org/v2/guide/reactivity.html
      // However, new properties added to the object will not
      // trigger changes. In such cases, create a fresh object
      // with properties from both the original object and the mixin object:
      this.prefs = Object.assign(this.prefs, tmp);

      // pick the first screensaver if nothing picked yet
      if ( this.prefs.saver === undefined || this.saverObj === undefined ) {
        this.prefs.saver = this.savers[0].key;
        this.getCurrentSaver();
      }
    },
    async onSaversUpdated() {
      await this.setupPrefs();
      await this.getData();
    },
    getCurrentSaver() {
      this.saver = this.prefs.saver;
    },
    createNewScreensaver() {
      ipcRenderer.send("open-window", "add-new", {
        screenshot: this.screenshot
      });
    },
    editSaver(s) {
      var opts = {
        src: s.src,
        screenshot: this.screenshot
      };
      ipcRenderer.send("open-window", "editor", opts);
    },
    async deleteSaver(s) {
      const index = this.savers.indexOf(s);
      const newIndex = Math.max(index-1, 0);

      this.saver = this.savers[newIndex].key;
      this.updateSaverPreview(true);

      this.savers.splice(index, 1);

      await ipcRenderer.invoke("delete-saver", s);
      await this.getData();
    },
    updateSaverOption(saver, name, value) {
      var tmp = this.options;
      var update = {};
      
      update[saver] = Object.assign({}, tmp[saver]);    
      update[saver][name] = value;
    
      this.options = Object.assign({}, this.options, update);
    },
    async saveData() {
      // @todo should this use Object.assign?
      this.prefs.saver = this.saver;
      this.prefs.options = this.options;

      return await ipcRenderer.invoke("update-prefs", this.prefs);
    },
    async saveDataClick() {
      let output;

      this.disabled = true;
      try {
        await this.saveData();
        output = "Changes saved!";
      }
      catch(e) {
        output = "Something went wrong!";
      }

      this.disabled = false;
      new Noty({
        type: "success",
        layout: "topRight",
        timeout: 1000,
        text: output,
        animation: {
          open: null
        }
      }).show();
    },
    renderUpdateNotice() {
      ipcRenderer.send("display-update-dialog");
    }
  }
}; 
</script>
