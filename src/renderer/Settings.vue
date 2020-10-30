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

const ipcRenderer = window.ipcRenderer;


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
  },
  async mounted() {
    this.loadData();
  },
  methods: {
    async loadData() {
      this.globals = await ipcRenderer.invoke("get-globals");
      this.prefs = await ipcRenderer.invoke("get-prefs");
    },
    async handleSave(output) {
      this.disabled = true;
      try {
        await ipcRenderer.invoke("update-prefs", this.prefs);

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
        this.prefs = await ipcRenderer.invoke("get-defaults");
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
