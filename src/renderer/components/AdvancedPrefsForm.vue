<template>
  <div id="advanced-prefs-form">
    <h1>Advanced Options <small class="text-muted">Be careful with these!</small></h1>
    <form>
      <div class="form-group">
        <label for="repo">Github Repo URL:</label>
        <div class="input-group">
          <div class="input-group-prepend">
            <span class="input-group-text">github.com/</span>
          </div>
          <input type="text" v-model="prefs.sourceRepo"
                 class="form-control" />
        </div>
        <small class="form-text text-muted">
          We will download releases from this repository instead of
          the default repo if specified. This defaults to
          'muffinista/before-dawn-screensavers'
        </small>
      </div>

      <div class="form-group">
        <label for="localSource">Local Source:</label>
        <div class="input-group">
          <input type="text" v-model="prefs.localSource" readonly="readonly" name="localSource" class="form-control" />
          <span class="input-group-btn">
            <button type="button" class="btn btn-secondary pick" @click.stop="showPathChooser">...</button>
          </span>
          <span class="input-group-btn spaced" v-if="prefs.localSource != ''">
            <button type="button" class="btn btn-secondary clear" @click.stop="clearLocalSource">X</button>
          </span>
        </div>

        <small class="form-text text-muted">
          We will load screensavers from any directories listed here. Use this to add your own screensavers!
        </small>
      </div>
    </form>
  </div>
</template>

<script>
const {dialog} = require("electron").remote;
export default {
  name: "advanced-prefs-form",
  components: {},
  props: ["prefs"],
  methods: {
    showPathChooser() {
      dialog.showOpenDialog(
        {
          properties: [ "openDirectory", "createDirectory" ]
        },
        this.handlePathChoice );
    },
    clearLocalSource() {
      this.$emit("localSourceChange", "");
      this.prefs.localSource = "";
      document.querySelector("[name=localSource]").value = this.prefs.localSource;
    },
    handlePathChoice(result) {
      this.$emit("localSourceChange", result[0]);

      // blah this is weird
      this.prefs.localSource = result[0];
      document.querySelector("[name=localSource]").value = this.prefs.localSource;
    }
  }
};
</script>

<style>
.input-group-btn.spaced {
  margin-left: 3px;
}
</style>
