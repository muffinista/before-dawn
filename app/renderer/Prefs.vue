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
        <prefs-form :prefs="prefs"></prefs-form>
      </b-tab>
    </b-tabs>
  </div> <!-- content -->
  <footer class="footer d-flex justify-content-between">
    <div>
      <button class="btn btn-large btn-positive create" v-on:click="createNewScreensaver">Create Screensaver</button>
    </div>
    <div>
      <button class="btn btn-large btn-default cancel" v-on:click="closeWindow">Cancel</button>
      <button class="btn btn-large btn-positive save" v-on:click="saveData">Save</button>
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

export default {
  name: 'prefs',
  components: {
    SaverList, SaverOptions, SaverPreview, SaverSummary, PrefsForm
  },
  mounted() {
    this.getData();
    this.getCurrentSaver();
  },
  data() {
    return {
      savers: [],
      prefs: {},
      saver: undefined
    }
  },
  computed: {
    bus: function() {
      return new Vue();
    },
    manager: function() {
      var currentWindow = this.$electron.remote.getCurrentWindow();
      return currentWindow.savers;
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
    getData() {
      this.manager.listAll((entries) => {
        this.savers = entries;
        var tmp = this.manager.getConfigSync();

        // ensure default settings in the config for all savers
        for(var i = 0; i < this.savers.length; i++ ) {
          var s = this.savers[i];
          if ( tmp.options[s.key] === undefined ) {
            this.$set(tmp.options, s.key, {});
          }
        }

        this.prefs = tmp;       
        this.bus.$emit('saver-changed', this.saverObj);
      });
    },
    getCurrentSaver() {
      this.saver = this.manager.getCurrent();
    },
    getCurrentSaverData() {

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
      // @todo implement
      console.log("delete!!!!!", s);
    },
    updateSaverOption(saver, name, value) {
      //console.log("update saver option!", saver, name, value);
      this.prefs.options[saver][name] = value;
    },
    closeWindow() {
      this.currentWindow.close();
    },
    saveData() {
      var self = this;

      this.prefs.saver = this.saver;
      this.manager.updatePrefs(this.prefs, function() {
        self.ipcRenderer.send("set-autostart", self.prefs.auto_start);
        self.closeWindow();
      });
    }
  },
};
</script>

<style>
  /* CSS */
</style>
