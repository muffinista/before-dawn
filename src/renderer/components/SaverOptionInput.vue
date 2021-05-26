<template>
  <form
    :class="formType"
    :data-index="index"
    @submit.prevent="noop"
  >
    <div class="form-group row">
      <label class="col-sm-2 col-form-label">Name</label>
      <div class="col-sm-10">
        <input
          v-model="option.name"
          type="text"
          name="name"
          class="form-control"
          placeholder="Pick a name for this option"
          required
        >
      </div>
    </div>
    <div class="form-group row">
      <label class="col-sm-2 col-form-label">Description</label>
      <div class="col-sm-10">
        <input
          v-model="option.description"
          type="text"
          name="description"
          placeholder="Describe what this option does"
          class="form-control"
          required
        >
      </div>
    </div>       
    <div class="form-group row">
      <label class="col-sm-2 col-form-label">Type</label>
      <div class="col-sm-10">
        <select
          v-model="option.type"
          class="form-control"
        >
          <option value="slider">
            slider
          </option>
          <option value="text">
            text
          </option>
          <option value="boolean">
            yes/no
          </option>
        </select>
      </div>
    </div>

    <template v-if="option.type === 'slider'">
      <div class="space-evenly">
        <div class="form-group">
          <label class="col-sm-2 col-form-label">Min</label>
          <input
            v-model="option.min"
            type="number"
            class="form-control"
          >
        </div>
          
        <div class="form-group">
          <label class="col-sm-2 col-form-label">Max</label>
          <input
            v-model="option.max"
            type="number"
            class="form-control"
          >
        </div>
        
        <div class="form-group">
          <label class="col-sm-2 col-form-label">Default</label>
          <input
            v-model="option.default"
            type="text"
            placeholder="Default value of this option"
            class="form-control"
          >
        </div>
      </div>
    </template>
    <template v-if="option.type === 'text'">
      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Default</label>
        <div class="col-sm-10">
          <input
            v-model="option.default"
            type="text"
            placeholder="Default value of this option"
            class="form-control"
          >
        </div>
      </div>
    </template>
    <template v-if="option.type ==='boolean'">
      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Default</label>
        <div class="col-sm-2">
          <select
            v-model="option.default"
            class="form-control"
          >
            <option
              disabled
              value=""
            >
              Please select one
            </option>
            <option value="true">
              Yes
            </option>
            <option value="false">
              No
            </option>
          </select>
        </div>
      </div>
    </template>
    <div class="form-actions">
      <button
        type="button"
        class="btn btn-danger remove-option"
        @click="onDeleteClick(option)"
      >
        Remove this Option
      </button>
    </div>
  </form>
</template>

<script>
  export default {
    name: "SaverOptionInput",
    components: { },
    props: ["option", "index"],
    computed: {
      formType: function() {
        if ( this.option.type === "slider" ) {
          return "entry option-range";
        }
        else if ( this.option.type === "boolean" ) {
          return "entry option-boolean";
        }

        return "entry option-text";
      }
    },
    methods: {
      noop() {},
      onDeleteClick() {
        this.$emit("deleteOption");
      },
    },
  };
</script>
