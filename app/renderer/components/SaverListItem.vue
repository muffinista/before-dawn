<template>
  <li class="list-group-item flex-column entry">
    <div class="d-flex w-100 justify-content-between">
      <label>
        <div class="body">
          <input type="radio" v-bind:value="saver.key" name="screensaver" v-on="$listeners" :checked="checked"/>
          <b>{{saver.name}}</b>
        </div>
      </label>

      <template v-if="saver.editable">
        <div>
          <a class="btn btn-outline-secondary btn-sm" href="#" role="button" v-on:click="onEditClick(saver)">edit</a>
          <a class="btn btn-outline-secondary btn-sm" href="#" role="button" v-on:click="onDeleteClick(saver)">delete</a>
        </div>
      </template>
    </div>
  </li>
</template>


<script>
  export default {
    name: 'saver-list-item',
    props: ['saver', 'checked'],
    methods: {
      onEditClick(s) {
        this.$emit("editSaver", s);
      },
      onDeleteClick(s) {
        this.$emit("deleteSaver", s);
      }      
    }
  };
</script>

<style>
</style>
