<template>
  <div id="editor">
editor!!
  </div> <!-- #editor -->
</template>

<script>
export default {
  name: 'editor',
  components: {
  },
  computed: {
    manager: function() {
      var currentWindow = this.$electron.remote.getCurrentWindow();
      return currentWindow.savers;
    },
    ipcRenderer: function() {
      return this.$electron.ipcRenderer;
    },
    isLoaded: function() {
      return true;
    },
  },
};
</script>

<style>
  /* CSS */
</style>
