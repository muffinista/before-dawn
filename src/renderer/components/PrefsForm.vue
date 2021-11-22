<template>
  <div id="prefs-form">
    <h1>Settings</h1>
    <form
      class="grid"
    >
      <div class="options">
        <div class="form-check">
          <label class="form-check-label">
            <input
              id="lock"
              :checked="lock"
              type="checkbox"
              class="form-check-input"
              @change="$emit('update', 'lock', $event.target.checked)"
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
              :checked="disableOnBattery"
              type="checkbox"
              class="form-check-input"
              @change="$emit('update', 'disableOnBattery', $event.target.checked)"
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
              :checked="auto_start"
              type="checkbox"
              class="form-check-input"
              @change="$emit('update', 'auto_start', $event.target.checked)"
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
              :checked="runOnSingleDisplay"
              type="checkbox"
              class="form-check-input"
              @change="$emit('update', 'runOnSingleDisplay', $event.target.checked)"
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
  props: {
    lock: {
      type: Boolean,
      default: true
    },
    disableOnBattery: {
      type: Boolean,
      default: true
    },
    // eslint-disable-next-line vue/prop-name-casing
    auto_start: {
      type: Boolean,
      default: false
    },
    runOnSingleDisplay: {
      type: Boolean,
      default: true
    }
  },
  emits: ["update"],
};
</script>
