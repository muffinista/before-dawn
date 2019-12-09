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
import SaverListManager from "@/../lib/saver-list";

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
      renderIndex: 0
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
    const screen = this.$electron.remote.screen;
    this.size = screen.getPrimaryDisplay().bounds;

    //this.logger = this.$electron.remote.getCurrentWindow().saverOpts.logger;
    if ( this.logger === undefined ) {
      this.logger = function() {};
    }

    this.ipcRenderer.on("savers-updated", this.onSaversUpdated);
    await this.setupPrefs();

    this.manager.setup().then(() => {
      this.getData();
      this.getCurrentSaver();

      this.checkResize();
      this.$nextTick(() => {
        this.resizeInterval = window.setInterval(() => {
          this.checkResize();
        }, 50);
      });

      if ( this.$electron.remote.getGlobal("NEW_RELEASE_AVAILABLE") ) {
        this.$nextTick(() => {
          this.renderUpdateNotice();
        });
      }
    });
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
    this.ipcRenderer.removeListener("savers-updated", this.onSaversUpdated);
  },
  methods: {
    async setupPrefs() {
      let opts = await this.ipcRenderer.invoke("get-saver-opts");
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
    updateCurrentPosition() {
      const rect = this.previewWrapper.getBoundingClientRect();
      if (this.currentPosition == null || this.rectChanged(rect)) {
        this.currentPosition = { 
          x: rect.left, 
          y: rect.top, 
          width: rect.width, 
          height: rect.height 
        };
        this.ipcRenderer.send("preview-bounds", {
          target: "prefs",
          bounds: this.currentPosition,
          url: this.saverObj.getUrl(this.urlOpts(this.saver))
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
      this.ipcRenderer.send("preview-url", {
        target: "prefs",
        bounds: this.currentPosition,
        url: this.saverObj.getUrl(this.urlOpts(this.saver))
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
      this.renderIndex += 1;
      this.ipcRenderer.send("preview-url", {
        target: "prefs",
        bounds: this.currentPosition,
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
      });
    },
    async onSaversUpdated() {
      await this.setupPrefs();
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
    async saveData() {

      // @todo should this use Object.assign?
      this.prefs.current = this.saver;
      this.prefs.options = this.options;

      return await this.prefs.updatePrefs(this.prefs);
    },
    async saveDataClick() {
      let output;

      this.disabled = true;
      try {
        let changes = await this.saveData();
        this.ipcRenderer.send("prefs-updated", changes);
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
       const {dialog} = require("electron").remote;
                                   
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
