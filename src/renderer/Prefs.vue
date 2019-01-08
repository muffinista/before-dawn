<template>
  <div id="prefs">
    <div class="content">
      <b-tabs>
        <b-tab title="Screensavers" active>
          <div class="container-fluid">
            <div class="row">
              <div class="grid">
                <!-- left pane -->
                <div>
                  <saver-list
                    v-bind:savers="savers"
                    v-bind:current="saver"
                    v-on:editSaver="editSaver"
                    v-on:deleteSaver="deleteSaver"
                    @change="onSaverPicked"></saver-list>
                </div>
              
                <!-- right pane -->
                <div class="saver-detail">
                  <template v-if="saverIsPicked">
                    <saver-preview
                      :bus="bus"
                      :saver="savers[saverIndex]"
                      :screenshot="screenshot"
                      :options="options[saver]"
                      v-if="savers[saverIndex] !== undefined"></saver-preview>
                    <saver-options
                      :saver="saver"
                      :options="saverOptions"
                      :values="options[saver]"
                      @change="onOptionsChange"
                      v-on:saverOption="updateSaverOption"></saver-options>
                    <saver-summary :saver="saverObj"></saver-summary>
                  </template>
                </div>
              </div>
            </div>
          </div>
        </b-tab>
        <b-tab title="Preferences">
          <div class="container-fluid">
            <prefs-form
              :prefs="prefs"
              v-on:localSourceChange="localSourceChange"></prefs-form>
            <button class="btn btn-large btn-primary reset-to-defaults"
                    v-on:click="resetToDefaults">Reset to Defaults</button>
          </div>
        </b-tab>
      </b-tabs>
    </div> <!-- content -->
    <footer class="footer d-flex justify-content-between">
      <div class="">
        <button class="align-middle btn btn-large btn-primary create" v-on:click="createNewScreensaver">Create Screensaver</button>
      </div>
      <div>
        <button class="btn btn-large btn-secondary cancel" v-on:click="closeWindow">Cancel</button>
        <button class="btn btn-large btn-primary save"  v-on:click="saveData" :disabled="disabled">Save</button>
      </div>
    </footer>
  </div> <!-- #prefs -->
</template>

<script>
import Vue from "vue";
import SaverList from "@/components/SaverList";
import SaverPreview from "@/components/SaverPreview";
import SaverOptions from "@/components/SaverOptions";
import SaverSummary from "@/components/SaverSummary";
import PrefsForm from "@/components/PrefsForm";
import Noty from "noty";

const path = require("path");
const {dialog} = require("electron").remote;

import SaverPrefs from "@/../lib/prefs";
import SaverListManager from "@/../lib/saver-list";
import PackageDownloader from "@/../lib/package-downloader";

export default {
  name: "prefs",
  components: {
    SaverList, SaverOptions, SaverPreview, SaverSummary, PrefsForm
  },
  async mounted() {
    let dataPath = this.$electron.remote.getCurrentWindow().saverOpts.base;

    this.ipcRenderer.on("savers-updated", this.onSaversUpdated);
    this._prefs = new SaverPrefs(dataPath);
    this._savers = new SaverListManager({
      prefs: this._prefs
    }, this.logger);
    this._savers.setup().then(() => {
      this.getData();
      this.getCurrentSaver();
      var pd = new PackageDownloader(this._prefs);
      if ( this._prefs.needSetup() ) {
        this._prefs.setDefaultRepo(this.$electron.remote.getGlobal("SAVER_REPO"));
      }
      pd.updatePackage().then((r) => {
        if ( r.downloaded === true ) {
          this.getData();
          this.getCurrentSaver();
        }
      });

      if ( this.$electron.remote.getGlobal("NEW_RELEASE_AVAILABLE") ) {
        this.$nextTick(() => {
          this.renderUpdateNotice();
        });
      }
    });
  },
  beforeDestroy() {
    this.ipcRenderer.removeListener("savers-updated", this.onSaversUpdated);
  },
  data() {
    return {
      savers: [],
      prefs: {},
      options: {},
      saver: undefined,
      disabled: false
    }
  },
  computed: {
    bus: function() {
      return new Vue();
    },
    logger() {
      let l = this.$electron.remote.getCurrentWindow().saverOpts.logger;
      if ( l === undefined ) {
        l = console.log;
      }
      return l;
    },
    currentWindow: function() {
      return this.$electron.remote.getCurrentWindow();
    },
    manager: function() {
      return this._savers;
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
      var self = this;
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
    }
  },
  methods: {
    onOptionsChange(e) {
      this.bus.$emit("options-changed", this.options[this.saver]);
    },
    onSaverPicked(e) {
      this.saver = e.target.value;
      this.bus.$emit("saver-changed", this.saverObj);
    },
    resetToDefaults(e) {
      dialog.showMessageBox(
        {
          type: "info",
          title: "Are you sure?",
          message: "Are you sure you want to reset to the default settings?",
          buttons: ["No", "Yes"],
          defaultId: 0
        },
        (result) => {
          if ( result === 1 ) {
            var tmp = this.manager.getDefaults();
            this.prefs = Object.assign(this.prefs, tmp);

            this.saveData(false).then(() => {
              this.manager.reload(() => {
                this.getData();

                new Noty({
                  type: "success",
                  layout: "topRight",
                  timeout: 1000,
                  text: "Settings reset!",
                  animation: {
                    open: null
                  }
                }).show();
              }); // reload
            }); // saveData
          }
        }
      );
    },  
    getData() {
      this.manager.list((entries) => {
        this.savers = entries;
        var tmp = this._prefs.toHash();
        if ( tmp.options === undefined ) {
          tmp.options = {};
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
        this.prefs = Object.assign({}, this.prefs, tmp);


        // pick the first screensaver if nothing picked yet
        if ( this._prefs.current === undefined ) {
          this._prefs.current = this.savers[0].key;
          this.getCurrentSaver();
        }

        this.bus.$emit("saver-changed", this.saverObj);
      });
    },
    onSaversUpdated() {
      this.manager.reset();
      this.getData();
    },
    getCurrentSaver() {
      this.saver = this._prefs.current;
    },
    createNewScreensaver() {
      this.saveData(false);
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
    saveData(doClose) {
      if ( typeof(doClose) === "undefined" ) {
        doClose = true;
      }
      
      this.disabled = true;

      // @todo should this use Object.assign?
      this.prefs.current = this.saver;
      this.prefs.options = this.options;
      
      this._prefs.updatePrefs(this.prefs, (changes) => {
        this.disabled = false;
        this.ipcRenderer.send("prefs-updated", changes);
        this.ipcRenderer.send("set-autostart", this.prefs.auto_start);
        if ( doClose ) {
          this.closeWindow();
        }
        else {
          return Promise.resolve();
        }
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
            this.$electron.shell.openExternal("https://github.com/" + appRepo + "/releases/latest");
          }
        }
      );
    },
    localSourceChange(ls) {
      var tmp = {
        localSource: ls
      };
      this.prefs = Object.assign(this.prefs, tmp);
    }
  }
}; 
</script>

<style lang="scss">
@import "~noty/lib/noty.css";
@import "~noty/lib/themes/mint.css";
</style>
