<template>
  <div id="prefs-form">
    <h1>Settings</h1>
    <form v-on="$listeners" class="grid">
      <div class="options">
        <div class="form-check">
          <label class="form-check-label">
            <input type="checkbox" id="lock" class="form-check-input" v-model="prefs.lock" />
            Lock screen after running?
          </label>
          <small class="form-text text-muted">
            When the screen saver turns off, the user will need to enter their password.
          </small>
        </div>

        <div class="form-check">
          <label class="form-check-label">
            <input type="checkbox" id="disableOnBattery" class="form-check-input" v-model="prefs.disableOnBattery" />
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
            <input type="checkbox" class="form-check-input" v-model="prefs.auto_start" />
            Auto start on login?
          </label>
          <small class="form-text text-muted">
            If checked, Before Dawn will start when your computer starts.
          </small>
        </div>

        <div class="form-check">
          <label class="form-check-label">
            <input type="checkbox" id="primary-display" class="form-check-input"
                   v-model="prefs.runOnSingleDisplay" />
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
  name: "prefs-form",
  components: {},
  props: ["prefs"],
  methods: {
  }
};
</script>
