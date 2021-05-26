<template>
  <div class="input-group">
    <input
      type="text"
      readonly="readonly"
      :name="name"
      :value="value"
    >
    <button
      type="button"
      class="pick"
      @click.stop="showPathChooser"
    >
      ...
    </button>
    <button
      type="button"
      class="clear"
      @click.stop="clearLocalSource"
    >
      X
    </button>
  </div>
</template>
<script>
export default {
  name: "LocalFolderInput",
  components: { },
  props: ["name", "value", "handler"],
  emits: ["update"],
  computed: {
  },
  methods: {
    async showPathChooser() {
      const result = await window.api.showOpenDialog();
      this.handlePathChoice(result);
    },
    handlePathChoice(result) {
      if ( result === undefined || result.canceled ) {
        return;
      }

      const choice = result.filePaths[0];
      this.$emit("update", choice);

      // blah this is weird
      document.querySelector(`[name=${this.name}]`).value = choice;
    },
    clearLocalSource() {
      this.$emit("update", "");
      document.querySelector(`[name=${this.name}]`).value = "";
    },
  },
};
</script>
