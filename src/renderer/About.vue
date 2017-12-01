<template>
<div id="about">
  <div class="container-fluid">
    <h1>Before Dawn</h1>
    <h2>// screensaver fun //</h2>
    <h3>{{version}}</h3>

    <p>An open-source screensaver
      project.<br /> <a href="http://muffinista.github.io/before-dawn/"
                        v-on:click="open">learn more</a></p>
    
    <p>Having
    trouble? <a href="http://github.com/muffinista/before-dawn/issues"
                v-on:click="open">please let us know!</a></p>

    <hr />

    <p><small><a href="https://thenounproject.com/search/?q=sunrise&i=172009"
                 v-on:click="open">App
          icon</a> Sun by Ale Estrada from the Noun Project</small></p>
    
    <p><small>Powered by <a href="http://electron.atom.io/" v-on:click="open">Electron</a></small></p>
  </div>
</div>
</template>

<script>
export default {
  name: 'about',
  components: {},
  computed: {
    version: function() {
      return this.$electron.remote.getGlobal('APP_VERSION');
    }
  },
  mounted() {
  },
  methods: {
    open(evt) {
      evt.preventDefault();
      this.$electron.shell.openExternal(event.target.href);
    }
  },
};
</script>

<style>
  /* CSS */
</style>
