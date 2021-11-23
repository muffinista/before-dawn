<template>
  <div class="wrapper">
    <form class="input">
      <label class="for-option">{{ option.name }}:</label>
      <input
        :type="renderType"
        :name="option.name"
        :min="option.min"
        :max="option.max"
        :value="value"
        :class="inputClass"
        @change="emitChange(option.name, $event.target.value)"
      >
      <small class="form-text text-muted">{{ option.description }}</small>
    </form>
  </div>
</template>

<script>
  export default {
    name: "OptionInput",
    components: { },
    props: {
      option: {
        type: Object,
        required: true,
        default: function() { return {}; }
      },
      value: {
        type: String,
        required: false,
        default: undefined
      }
    },
    emits: ["saverOption"],
    computed: {
      renderType: function() {
        if ( this.option.type === "slider" ) {
          return "range";
        }
        return "text";
      },
      inputClass: function() {
        if ( this.option.type === "slider" ) {
          return "form-control-range";
        }
        return "form-control";
      }
    },
    methods: {
      emitChange(name, value) {
        this.$emit("saverOption", name, value);
      },
    },
  };
</script>
