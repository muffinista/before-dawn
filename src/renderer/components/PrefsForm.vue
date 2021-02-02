<template>
  <div id="prefs-form">
    <h1>Settings</h1>
    <form
      class="grid"
      v-on="$listeners"
    >
      <div class="options">
        <div class="form-check">
          <label class="form-check-label">
            <input
              id="lock"
              v-model="prefs.lock"
              type="checkbox"
              class="form-check-input"
            >
            Lock screen after running?
          </label>
          <small class="form-text text-muted">
            When the screen saver turns off, the user will need to enter their password.
          </small>
        </div>

        <div class="form-check">
          <label class="form-check-label">
            <input
              id="disableOnBattery"
              v-model="prefs.disableOnBattery"
              type="checkbox"
              class="form-check-input"
            >
            Disable when on battery?
          </label>
          <small class="form-text text-muted">
            If checked, Before Dawn won't
            activate when you're not plugged in -- your
            computer's power settings can blank the screen
            instead.
          </small>
        </div>
        <!-- ' -->
        <div class="form-check">
          <label class="form-check-label">
            <input
              v-model="prefs.auto_start"
              type="checkbox"
              class="form-check-input"
            >
            Auto start on login?
          </label>
          <small class="form-text text-muted">
            If checked, Before Dawn will start when your computer starts.
          </small>
        </div>

        <div class="form-check">
          <label class="form-check-label">
            <input
              id="primary-display"
              v-model="prefs.runOnSingleDisplay"
              type="checkbox"
              class="form-check-input"
            >
            Only run on the primary display?
          </label>
          <small class="form-text text-muted">
            If you have multiple displays, only run on the primary one.
          </small>
        </div>
      </div>
    </form>
  </div>
</template>

<script>
export default {
  name: "PrefsForm",
  components: {},
  props: ["prefs"],
  methods: {
  }
};
</script>
