<template>
<ul>
  <saver-list-item
     v-on="$listeners"
     v-for="saver in savers"
     v-bind:saver="saver"
     :key="saver.url"></saver-list-item>
</ul>
</template>

<script>
  import SaverListItem from './SaverListItem';

  export default {
    name: 'saver-list',
    components: {saverListItem: SaverListItem},
    props: ['savers'],
    methods: {
      // onChange(e) {
      //   console.log("saver list changed!");
      // }
    }
  }
</script>

<style>
</style>
