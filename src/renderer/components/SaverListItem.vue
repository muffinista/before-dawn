<template>
  <li
    :class="classes"
    @click="pickSaver(saver)"
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
    pickSaver() {
      // document.querySelector(`input[name='screensaver'][value='${s.key}']`).click();
    }
  }
};
</script>
