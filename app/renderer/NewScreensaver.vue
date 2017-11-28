<template>
<div id="new">
  <template v-if="!canAdd">
    <div class="container-fluid">
      <p>
        Hey, before you can create a new screensaver, you'll need to
        set a local directory in the preferences window!
      </p>
    </div>
  </template>  
  <saver-form
     v-bind:saver="saver"
     v-if="canAdd"></saver-form>
  
  <footer class="footer d-flex justify-content-between">
    <div>
      <button class="btn btn-large btn-default cancel" v-on:click="closeWindow">Cancel</button>
      <button class="btn btn-large btn-positive save" v-on:click="saveData">Save</button>
    </div>
  </footer>
</div> <!-- #new -->
</template>

<script>
import SaverForm from '@/components/SaverForm';

export default {
  name: 'new-screensaver',
  components: {
    SaverForm
  },
  mounted() {

  },
  data() {
    return {
      saver: {}
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
    params: function() {
      // parse incoming URL params -- we'll get a link to the current screen images for previews here
      return new URLSearchParams(document.location.search);
    },
    screenshot: function() {
      // the main app will pass us a screenshot URL, here it is
      return decodeURIComponent(this.params.get("screenshot"));
    },
    canAdd: function() {
      return this.manager !== undefined &&
        this.manager.getLocalSource() !== undefined &&
        this.manager.getLocalSource() !== "";
    }
  },
  methods: {
    closeWindow() {
      this.currentWindow.close();
    },
    saveData() {
      var self = this;
      this.ipcRenderer.on("generate-screensaver", (event, data) => {
        console.log("hi!", self.params, data);
        self.ipcRenderer.send("open-editor", {
          src: data.dest,
          screenshot: self.screenshot
        });
        self.currentWindow.close();
      });

      this.ipcRenderer.send("generate-screensaver", this.saver);
    }
  },
};
</script>

<style>
  /* CSS */
</style>
