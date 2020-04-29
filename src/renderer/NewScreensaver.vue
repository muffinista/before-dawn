<template>
  <div id="new">
    <div class="content">
      <div class="container-fluid" :key="renderIndex">
        <h1>New Screensaver</h1>
        <template v-if="!canAdd">
          <div class="need-setup-message">
            <p>
              Screensavers in Before Dawn are web pages, so if you can use HTML, 
              CSS, and/or Javascript, you can make your own screensaver. But before 
              you can do that, you'll need to set a local directory!
            </p>
            <div class="form-group">
              <label for="localSource">Local Source:</label>
              <template v-if="prefs !== undefined">
                <local-folder-input
                  :value="prefs.localSource"
                  handler="localSourceChange"
                  name="localSource"
                  v-on="$listeners"
                  @localSourceChange="localSourceChange"
                />
              </template>

              <small class="form-text text-muted">
                We will load screensavers from any directories listed here. Use this to add your own screensavers!
              </small>
            </div>
          </div>
        </template>  

        <template v-if="canAdd">
          <p>
            Screensavers in Before Dawn are web pages, so if you can use HTML, 
            CSS, and/or Javascript, you can make your own screensaver.
          </p>

          <p>
            Use this form to create a new screensaver. A template will be
            added to the system that you can fill in with your code.
          </p>
          <saver-form
            :saver="saver"
          />
        </template>
      </div>
    </div>
    <footer class="footer d-flex justify-content-between">
      <div>
        <button
          class="btn btn-large btn-secondary cancel"
          @click="closeWindow"
        >
          Cancel
        </button>
        <button
          class="btn btn-large btn-primary save"
          :disabled="disabled || !canAdd"
          @click="saveData"
        >
          Save
        </button>
      </div>
    </footer>
  </div> <!-- #new -->
</template>

<script>
import SaverForm from "@/components/SaverForm";
import LocalFolderInput from "@/components/LocalFolderInput";

import SaverPrefs from "@/../lib/prefs";

const { ipcRenderer } = require("electron");

export default {
  name: "NewScreensaver",
  components: {
    SaverForm,
    LocalFolderInput
  },
  data() {
    return {
      saver: {
        requirements: ["screen"]
      },
      disabled: false,
      prefs: undefined,
      renderIndex: 0
    };
  },
  computed: {
    isLoaded: function() {
      return typeof(this.prefs) !== "undefined";
    },
    params: function() {
      // parse incoming URL params -- we'll get a link 
      // to the current screen images for previews here
      return new URLSearchParams(document.location.search);
    },
    screenshot: function() {
      // the main app will pass us a screenshot URL, here it is
      return decodeURIComponent(this.params.get("screenshot"));
    },
    canAdd: function() {
      return this.prefs !== undefined &&
        this.prefs.localSource !== undefined &&
        this.prefs.localSource !== "";
    }
  },
  async mounted() {
    this.opts = await ipcRenderer.invoke("get-saver-opts");
    this.prefsObj = new SaverPrefs(this.opts.base, this.opts.systemDir);
    this.prefs = this.prefsObj.store.store;
  },
  methods: {
    closeWindow() {
      ipcRenderer.send("close-window", "addNew");
    },
    async localSourceChange(ls) {
      var tmp = {
        localSource: ls
      };
      this.prefs = Object.assign(this.prefs, tmp);
      let changes = await this.prefs.updatePrefs(this.prefs);

      this.renderIndex += 1;
      this.disabled = false;
      ipcRenderer.send("prefs-updated", changes);

    },
    async saveData() {
      if ( document.querySelectorAll(":invalid").length > 0 ) {
        var form = document.querySelector("form");
        form.classList.add("submit-attempt");

        return;
      }

      this.disabled = true;
      const data = await ipcRenderer.invoke("create-screensaver", this.saver);

      ipcRenderer.send("savers-updated");
      ipcRenderer.send("open-window", "editor", {
        src: data.dest,
        screenshot: this.screenshot
      });
      ipcRenderer.send("close-window", "addNew");
    }
  },
};
</script>
