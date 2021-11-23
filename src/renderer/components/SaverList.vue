<template>
  <div class="saver-list-wrapper">
    <h1>Screensavers</h1>
    <ul class="saver-list list-group-flush">
      <saver-list-item       
        v-for="saver in savers"
        :key="saver.url"
        :saver="saver"
        :checked="saver.key == current"
      />
    </ul>
  </div>
</template>

<script>
  import SaverListItem from "./SaverListItem";

  export default {
    name: "SaverList",
    components: {saverListItem: SaverListItem},
    props: {
      savers: {
        type: Array,
        default: function() {
          return [];
        }
      },
      current: {
        type: String,
        required: false,
        default: undefined
      }
    }
  };
</script>
