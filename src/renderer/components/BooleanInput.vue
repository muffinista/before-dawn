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
    props: {
      name: {
        type: String,
        required: true
      },
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
    computed: {
    },
    methods: {
      emitChange(name, value) {
        this.$emit("saverOption", name, value);
      },
    },
  };
</script>
