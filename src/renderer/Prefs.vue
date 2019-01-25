<template>
  <div id="prefs">
    <ul
      role="tablist"
      class="nav nav-tabs"
    >
      <li
        id="screensavers-tab"
        role="presentation"
        class="active nav-item"
      >
        <a
          aria-expanded="true"
          aria-controls="screensavers"
          role="tab"
          data-toggle="tab"
          class="nav-link active"
          href="#screensavers"
          @click="showScreensavers"
        >
          Screensavers
        </a>
      </li>
      <li
        id="preferences-tab"
        role="presentation"
        class="nav-item"
      >
        <a
          aria-expanded="false"
          aria-controls="preferences"
          role="tab"
          data-toggle="tab"
          class="nav-link"
          href="#preferences"
          @click="showPreferences"
        >
          Preferences
        </a>
      </li>
      <li
        id="advanced-tab"
        role="presentation"
        class="nav-item"
      >
        <a
          aria-expanded="false"
          aria-controls="advanced"
          role="tab"
          data-toggle="tab"
          class="nav-link"
          href="#advanced"
          @click="showAdvanced"
        >
          Advanced
        </a>
      </li>
    </ul>
    <div class="content">
      <div class="tab-content">
        <div
          id="screensavers"
          class="active tab-pane"
          aria-labelledby="screensavers-tab"
          role="tabpanel"
        >
          <div class="container-fluid">
            <div class="row">
              <div class="savers-grid">
                <!-- left pane -->
                <div>
                  <saver-list
                    :savers="savers"
                    :current="saver"
                    @editSaver="editSaver"
                    @deleteSaver="deleteSaver"
                    @change="onSaverPicked"
                  />
                </div>
              
                <!-- right pane -->
                <div class="saver-detail">
                  <template v-if="saverIsPicked">
                    <saver-preview
                      v-if="savers[saverIndex] !== undefined"
                      :key="renderIndex"
                      :bus="bus"
                      :saver="saverObj"
                      :screenshot="screenshot"
                      :options="options[saver]"
                    />
                    <saver-summary :saver="saverObj" />
                    <saver-options
                      :saver="saver"
                      :options="saverOptions"
                      :values="options[saver]"
                      @change="onOptionsChange"
                      @saverOption="updateSaverOption"
                    />
                  </template>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div
          id="preferences"
          class="tab-pane"
          aria-labelledby="preferences-tab"
          role="tabpanel"
        >
          <div class="container-fluid">
            <template v-if="prefs !== undefined">
              <prefs-form :prefs="prefs" />
            </template>
          </div>
        </div>
        <div
          id="advanced"
          class="tab-pane"
          aria-labelledby="advanced-tab"
          role="tabpanel"
        >
          <div class="container-fluid">
            <template v-if="prefs !== undefined">
              <advanced-prefs-form
                :prefs="prefs"
                @localSourceChange="localSourceChange"
              />
              <button
                class="btn btn-large btn-primary reset-to-defaults"
                @click="resetToDefaults"
              >
                Reset to Defaults
              </button>
            </template>
          </div>
        </div>
      </div>
    </div> <!-- content -->
    <footer class="footer d-flex justify-content-between">
      <div class="">
        <button
          class="align-middle btn btn-large btn-primary create"
          @click="createNewScreensaver"
        >
          Create Screensaver
        </button>
      </div>
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
          @click="saveDataClick"
        >
          Save
        </button>
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
import AdvancedPrefsForm from "@/components/AdvancedPrefsForm";
import PrefsForm from "@/components/PrefsForm";
import Noty from "noty";

const {dialog} = require("electron").remote;

import SaverPrefs from "@/../lib/prefs";
import SaverListManager from "@/../lib/saver-list";

export default {
  name: "Prefs",
  components: {
    SaverList, SaverOptions, SaverPreview, SaverSummary, AdvancedPrefsForm, PrefsForm
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
    bus: function() {
      return new Vue();
    },
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
  async mounted() {
    let dataPath = this.$electron.remote.getCurrentWindow().saverOpts.base;

    this.ipcRenderer.on("savers-updated", this.onSaversUpdated);
    this.prefs = new SaverPrefs(dataPath);
    this._savers = new SaverListManager({
      prefs: this.prefs
    }, this.logger);

    this._savers.setup().then(() => {
      this.getData();
      this.getCurrentSaver();

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
  methods: {
    clearTabs() {
      var els = document.querySelectorAll(".nav-tabs > li > a.nav-link, .tab-content > .tab-pane");
      for ( var i = 0; i < els.length; i++ ) {
        els[i].classList.remove("active");
      }
    },
    setActiveTab(n) {
      this.clearTabs();
      document.querySelector("#" + n).classList.add("active");
      document.querySelector("[href='#" + n + "']").classList.add("active");
    },
    showPreferences() {
      this.setActiveTab("preferences");
    },
    showScreensavers() {
      this.setActiveTab("screensavers");
    },
    showAdvanced() {
      this.setActiveTab("advanced");
    },
    onOptionsChange() {
      this.bus.$emit("options-changed", this.options[this.saver]);
    },
    onSaverPicked(e) {
      this.saver = e.target.value;
      this.bus.$emit("saver-changed", this.saverObj);
      this.renderIndex += 1;
    },
    resetToDefaults() {
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
        var tmp = this.prefs.toHash();
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
//        this.prefs = Object.assign({}, this.prefs, tmp);
        this.prefs = Object.assign(this.prefs, tmp);


        // pick the first screensaver if nothing picked yet
        if ( this.prefs.current === undefined ) {
          this.prefs.current = this.savers[0].key;
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
      this.saver = this.prefs.current;
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
    saveData() {
      this.disabled = true;

      // @todo should this use Object.assign?
      this.prefs.current = this.saver;
      this.prefs.options = this.options;
      return new Promise((resolve) => {
        this.prefs.updatePrefs(this.prefs, (changes) => {
          this.disabled = false;
          this.ipcRenderer.send("prefs-updated", changes);
          this.ipcRenderer.send("set-autostart", this.prefs.auto_start);
          resolve(changes);
        });
      });
    },
    saveDataClick() {
      this.saveData().then(() => {
        this.ipcRenderer.send("close-window");
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
