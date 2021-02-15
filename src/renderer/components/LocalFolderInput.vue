<template>
  <div class="input-group">
    <input
      type="text"
      readonly="readonly"
      :name="name"
      :value="value"
      class="form-control form-control-sm"
    >
    <span class="input-group-btn">
      <button
        type="button"
        class="btn btn-sm btn-secondary pick"
        @click.stop="showPathChooser"
      >...</button>
    </span>
    <span class="input-group-btn spaced">
      <button
        type="button"
        class="btn btn-sm btn-secondary clear"
        @click.stop="clearLocalSource"
      >X</button>
    </span>
  </div>
</template>

<script>
const ipcRenderer = window.ipcRenderer;

export default {
  name: "LocalFolderInput",
  components: { },
  props: ["name", "value", "handler"],
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
      this.$emit(this.handler, choice);

      // blah this is weird
      document.querySelector(`[name=${this.name}]`).value = choice;
    },
    clearLocalSource() {
      this.$emit(this.handler, "");
      document.querySelector(`[name=${this.name}]`).value = "";
    },
  },
};
</script>
