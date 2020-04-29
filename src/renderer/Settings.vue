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
import AdvancedPrefsForm from "@/components/AdvancedPrefsForm";
import PrefsForm from "@/components/PrefsForm";
import Noty from "noty";
import SaverPrefs from "@/../lib/prefs";

const { ipcRenderer } = require("electron");

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
    this.globals = await ipcRenderer.invoke("get-globals");

    let opts = await ipcRenderer.invoke("get-saver-opts");

    this.prefsObj = new SaverPrefs(opts.base, opts.systemDir);
    this.prefs = this.prefsObj.store.store;

  },
  methods: {
    async handleSave(output) {
      this.disabled = true;
      try {
        console.log("PREFS", this.prefs);
        let changes = await this.prefsObj.updatePrefs(this.prefs);

        ipcRenderer.send("prefs-updated", changes);
        ipcRenderer.send("set-autostart", this.prefs.auto_start);
        ipcRenderer.send("set-global-launch-shortcut", this.prefs.launchShortcut);
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
      const result = await ipcRenderer.invoke("reset-to-defaults-dialog");
      if ( result === 1 ) {
        this.prefsObj.defaults = this.globals.CONFIG_DEFAULTS;
        this.prefsObj.reset();
        this.prefs = this.prefsObj.store.store;

        await this.handleSave("Settings reset");
      }
    },
    closeWindow() {
      ipcRenderer.send("close-window", "settings");
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
