<template>
  <li
    :class="classes"
  >
    <div class="d-flex w-100 justify-content-between">
      <label>
        <div class="body">
          <input
            type="radio" 
            name="screensaver" 
            :data-name="saver.name" 
            :value="saver.key" 
            :checked="checked"
          >
          <b>{{ saver.name }}</b>
          <template v-if="saver.editable === true">
            &nbsp;(<small>custom</small>)
          </template>

          <div class="description">
            <small>{{ saver.description }}</small>
          </div>
        </div>
      </label>
    </div>
  </li>
</template>


<script>
export default {
  name: "SaverListItem",
  props: {
    saver: {
      type: Object,
      required: true
    },
    checked: {
      type: Boolean,
      required: true,
      default: false
    }
  },
  computed: {
    classes() {
      let base = "list-group-item flex-column entry";
      if ( this.checked ) {
        return base + " active";
      }
      return base;
    }
  },
  methods: {
  }
};
</script>
