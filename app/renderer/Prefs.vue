<template>
  <div id="prefs">
    <b-tabs>
      <b-tab title="Screensavers" active>
        <div class="container-fluid">
          <div class="row">
            <!-- left pane -->
            <div class="col-sm-6 col-md-6">
              <saver-list
                 v-bind:savers="savers"
                 v-bind:current="saver"
                 v-on:editSaver="editSaver"
                 v-on:deleteSaver="deleteSaver"
                 @change="onSaverPicked"></saver-list>
            </div>

            <!-- right pane -->
            <div class="col-sm-6 col-md-6">
              <saver-preview v-bind:preview="saver"></saver-preview>
              <saver-options
                 :saver="saver"
                 :options="saverOptions"
                 :values="prefs.options[saver]"
                 @change="onOptionsChange"
                 v-on:saverOption="updateSaverOption"
                 v-if="isLoaded"></saver-options>
            </div>
          </div>
        </div>
      </b-tab>
      <b-tab title="Preferences">
        <prefs-form :prefs="prefs" @change="onChange"></prefs-form>
      </b-tab>
    </b-tabs>
    <footer class="footer d-flex justify-content-between">
      <div>
        <button class="btn btn-large btn-positive create">Create Screensaver</button>
      </div>
      <div>
        <button class="btn btn-large btn-default cancel" v-on:click="closeWindow">Cancel</button>
        <button class="btn btn-large btn-positive save" v-on:click="saveData">Save</button>
      </div>
    </footer>
  </div> <!-- #prefs -->
</template>

<script>
import SaverList from '@/components/SaverList';
import SaverPreview from '@/components/SaverPreview';
import SaverOptions from '@/components/SaverOptions';
import PrefsForm from '@/components/PrefsForm';

export default {
  name: 'prefs',
  components: {
    SaverList, SaverOptions, SaverPreview, PrefsForm
  },
  created() {
    this.getConfig();
    this.getSavers();
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
    manager: function() {
      var currentWindow = this.$electron.remote.getCurrentWindow();
      return currentWindow.savers;
    },
    isLoaded: function() {
      return ( this.saver !== undefined &&
               typeof(this.savers) !== "undefined" &&
               this.savers.length > 0);
    },
    saverIndex: function() {
      var self = this;
      if ( ! this.isLoaded ) {
        return undefined;
      }
      
      return this.savers.findIndex(function(s) {
        return s.key == self.saver;
      });
    },
    saverOptions: function() {
      var self = this;
      if ( ! this.isLoaded ) {
        return undefined;
      }

      console.log("USE INDEX", this.saverIndex);
      return this.savers[this.saverIndex].options;
    },
    saverValues: function() {
      if ( typeof(this.prefs) === "undefined" ) {
        return {};
      }
      return this.prefs.options[this.saver];
    },
  },
  methods: {
    onChange(e) {
      console.log(this.prefs);
    },
    onOptionsChange(e) {
      console.log("opts change!", this.prefs);
      console.log(this.prefs.options[this.saver]);
    },
    onSaverPicked(e) {
      this.saver = e.target.value;
    },
    getConfig() {
      this.prefs = this.manager.getConfigSync();
    },
    getSavers() {
      var self = this;
      
      this.manager.listAll(function(entries) {
        self.savers = entries;
      });
    },
    getCurrentSaver() {
      this.saver = this.manager.getCurrent();
    },
    getCurrentSaverData() {
    },
    closeWindow() {
      console.log("closeWindow");
    },
    editSaver(s) {
      console.log("edit!!!!!", s);
    },
    deleteSaver(s) {
      console.log("delete!!!!!", s);
    },
    updateSaverOption(saver, name, value) {
      console.log("update saver option!", saver, name, value);
      this.prefs.options[saver][name] = value;
    },
    saveData() {
      var self = this;

      console.log("SAVE", this.prefs);
      this.prefs.saver = this.saver;
      this.manager.updatePrefs(this.prefs, function() {
        if ( self.prefs.auto_start === true ) {
          console.log("set auto_start == true");
          //appLauncher.enable().then(function(x) { }).then(function(err){
          //  console.log("ERR", err);
          //});
        }
        else {
          console.log("set auto start == false");
          //appLauncher.disable().then(function(x) { });
        }

        self.closeWindow();
        console.log("done!");
      });
    }
  },
};
</script>

<style>
  /* CSS */
</style>
