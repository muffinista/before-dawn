<template>
<div id="prefs">
  <div class="content">
    <b-tabs>
      <b-tab title="Screensavers" active>
        <div class="container-fluid">
          <div class="row">
            <!-- left pane -->
            <div class="col-sm-6 col-md-6">
              <saver-list
                 v-if="isLoaded"
                 v-bind:savers="savers"
                 v-bind:current="saver"
                 v-on:editSaver="editSaver"
                 v-on:deleteSaver="deleteSaver"
                 @change="onSaverPicked"></saver-list>
            </div>

            <!-- right pane -->
            <div class="col-sm-6 col-md-6">
              <template v-if="isLoaded">
                <saver-summary :saver="saverObj"></saver-summary>
                <saver-preview
                   :bus="bus"
                   :saver="savers[saverIndex]"
                   :screenshot="screenshot"
                   :options="prefs.options[saver]"
                   v-if="savers[saverIndex] !== undefined"></saver-preview>
                <saver-options
                   :saver="saver"
                   :options="saverOptions"
                   :values="prefs.options[saver]"
                   @change="onOptionsChange"
                   v-on:saverOption="updateSaverOption"></saver-options>
              </template>
            </div>
          </div>
        </div>
      </b-tab>
      <b-tab title="Preferences">
        <div class="container-fluid">
          <prefs-form
             :prefs="prefs"
             v-on:localSourceChange="localSourceChange"></prefs-form>
        </div>
        <div class="container-fluid">
          <button class="btn btn-large btn-positive reset-to-defaults"
                  v-on:click="resetToDefaults">Reset to Defaults</button>
          </div>
      </b-tab>
    </b-tabs>
  </div> <!-- content -->
  <footer class="footer d-flex justify-content-between">
    <div>
      <button class="btn btn-large btn-positive create" v-on:click="createNewScreensaver">Create Screensaver</button>
    </div>
    <div>
      <button class="btn btn-large btn-default cancel" v-on:click="closeWindow">Cancel</button>
      <button class="btn btn-large btn-positive save"  v-on:click="saveData" :disabled="disabled">Save</button>
    </div>
  </footer>
</div> <!-- #prefs -->
</template>

<script>
import Vue from 'vue';
import SaverList from '@/components/SaverList';
import SaverPreview from '@/components/SaverPreview';
import SaverOptions from '@/components/SaverOptions';
import SaverSummary from '@/components/SaverSummary';
import PrefsForm from '@/components/PrefsForm';
import Noty from "noty";

const {dialog} = require("electron").remote;

export default {
  name: 'prefs',
  components: {
    SaverList, SaverOptions, SaverPreview, SaverSummary, PrefsForm
  },
  mounted() {
    this.ipcRenderer.on("savers-updated", (event, arg) => {
      this.getData();
    });
    this.ipcRenderer.on("request-open-add-screensaver", (event, arg) => {
      this.createNewScreensaver();
    });

    if ( this.manager === undefined ) {
      return;
    }

    this.getData();
    this.getCurrentSaver();

    if ( this.$electron.remote.getGlobal("NEW_RELEASE_AVAILABLE") ) {
      this.$nextTick(() => {
        this.renderUpdateNotice();
      });
    }
    
  },
  data() {
    return {
      savers: [],
      prefs: {},
      saver: undefined,
      disabled: false
    }
  },
  computed: {
    bus: function() {
      return new Vue();
    },
    currentWindow: function() {
      return this.$electron.remote.getCurrentWindow();
    },
    manager: function() {
      return this.currentWindow.savers;
    },
    ipcRenderer: function() {
      return this.$electron.ipcRenderer;
    },
    isLoaded: function() {
      return ( this.saver !== undefined &&
               typeof(this.savers) !== "undefined" &&
               this.savers.length > 0);
    },
    saverIndex: function() {
      return this.savers.findIndex((s) => s.key === this.saver);
    },
    saverOptions: function() {
      var self = this;
      if ( ! this.isLoaded ) {
        return undefined;
      }

      return this.savers[this.saverIndex].options;
    },
    saverValues: function() {
      if ( typeof(this.prefs) === "undefined" ) {
        return {};
      }
      return this.prefs.options[this.saver];
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
      this.bus.$emit('options-changed', this.prefs.options[this.saver]);
    },
    onSaverPicked(e) {
      this.saver = e.target.value;
      this.bus.$emit('saver-changed', this.saverObj);
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

            this.saveData(false);

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
            });
          }
        }
      );
    },  
    getData() {
      this.manager.listAll((entries) => {

        this.savers = entries;
        var tmp = this.manager.getConfigSync();
        if ( tmp.options === undefined ) {
          tmp.options = {};
        }
        
        // ensure default settings in the config for all savers
        for(var i = 0; i < this.savers.length; i++ ) {
          var s = this.savers[i];
          if ( tmp.options[s.key] === undefined ) {
            tmp.options[s.key] = {};
          }
        }

        // https://vuejs.org/v2/guide/reactivity.html
        // However, new properties added to the object will not
        // trigger changes. In such cases, create a fresh object
        // with properties from both the original object and the mixin object:
        this.prefs = Object.assign({}, this.prefs, tmp);
        this.bus.$emit('saver-changed', this.saverObj);
      });
    },
    getCurrentSaver() {
      this.saver = this.manager.getCurrent();
    },
    createNewScreensaver() {
      this.ipcRenderer.send("open-add-screensaver", this.screenshot);
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
      var tmp = this.prefs.options;
      var update = {};
      update[saver] = {};
      update[saver][name] = value;
   
      this.prefs.options = Object.assign({}, tmp, update);
    },
    closeWindow() {
      this.currentWindow.close();
    },
    saveData(doClose) {
      if ( typeof(doClose) === "undefined" ) {
        doClose = true;
      }
      
      this.disabled = true;
      this.prefs.saver = this.saver;

      this.manager.updatePrefs(this.prefs, () => {
        this.disabled = false;
        this.ipcRenderer.send("set-autostart", this.prefs.auto_start);
        if ( doClose ) {
          this.closeWindow();
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
      console.log("hey", this.prefs);
      console.log("set local source to", ls);
      var tmp = {
        localSource: ls
      };
      this.prefs = Object.assign(this.prefs, tmp);

//      this.prefs.localSource = ls;

    }
  }


};

  
</script>

<style>
  /* CSS */
</style>
