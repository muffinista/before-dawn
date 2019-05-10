<template>
  <div id="prefs">
    <saver-list
      :savers="savers"
      :current="saver"
      @editSaver="editSaver"
      @deleteSaver="deleteSaver"
      @change="onSaverPicked"
    />
    <template v-if="saverIsPicked">
      <div class="saver-detail">
      </div>
      <div class="saver-wrap">
        <saver-summary :saver="saverObj" />
        <div class="saver-options">
          <saver-options
            :saver="saver"
            :options="saverOptions"
            :values="options[saver]"
            @change="onOptionsChange"
            @saverOption="updateSaverOption"
          />
        </div>
      </div>
    </template>
   
    <footer class="footer d-flex justify-content-between">
      <div>
        <button
          class="align-middle btn btn-large btn-primary create"
          v-on:click.stop="createNewScreensaver"
        >
          Create Screensaver
        </button>
      </div>

      <div>
        <button
          class="btn btn-large btn-primary settings"
          v-on:click.stop="openSettings">Settings</button>
        <button
          class="btn btn-large btn-primary save"
          :disabled="disabled"
          v-on:click.stop="saveDataClick">
          Save
        </button>
      </div>
    </footer>

  </div> <!-- #prefs -->
</template>

<script>
import Vue from "vue";
import SaverList from "@/components/SaverList";
import SaverOptions from "@/components/SaverOptions";
import SaverSummary from "@/components/SaverSummary";
import Noty from "noty";

const {dialog} = require("electron").remote;

import SaverPrefs from "@/../lib/prefs";
import SaverListManager from "@/../lib/saver-list";

export default {
  name: "Prefs",
  components: {
    SaverList, SaverOptions, SaverSummary
  },
  data() {
    return {
      savers: [],
      prefs: {},
      options: {},
      saver: undefined,
      disabled: false,
      renderIndex: 0
    };
  },
  computed: {
    logger() {
      let l = this.$electron.remote.getCurrentWindow().saverOpts.logger;
      if ( l === undefined ) {
        l = function() {};
      }
      return l;
    },
    currentWindow: function() {
      return this.$electron.remote.getCurrentWindow();
    },
    ipcRenderer: function() {
      return this.$electron.ipcRenderer;
    },
    isLoaded: function() {
      return ( typeof(this.savers) !== "undefined" &&
               this.savers.length > 0);
    },
    saverIsPicked() {
      return this.saverIndex >= 0;
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
      // parse incoming URL params -- we'll get a link to the current screen images for previews here
      return new URLSearchParams(document.location.search);
    },
    screenshot: function() {
      // the main app will pass us a screenshot URL, here it is
      return decodeURIComponent(this.params.get("screenshot"));
    },
    previewWrapper: function() {
      return document.querySelector(".saver-detail");
    }
  },
  async mounted() {
    this.ipcRenderer.on("savers-updated", this.onSaversUpdated);
    this.setupPrefs();

    this.manager.setup().then(() => {
      this.getData();
      this.getCurrentSaver();

      if ( this.$electron.remote.getGlobal("NEW_RELEASE_AVAILABLE") ) {
        this.$nextTick(() => {
          this.renderUpdateNotice();
        });
      }

      this.$nextTick(() => {
        this.resizeInterval = window.setInterval(() => {
          this.checkResize();
        }, 50);
      });

    });
  },
  beforeDestroy() {
    this.ipcRenderer.removeListener("savers-updated", this.onSaversUpdated);
  },
  methods: {
    setupPrefs() {
      let opts = this.$electron.remote.getCurrentWindow().saverOpts;
      this.prefs = new SaverPrefs({
        baseDir: opts.base,
        systemSource: opts.systemDir
      });
      this.manager = new SaverListManager({
        prefs: this.prefs
      }, this.logger);
    },
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
        this.ipcRenderer.send("prefs-preview-bounds", this.currentPosition);
      }
    },
    onOptionsChange() {
      this.ipcRenderer.send("prefs-preview-url", {
        url: this.saverObj.getUrl(this.urlOpts(this.saver))
      });
    },
    urlOpts(s) {
      var screen = this.$electron.remote.screen;
      var size = screen.getPrimaryDisplay().bounds;

      var base = {
        width: size.width,
        height: size.height,
        preview: 1,
        platform: process.platform,
        screenshot: this.screenshot,
        _: Math.random()
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
      this.renderIndex += 1;
      this.ipcRenderer.send("prefs-preview-url", {
        url: this.saverObj.getUrl(this.urlOpts(this.saver))
      });
    },
    openSettings() {
      this.ipcRenderer.send("open-settings");
    },
    getData() {
      this.manager.list((entries) => {
        this.savers = entries;
        var tmp = this.prefs.toHash();
        if ( tmp.options === undefined ) {
          tmp.options = {};
        }

        if ( this.savers.length <= 0 ) {
          return;
        }
        
        // ensure default settings in the config for all savers
        for(var i = 0, l = this.savers.length; i < l; i++ ) {
          var s = this.savers[i];

          if ( tmp.options[s.key] === undefined ) {
            tmp.options[s.key] = {};
          }

          tmp.options[s.key] = s.settings;
        }

        this.options = Object.assign({}, this.options, tmp.options);

        // https://vuejs.org/v2/guide/reactivity.html
        // However, new properties added to the object will not
        // trigger changes. In such cases, create a fresh object
        // with properties from both the original object and the mixin object:
        this.prefs = Object.assign(this.prefs, tmp);

        // pick the first screensaver if nothing picked yet
        if ( this.prefs.current === undefined || this.saverObj === undefined ) {
          this.prefs.current = this.savers[0].key;
          this.getCurrentSaver();
        }

        this.ipcRenderer.send("prefs-preview-url", {
          url: this.saverObj.getUrl(this.urlOpts(this.saver))
        });
      });
    },
    onSaversUpdated() {
      this.setupPrefs();
      this.manager.reset();
      this.getData();
    },
    getCurrentSaver() {
      this.saver = this.prefs.current;
    },
    createNewScreensaver() {
      this.ipcRenderer.send("open-add-screensaver", {
        screenshot: this.screenshot
      });
    },
    editSaver(s) {
      var opts = {
        src: s.src,
        screenshot: this.screenshot
      };
      this.ipcRenderer.send("open-editor", opts);
    },
    deleteSaver(s) {
      var index = this.savers.indexOf(s);
      this.savers.splice(index, 1);

      this.manager.delete(s, () => {
        this.ipcRenderer.send("savers-updated", s.key);
      });

    },
    updateSaverOption(saver, name, value) {
      var tmp = this.options;
      var update = {};
      
      update[saver] = Object.assign({}, tmp[saver]);    
      update[saver][name] = value;
    
      this.options = Object.assign({}, this.options, update);
    },
    closeWindow() {
      this.currentWindow.close();
    },
    saveData() {
      this.disabled = true;

      // @todo should this use Object.assign?
      this.prefs.current = this.saver;
      this.prefs.options = this.options;
      return new Promise((resolve) => {
        this.prefs.updatePrefs(this.prefs, (changes) => {
          this.disabled = false;
          this.ipcRenderer.send("prefs-updated", changes);
          resolve(changes);
        });
      });
    },
    saveDataClick() {
      this.saveData().then(() => {
        new Noty({
          type: "success",
          layout: "bottomRight",
          timeout: 2000,
          text: "Changes saved!",
          animation: {
            open: null
          }
        }).show();
      });
    },
    renderUpdateNotice() {
      dialog.showMessageBox(
        {
          type: "info",
          title: "Update Available!",
          message: "There's a new update available! Would you like to download it?",
          buttons: ["No", "Yes"],
          defaultId: 0
        },
        (result) => {
          if ( result === 1 ) {
            var appRepo = this.$electron.remote.getGlobal("APP_REPO");
            this.$electron.shell.openExternal(`https://github.com/${appRepo}/releases/latest`);
          }
        }
      );
    }
  }
}; 
</script>

<style>
</style>
