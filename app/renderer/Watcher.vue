<template>
  <div id="editor">
    <div class="content">
      <b-tabs>
        <b-tab title="Preview" active>
          <saver-preview
             v-bind:saver="saver"
             v-bind:screenshot="screenshot"
             v-if="isLoaded"></saver-preview>
        </b-tab>
        <b-tab title="Settings">
          <div class="container-fluid">
            <h4>Basic Information</h4>
            <small>You can enter the basics about this screensaver
              here.</small>
        
            <saver-form
               v-bind:saver="saver"
               v-if="isLoaded"></saver-form>


            <h4>Configurable Options</h4>
            <small>You can offer users configurable options to control
              your screensaver. Manage those here.</small>
            
            
            <!--
            note: is track-by ok here?
            https://v1.vuejs.org/guide/list.html#track-by-index 
            -->
            <saver-option-input
               v-for="option in options"
               v-bind:option="option"
               v-bind:key="option.index"
               v-on:deleteOption="deleteOption(option)"
               v-if="isLoaded"></saver-option-input>      

            <div class="padded-top padded-bottom">
              <button
                 type="button"
                 class="btn btn-positive"
                 v-on:click="addSaverOption">Add Option</button>
            </div>
          </div>
        </b-tab>
      </b-tabs>
    </div>
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
  mounted() {
    var self = this;

    if ( this.src === null ) {
      return;
    }

    this.manager.loadFromFile(this.src).then((result) => {
      self.saver = result;
      self.options = result.options;
      self.lastIndex = result.options.length;
    });
  },
  data() {
    return {
      saver: undefined,
      lastIndex: 0,
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
    deleteOption(opt) {
      let index = this.options.indexOf(opt);
      this.options.splice(index, 1);

      // rewrite indexes -- i dont think we need to do this
      //      for(var i = 0; i < this.options.length; i++ ) {
      //        console.log(this.options[i].index, i);
      //        this.options[i].index = i;
      //      }
    },
    addSaverOption(e) {
      this.options.push({
        "index": this.lastIndex + 1,
        "name": "New Option",
        "type": "slider",
        "description": "Description",
        "min": "1",
        "max": "100",
        "default": "75"
      });
      console.log("index", this.lastIndex);
      this.lastIndex = this.lastIndex + 1;
    },   
    closeWindow() {
      this.currentWindow.close();
    },
    saveData() {
      this.saver.attrs.options = this.options;
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
