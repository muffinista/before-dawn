<template>
  <div id="advanced-prefs-form">
    <h1>Advanced Options</h1>
    <p class="form-text text-muted">Be careful with these!</p>
    <form>
      <div class="form-group">
        <label for="localSource">Local Source:</label>
        <local-folder-input
          v-on="$listeners"
          :value="prefs.localSource"
          handler="localSourceChange"
          name="localSource"></local-folder-input>

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
import LocalFolderInput from "@/components/LocalFolderInput";

export default {
  name: "advanced-prefs-form",
  components: {
    localFolderInput: LocalFolderInput,
  },
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
          this.prefs.launchShortcut = undefined;
        }

        return;
      }

      output.push(`${event.key}`.toUpperCase());
      output = output.join("+");

      this.prefs.launchShortcut = output;

      event.target.value = output;
    },
  }
};
</script>

