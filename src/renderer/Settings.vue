<template>
  <div id="settings">
    <template v-if="prefs !== undefined">
      <div class="container-fluid">
        <prefs-form :prefs="prefs" />
      </div>
      <div class="container-fluid">
        <advanced-prefs-form
          :prefs="prefs"
          @localSourceChange="localSourceChange"
        />
      </div>
    </template>
    <footer class="footer d-flex justify-content-between">
      <div>
        <button
          class="btn btn-large btn-primary reset-to-defaults"
          @click="resetToDefaults"
        >
          Reset to Defaults
        </button>
      </div>
      <div>
        <button
          class="btn btn-large btn-primary close-window"
          :disabled="disabled"
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
  </div> <!-- #settings -->
</template>

<script>
const {dialog} = require("electron").remote;

import AdvancedPrefsForm from "@/components/AdvancedPrefsForm";
import PrefsForm from "@/components/PrefsForm";
import Noty from "noty";
import SaverPrefs from "@/../lib/prefs";

export default {
  name: "Settings",
  components: {
    AdvancedPrefsForm, PrefsForm
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
      // parse incoming URL params -- we'll get a link to 
      // the current screen images for previews here
      return new URLSearchParams(document.location.search);
    },
    screenshot: function() {
      // the main app will pass us a screenshot URL, here it is
      return decodeURIComponent(this.params.get("screenshot"));
    }
  },
  async mounted() {
    let opts = this.$electron.remote.getCurrentWindow().saverOpts;

    this.prefs = new SaverPrefs({
      baseDir: opts.base,
      systemSource: opts.systemDir
    });
  },
  methods: {
    async handleSave(output) {
      this.disabled = true;
      try {
        let changes = await this.prefs.updatePrefs(this.prefs);

        this.ipcRenderer.send("prefs-updated", changes);
        this.ipcRenderer.send("set-autostart", this.prefs.auto_start);
        this.ipcRenderer.send("set-global-launch-shortcut", this.prefs.launchShortcut);
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
    async resetToDefaults() {
      let result = dialog.showMessageBoxSync({
        type: "info",
        title: "Are you sure?",
        message: "Are you sure you want to reset to the default settings?",
        buttons: ["No", "Yes"],
        defaultId: 0
      });

      if ( result === 1 ) {
        this.prefs.defaults = this.$electron.remote.getGlobal("CONFIG_DEFAULTS");
        this.prefs.reset();
        await this.handleSave("Settings reset");
      }
    },
    closeWindow() {
      this.currentWindow.close();
    },
    async saveDataClick() {
      await this.handleSave("Changes saved!");
      this.closeWindow();
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

<style>
</style>
