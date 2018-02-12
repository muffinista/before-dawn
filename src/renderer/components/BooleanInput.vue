<template>
  <div id="wrapper">
    <form v-on="$listeners">
      <label class="for-option">{{option.description}}</label>
      <label>Yes
        <input
          type="radio"
          :name="name"
          value="true"
          :checked="value==true || value==='true'"
          v-on:change="emitChange(name, true)"></label>
        
      <label>No
        <input
          type="radio"
          :name="name"
          value="false"
          :checked="value==false || value==='false'"
          v-on:change="emitChange(name, false)"></label>
    </form>
  </div>
</template>

<script>
  export default {
    name: 'boolean-input',
    props: ['saver', 'option', 'name', 'value'],
  
    components: { },
    computed: {
    },
    methods: {
      emitChange(name, value) {
        this.$emit("saverOption", this.saver, name, value);
      },
    },
  };
</script>

<style>
</style>
