<template>
  <div id="wrapper">
    <form v-on="$listeners">
      <label>{{option.description}}</label>
      <template v-if="option.type === 'boolean'">
        <label>Yes
          <input
            type="radio"
            :name="option.name"
            v-model="value"
            v-bind:value="true"
            :saver="saver"
            v-on:change="emitChange(saver, option.name, $event.target.value)"></label>
        
        <label>No
          <input
            type="radio"
            :name="option.name"
            v-model="value"
            v-bind:value="false"
            :saver="saver"
            v-on:change="emitChange(saver, option.name, $event.target.value)"></label>
      </template>
      <template v-if="option.type !== 'boolean'">
        <input
          :type="renderType"
          :name="option.name"
          :min="option.min"
          :max="option.max"
          :value="value"
          :saver="saver"
          v-on:change="emitChange(saver, option.name, $event.target.value)" />
      </template>
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
        if ( this.option.type === "boolean" ) {
          return "checkbox";
        }
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
