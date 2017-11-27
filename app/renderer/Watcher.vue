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

export default {
  name: 'editor',
  components: {
    SaverForm, SaverPreview
  },
  created() {
    var self = this;
    this.manager.loadFromFile(this.src).then((result) => {
      self.saver = result;
      console.log("HELLO", self.saver);
    });
  },
  data() {
    return {
      saver: undefined
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
