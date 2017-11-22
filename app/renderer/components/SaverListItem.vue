<template>
  <li class="list-group-item flex-column entry">
    <div class="d-flex w-100 justify-content-between">
      <label>
        <div class="body">
          <input type="radio" v-bind:value="saver.key" name="screensaver" v-on="$listeners" />
          <b>{{saver.name}}</b>
        </div>
      </label>

      <div>
        <a class="watcher btn btn-outline-secondary btn-sm" href="#" role="button">edit</a>
        <a class="delete btn btn-outline-secondary btn-sm" href="#" role="button">delete</a>
      </div>
    </div>
  </li>
</template>


<script>
  export default {
    name: 'saver-list-item',
    props: ['saver'],
  };
</script>

<style>
</style>
