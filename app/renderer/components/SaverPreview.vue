<template>
  <div id="wrapper">
    Preview! {{preview}}
    Screenshot! {{screenshot}}
  </div>
</template>

<script>
  export default {
    name: 'saver-preview',
    props: ['preview', 'screenshot'],
    components: { },
    methods: {
    },
  };
</script>

<style>
</style>
