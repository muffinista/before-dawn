<template>
  <div id="editor">
    <b-tabs>
      <b-tab title="Preview" active>
        <saver-preview
           v-bind:preview="saver"
           v-bind:screenshot="screenshot"
           v-if="isLoaded"></saver-preview>
      </b-tab>
      <b-tab title="Settings">
        <saver-form
           v-bind:saver="saver"
             v-if="isLoaded"></saver-form>
        <saver-option-input
           v-on="$listeners"
           v-for="option in options"
           v-bind:option="option"></saver-option-input>      
        <button type="button" class="btn btn-positive" v-on:click="addSaverOption">Add</button>

      </b-tab>
    </b-tabs>
    <footer class="footer d-flex justify-content-between">
      <div>
        <button class="btn btn-large btn-default cancel" v-on:click="closeWindow">Cancel</button>
        <button class="btn btn-large btn-positive save" v-on:click="saveData">Save</button>
        <button class="btn btn-large btn-positive save" v-on:click="saveDataAndClose">Save and Close</button>        
      </div>
    </footer>
  </div> <!-- #editor -->
</template>

<script>
  import SaverPreview from '@/components/SaverPreview';
  import SaverForm from '@/components/SaverForm';  
  import SaverOptionInput from '@/components/SaverOptionInput';
  
export default {
  name: 'editor',
  components: {
    SaverForm, SaverPreview, SaverOptionInput
  },
  created() {
    var self = this;
    this.manager.loadFromFile(this.src).then((result) => {
      self.saver = result;
      self.options = result.options;
    });
  },
  data() {
    return {
      saver: undefined,
      options: []
    }
  },
  computed: {
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
      return typeof(this.saver) !== "undefined";
    },
    params: function() {
      // parse incoming URL params -- we'll get a link to the current screen images for previews here
      return new URLSearchParams(document.location.search);
    },
    src: function() {
      return this.params.get("src");
    },
    screenshot: function() {
      return this.params.get("screenshot");
    }
  },
  methods: {
    onChange(e) {
      console.log(this);
    },
    addSaverOption(e) {
      var newOpt = {
        "index": 1,
        "name": "New Option",
        "type": "slider",
        "description": "Description",
        "min": "1",
        "max": "100",
        "default": "75"
      };
      console.log(this.options.push({
        "index": 1,
        "name": "New Option",
        "type": "slider",
        "description": "Description",
        "min": "1",
        "max": "100",
        "default": "75"
      }));
      console.log(this.options);
    },   
    closeWindow() {
      console.log("closeWindow");
      this.currentWindow.close();
    },
    saveData() {
      console.log("SAVE", this.saver.attrs);
      this.saver.write(this.saver.attrs);
      this.ipcRenderer.send("savers-updated", this.saver.key);
    },
    saveDataAndClose() {
      this.saveData();
      this.closeWindow();
    }
  }
}

  
</script>

<style>
  /* CSS */
</style>
