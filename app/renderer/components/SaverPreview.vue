<template>
  <div id="wrapper">
    Preview! {{preview}}
  </div>
</template>

<script>
//  import SystemInformation from './LandingPage/SystemInformation';

  export default {
    name: 'saver-preview',
    props: ['preview'],
    components: { },
    methods: {
      open(link) {
        this.$electron.shell.openExternal(link);
      },
    },
  };
</script>

<style>
</style>
