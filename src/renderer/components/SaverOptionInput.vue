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
          :value="option.name"
          type="text"
          name="name"
          class="form-control"
          placeholder="Pick a name for this option"
          required
          @change="emitChange('name', $event.target.value)"
        >
      </div>
    </div>
    <div class="form-group row">
      <label class="col-sm-2 col-form-label">Description</label>
      <div class="col-sm-10">
        <input
          :value="option.description"
          type="text"
          name="description"
          placeholder="Describe what this option does"
          class="form-control"
          required
          @change="emitChange('description', $event.target.value)"
        >
      </div>
    </div>       
    <div class="form-group row">
      <label class="col-sm-2 col-form-label">Type</label>
      <div class="col-sm-10">
        <select
          :value="inputType"
          class="form-control"
          @change="changeInputType($event.target.value)"
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
            :value="option.min"
            type="number"
            class="form-control"
            @change="emitChange('min', $event.target.value)"
          >
        </div>
          
        <div class="form-group">
          <label class="col-sm-2 col-form-label">Max</label>
          <input
            :value="option.max"
            type="number"
            class="form-control"
            @change="emitChange('max', $event.target.value)"
          >
        </div>
        
        <div class="form-group">
          <label class="col-sm-2 col-form-label">Default</label>
          <input
            :value="option.default"
            type="text"
            placeholder="Default value of this option"
            class="form-control"
            @change="emitChange('default', $event.target.value)"
          >
        </div>
      </div>
    </template>
    <template v-if="option.type === 'text'">
      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Default</label>
        <div class="col-sm-10">
          <input
            :value="option.default"
            type="text"
            placeholder="Default value of this option"
            class="form-control"
            @change="emitChange('default', $event.target.value)"
          >
        </div>
      </div>
    </template>
    <template v-if="option.type ==='boolean'">
      <div class="form-group row">
        <label class="col-sm-2 col-form-label">Default</label>
        <div class="col-sm-2">
          <select
            :value="option.default"
            class="form-control"
            @change="emitChange('default', $event.target.value)"
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
    props: {
      option: {
        type: Object,
        default: function() { return {}; }
      },
      index: {
        type: Number,
        default: 0
      }
    },
    computed: {
      formType: function() {
        console.log(`formType: ${this.option.type}`);
        if ( this.option.type === "slider" ) {
          return "entry option-range";
        }
        else if ( this.option.type === "boolean" ) {
          return "entry option-boolean";
        }

        return "entry option-text";
      },
      inputType() {
        return this.option.type;
      }
    },
    methods: {
      noop() {},
      emitChange(key, value) {
        this.$emit("saverOptionAttr", this.index, key, value);
      },
      changeInputType(value) {
        // console.log(value);
        // this.option.type = value;
        this.$emit("saverOptionAttr", this.index, "type", value);
      },
      onDeleteClick() {
        this.$emit("deleteOption");
      },
    },
  };
</script>
