<template>
  <li class="list-group-item flex-column entry">
    <div class="d-flex w-100 justify-content-between">
      <label>
        <div class="body">
          <input type="radio" 
            name="screensaver" 
            v-bind:value="saver.key" 
            :data-name="saver.name" 
            v-on="$listeners" 
            :checked="checked"/>
          {{saver.name}}
        </div>
      </label>

      <template v-if="saver.editable">
        <div>
          <a class="btn btn-outline-secondary btn-sm edit" 
            href="#" role="button" 
            :data-name="saver.name" 
            v-on:click="onEditClick(saver)">edit</a>
          <a class="btn btn-outline-secondary btn-sm" 
            href="#" role="button" 
            v-on:click="onDeleteClick(saver)">delete</a>
        </div>
      </template>
    </div>
  </li>
</template>


<script>
const {dialog} = require("electron").remote;
export default {
  name: "saver-list-item",
  props: ["saver", "checked"],
  methods: {
    onEditClick(s) {
      this.$emit("editSaver", s);
    },
    onDeleteClick(s) {
      dialog.showMessageBox(
        {
          type: "info",
          title: "Are you sure?",
          message: "Are you sure you want to delete this screensaver?",
          detail: "Deleting screensaver " + s.name,
          buttons: ["No", "Yes"],
          defaultId: 0
        },
        (result) => {
          if ( result === 1 ) {
            this.$emit("deleteSaver", s);
          }
        }
      ); 
    }
  }
};
</script>
