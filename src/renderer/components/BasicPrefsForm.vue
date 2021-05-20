<template>
  <div id="prefs-form">
    <form class="grid">
      <div class="times">
        <div class="form-group">
          <label for="delay">Activate after:</label>
          <select
            :value="delay"
            name="delay"
            @change="$emit('update:delay', $event.target.value)"
          >
            <option value="0">
              never
            </option>
            <option value="1">
              1 minute
            </option>
            <option value="5">
              5 minutes
            </option>
            <option value="10">
              10 minutes
            </option>
            <option value="15">
              15 minutes
            </option>
            <option value="30">
              30 minutes
            </option>
            <option value="60">
              1 hour
            </option>
          </select>
          <small class="form-text text-muted block">
            The screensaver will activate once your computer has been idle for this amount of time.
          </small>
        </div>
        
        <div class="form-group">
          <label for="sleep">Sleep after:</label>
          <select
            :value="sleep"
            name="sleep"
            @change="$emit('update:sleep', $event.target.value)"
          >
            <option value="0">
              never
            </option>
            <option value="1">
              1 minute
            </option>
            <option value="5">
              5 minutes
            </option>
            <option value="10">
              10 minutes
            </option>
            <option value="15">
              15 minutes
            </option>
            <option value="30">
              30 minutes
            </option>
            <option value="60">
              1 hour
            </option>
          </select>
          <small class="form-text text-muted block">
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
  name: "BasicPrefsForm",
  components: {},
  props: {
    delay: {
      type: Number,
      default: 10
    },
    sleep: {
      type: Number,
      default: 10
    }
  },
  emits: ["update:delay", "update:sleep"],
  methods: {
  }
};
</script>
