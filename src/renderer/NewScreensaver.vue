<template>
<div id="new">
  <div class="content">
    <div class="container-fluid">
      <template v-if="!canAdd">
        <div class="container-fluid">
          <p>
            Hey, before you can create a new screensaver, you'll need to
            set a local directory in the preferences window!
          </p>
        </div>
      </template>  

      <template v-if="canAdd">
        <p>Use this form to create a new screensaver. A template will be
          added to the system that you can fill in with your code.</p>
        <saver-form
           v-bind:saver="saver"></saver-form>
      </template>
    </div>
  </div>
  <footer class="footer d-flex justify-content-between">
    <div>
      <button class="btn btn-large btn-default cancel" v-on:click="closeWindow">Cancel</button>
      <button class="btn btn-large btn-positive save"
              v-on:click="saveData" :disabled="disabled || !canAdd">Save</button>
    </div>
  </footer>
</div> <!-- #new -->
</template>

<script>
const path = require('path');

import SaverForm from '@/components/SaverForm';
const remote = require('electron').remote;
const is_dev = remote.getGlobal('IS_DEV');

import SaverPrefs from '@/../lib/prefs';
import SaverListManager from '@/../lib/saver-list';

export default {
  name: 'new-screensaver',
  components: {
    SaverForm
  },
  mounted() {
    let dataPath = remote.getCurrentWindow().saverOpts.base;

    this._prefs = new SaverPrefs(dataPath);
    this._savers = new SaverListManager({
      prefs: this._prefs
    });
  },
  data() {
    return {
      saver: {},
      disabled: false
    }
  },
  computed: {
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
      return this._prefs !== undefined &&
        this._prefs.localSource !== undefined &&
        this._prefs.localSource !== "";
    }
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

      var src = path.join(mainProcess.getSystemDir(), "__template");
      var data = this.manager.generateScreensaver(src, this.saver);

      this.manager.reset();
      this.manager.reload().then(() => {
        let loadPath = remote.getCurrentWindow().saverOpts.systemDir;
        const mainProcess = remote.require( path.join(loadPath, 'index.js'));

        mainProcess.toggleSaversUpdated();
        mainProcess.openEditor({
          src: data.dest,
          screenshot: this.screenshot
        });
        this.currentWindow.close();
      });

    }
  },
};
</script>

<style>
  /* CSS */
</style>
