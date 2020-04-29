<template>
  <div id="prefs">
    <template v-if="saverIsPicked">
      <div class="saver-detail">
        <!-- this is where the preview goes -->
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

import SaverPrefs from "@/../lib/prefs";
import Saver from "@/../lib/saver";

const { ipcRenderer } = require("electron");
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
    saverValues: function() {
      if ( typeof(this.prefs) === "undefined" ) {
        return {};
      }
      return this.options[this.saver];
    },
    saverSettings: function() {
      return this.savers[this.saverIndex].settings;
    },
    saverObj: function() {
      return this.savers[this.saverIndex];
    },
    params: function() {
      // parse incoming URL params -- we'll get a link to the 
      // current screen images for previews here
      return new URLSearchParams(document.location.search);
    },
    screenshot: function() {
      // the main app will pass us a screenshot URL, here it is
      return decodeURIComponent(this.params.get("screenshot"));
    },
    previewWrapper: function() {
      return document.querySelector(".saver-detail");
    },
    previewUrl: function() {
      const urlParams = new URLSearchParams(this.urlOpts(this.saver));
      return `${this.saverObj.url}?${urlParams.toString()}`;
    }
  },
  async mounted() {
    this.size = await ipcRenderer.invoke("get-primary-display-bounds");
    this.logger = log.info; //function() {};

    ipcRenderer.on("savers-updated", this.onSaversUpdated);
    await this.setupPrefs();
    await this.getData();

    this.getCurrentSaver();
    this.checkResize();

    this.$nextTick(() => {
      this.resizeInterval = window.setInterval(() => {
        this.checkResize();
      }, 50);
    });

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
    window.clearInterval(this.resizeInterval);
    ipcRenderer.removeListener("savers-updated", this.onSaversUpdated);
  },
  methods: {
    async setupPrefs() {
      let opts = await ipcRenderer.invoke("get-saver-opts");
      this.prefsObj = new SaverPrefs(opts.base, opts.systemDir);
      this.prefs = this.prefsObj.store.store;
      this.saver = this.prefs.saver;
    },
    // https://github.com/stream-labs/streamlabs-obs/blob/
    // 163e9a7eaf39200077874ae80d00e66108c106dc/app/components/Chat.vue.ts#L41
    rectChanged(rect) {
      return (
        rect.left !== this.currentPosition.x ||
        rect.top !== this.currentPosition.y ||
        rect.width !== this.currentPosition.width ||
        rect.height !== this.currentPosition.height
      );
    },
    updateCurrentPosition() {
      const rect = this.previewWrapper.getBoundingClientRect();
      if (this.currentPosition == null || this.rectChanged(rect)) {
        this.currentPosition = { 
          x: rect.left, 
          y: rect.top, 
          width: rect.width, 
          height: rect.height 
        };
        ipcRenderer.send("update-preview", {
          target: "prefs",
          bounds: this.currentPosition,
          url: this.previewUrl
        });
      }
    },
    checkResize() {
      if ( ! document.querySelector(".saver-detail") ) {
        return;
      }

      this.updateCurrentPosition();
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
      const tmpList = await ipcRenderer.invoke("list-savers");
      // @todo shouldn't need Saver object here
      this.savers = tmpList.map((data) => {
        return new Saver(data);
      });

      var tmp = {};

      if ( this.savers.length <= 0 ) {
        return;
      }
        
      // ensure default settings in the config for all savers
      for(var i = 0, l = this.savers.length; i < l; i++ ) {
        var s = this.savers[i];

//        tmp[s.key] = this.prefs.getOptions(s.key);
        // if ( tmp[s.key] === undefined ) {
        //   tmp.options[s.key] = {};
        // }

        tmp[s.key] = s.settings;
      }

      this.options = Object.assign({}, this.options, tmp);

      // https://vuejs.org/v2/guide/reactivity.html
      // However, new properties added to the object will not
      // trigger changes. In such cases, create a fresh object
      // with properties from both the original object and the mixin object:
      console.log("HERE");
      this.prefs = Object.assign(this.prefs, tmp);

      // pick the first screensaver if nothing picked yet
      if ( this.prefs.current === undefined || this.saverObj === undefined ) {
        this.prefs.current = this.savers[0].key;
        this.getCurrentSaver();
      }
    },
    async onSaversUpdated() {
      await this.setupPrefs();
      // await ipcRenderer.invoke("reset");
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

      return await this.prefsObj.updatePrefs(this.prefs);
    },
    async saveDataClick() {
      let output;

      this.disabled = true;
      try {
        let changes = await this.saveData();
        ipcRenderer.send("prefs-updated", changes);
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
