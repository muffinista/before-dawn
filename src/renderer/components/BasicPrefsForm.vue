<template>
  <div id="prefs-form">
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
          <label for="sleep">Sleep after:</label>
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
    </form>
  </div>
</template>

<script>
export default {
  name: "basic-prefs-form",
  components: {},
  props: ["prefs"],
  methods: {
  }
};
</script>
