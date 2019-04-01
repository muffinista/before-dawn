<template>
  <div id="new">
    <div class="content">
      <div class="container-fluid">
        <template v-if="!canAdd">
          <div class="need-setup-message">
            <p>
              Screensavers in Before Dawn are web pages, so if you can use HTML, 
              CSS, and/or Javascript, you can make your own screensaver. But before 
              you can do that, you'll need to set a local directory in the preferences 
              window!
            </p>
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
const path = require("path");

import SaverForm from "@/components/SaverForm";

import SaverPrefs from "@/../lib/prefs";
import SaverListManager from "@/../lib/saver-list";

export default {
  name: "NewScreensaver",
  components: {
    SaverForm
  },
  data() {
    return {
      saver: {
        requirements: ["screen"]
      },
      disabled: false,
      prefs: undefined
    };
  },
  computed: {
    isLoaded: function() {
      return typeof(this.prefs) !== "undefined";
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
    params: function() {
      // parse incoming URL params -- we'll get a link to the current screen images for previews here
      return new URLSearchParams(document.location.search);
    },
    screenshot: function() {
      // the main app will pass us a screenshot URL, here it is
      return decodeURIComponent(this.params.get("screenshot"));
    },
    canAdd: function() {
      return this.isLoaded &&
        this.prefs !== undefined &&
        this.prefs.localSource !== undefined &&
        this.prefs.localSource !== "";
    }
  },
  mounted() {
    let opts = this.$electron.remote.getCurrentWindow().saverOpts;
    this.prefs = new SaverPrefs({
      baseDir: opts.base,
      systemSource: opts.systemDir
    });

    this._savers = new SaverListManager({
      prefs: this.prefs
    });
  },
  methods: {
    closeWindow() {
      this.currentWindow.close();
    },
    saveData() {
      if ( document.querySelectorAll(":invalid").length > 0 ) {
        var form = document.querySelector("form");
        form.classList.add("submit-attempt");

        return;
      }

      this.disabled = true;

      let opts = this.$electron.remote.getCurrentWindow().saverOpts;
      let systemPath = opts.systemDir;

      // eslint-disable-next-line no-console
      console.log(opts);

      var src = path.join(systemPath, "__template");
      var data = this.manager.create(src, this.saver);
      this.ipcRenderer.send("savers-updated");
      this.ipcRenderer.send("open-editor", {
        src: data.dest,
        screenshot: this.screenshot
      });
      this.currentWindow.close();
    }
  },
};
</script>
