<template>
  <div class="wrapper">
    <form class="input" v-on="$listeners">
      <label class="for-option">{{option.name}}: {{option.description}}</label>
      <input
        :type="renderType"
        :name="option.name"
        :min="option.min"
        :max="option.max"
        :value="value"
        :saver="saver"
        v-on:change="emitChange(saver, option.name, $event.target.value)" />
    </form>
  </div>
</template>

<script>
  export default {
    name: 'option-input',
    props: ['saver', 'option', 'value'],
    components: { },
    computed: {
      renderType: function() {
        if ( this.option.type === "slider" ) {
          return "range";
        }
        return "text";
      }
    },
    methods: {
      emitChange(saver, name, value) {
        this.$emit("saverOption", saver, name, value);
      },
    },
  };
</script>

<style>
</style>
