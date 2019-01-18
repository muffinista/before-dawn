<template>
  <div id="saver-form">
    <form v-on="$listeners">
      <div class="form-group">
        <label for="name">Name:</label>
        <input type="text"
               name="name"
               v-model="saver.name"
               class="form-control" required />
        <div class="hint">The name of your screensaver.</div>
      </div>
      
      <div class="form-group">
        <label for="name">Description:</label>
        <input type="text"
               name="description"
               v-model="saver.description"
               class="form-control" required />
        <div class="hint">A brief description of your screensaver.</div>
      </div>
      <div class="form-group">
        <label for="aboutUrl">About URL:</label>
        <input type="text"
               name="aboutUrl"
               v-model="saver.aboutUrl"
               class="form-control" />
        <div class="hint">If you have a URL with more details about your work, put it here!</div>
      </div>
      <div class="form-group">
        <label for="author">Author:</label>
        <input type="text"
               name="author"
               v-model="saver.author"
               class="form-control" />
        <div class="hint">The author of this screensaver.</div>
      </div>
    </form>
  </div>
</template>

<script>
  export default {
    name: "saver-form",
    components: { },
    props: ["saver"],
    methods: {
    }
  };
</script>
