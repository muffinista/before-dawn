<template>
  <div class="saver-list-wrapper">
    <h1>Screensavers</h1>
    <ul class="saver-list">
      <saver-list-item
        v-on="$listeners"
        v-for="saver in savers"
        v-bind:saver="saver"
        :checked="saver.key == current"
        :key="saver.url"></saver-list-item>
    </ul>
  </div>
</template>

<script>
  import SaverListItem from "./SaverListItem";

  export default {
    name: "saver-list",
    components: {saverListItem: SaverListItem},
    props: ["savers", "current"],
  }
</script>
