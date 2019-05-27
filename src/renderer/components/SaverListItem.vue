<template>
  <li class="list-group-item flex-column entry" v-on:click="pickSaver(saver)">
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
          <div class="description">
            <small>{{saver.description}}</small>
          </div>
        </div>
      </label>
    </div>
  </li>
</template>


<script>
export default {
  name: "saver-list-item",
  props: ["saver", "checked"],
  methods: {
    pickSaver(s) {
      document.querySelector(`input[value='${s.key}']`).click();
    }
  }
};
</script>
