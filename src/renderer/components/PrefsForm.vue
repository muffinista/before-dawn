<template>
  <div id="prefs-form">
    <h1>Preferences</h1>
    <form v-on="$listeners" class="grid">
      <div class="times">
        <div class="form-group">
          <label for="delay">Activate after:</label>
          <select name="delay" v-model="prefs.delay">
            <option value="0">never</option>
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
          <small class="form-text text-muted">
            The screensaver will activate once your computer has been idle for this amount of time.
          </small>
        </div>
        
        <div class="form-group">
          <label for="sleep">Disable displays after:</label>
          <select name="sleep" v-model="prefs.sleep">
            <option value="0">never</option>
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
          <small class="form-text text-muted">
            The screensaver will stop, and the displays will
            be turned off to save energy after this amount
            of time.
          </small>
        </div>
      </div>

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
            <input type="checkbox" id="disable_on_battery" class="form-check-input" v-model="prefs.disableOnBattery" />
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

<style>
.input-group-btn.spaced {
  margin-left: 3px;
}
</style>
