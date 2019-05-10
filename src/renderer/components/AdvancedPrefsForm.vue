<template>
  <div id="advanced-prefs-form">
    <h1>Advanced Options</h1>
    <p class="form-text text-muted">Be careful with these!</p>
    <form>
      <div class="form-group">
        <label for="repo">Github Repo URL:</label>
        <div class="input-group input-group-sm">
          <div class="input-group-prepend">
            <span class="input-group-text">github.com/</span>
          </div>
          <input type="text" v-model="prefs.sourceRepo"
                 class="form-control form-control-sm" />
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
          <input type="text" v-model="prefs.localSource" readonly="readonly" name="localSource" class="form-control form-control-sm" />
          <span class="input-group-btn">
            <button type="button" class="btn btn-sm btn-secondary pick" @click.stop="showPathChooser">...</button>
          </span>
          <span class="input-group-btn spaced" v-if="prefs.localSource != ''">
            <button type="button" class="btn btn-sm btn-secondary clear" @click.stop="clearLocalSource">X</button>
          </span>
        </div>

        <small class="form-text text-muted">
          We will load screensavers from any directories listed here. Use this to add your own screensavers!
        </small>
      </div>

      <div class="form-group">
        <label for="hotkey">Global hotkey:</label>
        <input type="text"
          name="hotkey"
          readonly="readonly" class="form-control form-control-sm"
          v-model="prefs.launchShortcut"
          v-on:keydown="updateHotkey" />
        <small class="form-text text-muted">
          Enter a key combination that will be used to run a screensaver.
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
    updateHotkey(event) {
      if ( event.key == "Control" || event.key == "Shift" || event.key == "Alt" || event.key == "Meta" ) {
        return;
      }

      let output = [];
      if ( event.ctrlKey ) {
        output.push("Control");
      }
      if ( event.altKey ) {
        output.push("Alt");
      }
      if ( event.metaKey) {
        output.push("Command");
      }
      if ( event.shiftKey ) {
        output.push("Shift");
      }

      if ( output.length === 0 ) {
        if ( event.key == "Backspace" ) {
          event.target.value = "";
          this.$emit("launchShortcutChange", "");
          this.prefs.launchShortcut = undefined;
        }

        return;
      }

      output.push(`${event.key}`.toUpperCase());
      output = output.join("+");

      this.$emit("launchShortcutChange", output);
      this.prefs.launchShortcut = output;

      event.target.value = output;
    },
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
      if ( result === undefined ) {
        return;
      }

      this.$emit("localSourceChange", result[0]);

      // blah this is weird
      this.prefs.localSource = result[0];
      document.querySelector("[name=localSource]").value = this.prefs.localSource;
    }
  }
};
</script>

