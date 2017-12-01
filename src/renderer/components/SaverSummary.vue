<template>
  <div class="saver-description">
    <h1>{{name}} <a :href="aboutUrl" v-on:click="open" v-if="hasUrl">learn more</a></h1>
    <p>{{description}}</p>
    <span v-if="hasAuthor">
      {{author}}
    </span>
  </div>
</template>

<script>
  const _ = require('lodash');
  export default {
    name: 'saver-summary',
    props: ['saver'],
    components: { },
    computed: {
      name() {
        return this.saver.name;
      },
      aboutUrl() {
        return this.saver.aboutUrl;
      },
      hasUrl() {
        return this.saver.aboutUrl !== undefined &&
          this.saver.aboutUrl !== "";
      },
      description() {
        return this.saver.description;
      },
      author() {
        return this.saver.author;
      },
      hasAuthor() {
        return this.saver.author !== undefined &&
          this.saver.author !== "";
      }
    },
    methods: {
      open(evt) {
        evt.preventDefault();
        this.$electron.shell.openExternal(event.target.href);
      }
    }
  };
</script>

<style>
</style>
