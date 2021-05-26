<template>
  <div class="wrapper">
    <form class="input">
      <label class="for-option">{{ option.name }}: {{ option.description }}</label>
      <div class="boolean-options">
        <label>Yes
          <input
            type="radio"
            :name="name"
            value="true"
            :checked="value==true || value==='true'"
            @change="emitChange(name, true)"
          ></label>
        
        <label>No
          <input
            type="radio"
            :name="name"
            value="false"
            :checked="value==false || value==='false'"
            @change="emitChange(name, false)"
          ></label>
      </div>
    </form>
  </div>
</template>

<script>
  export default {
    name: "BooleanInput",
  
    components: { },
    props: ["saver", "option", "name", "value"],
    computed: {
    },
    methods: {
      emitChange(name, value) {
        this.$emit("saverOption", this.saver, name, value);
      },
    },
  };
</script>
