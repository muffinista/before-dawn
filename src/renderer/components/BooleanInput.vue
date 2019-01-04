<template>
  <div class="wrapper">
    <form class="input" v-on="$listeners">
      <label class="for-option">{{option.name}}: {{option.description}}</label>
      <div class="boolean-options">
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
      </div>
    </form>
  </div>
</template>

<script>
  export default {
    name: "boolean-input",
    props: ["saver", "option", "name", "value"],
  
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
