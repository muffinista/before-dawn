<template>
  <form v-on="$listeners" :class="formType">
    <div class="form-group row">
      <label class="col-sm-2 col-form-label">Name</label>
      <div class="col-sm-10" >
        <input type="text"
               v-model="option.name"
               name="name" class="form-control"
               placeholder="Pick a name for this option" required />
      </div>
    </div>
    
    <div class="form-group row">
      <label class="col-sm-2 col-form-label">Description</label>
      <div class="col-sm-10" >
        <input type="text"
               v-model="option.description"
               placeholder="Describe what this option does"
               class="form-control" required />
      </div>
    </div>
        
    <div class="form-group row">
      <label class="col-sm-2 col-form-label">Type</label>
      <div class="col-sm-10" >
        <select v-model="option.type"
                class="form-control">
          <option value="slider">slider</option>
          <option value="text">text</option>
        </select>
      </div>
    </div>

    <div class="form-group row">
      <label class="col-sm-2 col-form-label only-for-slider">Min</label>
      <div class="col-sm-2 only-for-slider">
        <input type="number"
               v-model="option.min"
               class="form-control" />
      </div>
      
      <label class="col-sm-2 col-form-label only-for-slider">Max</label>
      <div class="col-sm-2 only-for-slider">
        <input type="number"
               v-model="option.max"
               class="form-control" />
      </div>
      
      <label class="col-sm-2 col-form-label">Default</label>
      <div :class="defaultInputClass">
        <input type="text"
               v-model="option.default"
               placeholder="Default value of this option"
               class="form-control" />
      </div>
    </div>
    
    <div class="form-actions">
      <button type="button"
              class="btn btn-danger"
              v-on:click="onDeleteClick(option)">Remove this Option</button>
    </div>
  </form>
</template>

<script>
  export default {
    name: 'saver-option-input',
    props: ['option'],
    components: { },
    computed: {
      formType: function() {
        if ( this.option.type === "slider" ) {
          return "option-range";
        }
        return "option-text";
      },
      defaultInputClass: function() {
        if ( this.option.type === "slider" ) {
          return "col-sm-2";
        }

        return "col-sm-10";
      }
    },
    methods: {
      onDeleteClick() {
        this.$emit("deleteOption");
      },
    },
  };
</script>

<style>
</style>
