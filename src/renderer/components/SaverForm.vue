<template>
  <div id="saver-form">
    <form v-on="$listeners">
      <div class="form-group">
        <label for="name">Name:</label>
        <input
          v-model="saver.name"
          type="text"
          name="name"
          class="form-control"
          required
        >
        <div class="hint">
          The name of your screensaver.
        </div>
      </div>
      
      <div class="form-group">
        <label for="name">Description:</label>
        <input
          v-model="saver.description"
          type="text"
          name="description"
          class="form-control"
          required
        >
        <div class="hint">
          A brief description of your screensaver.
        </div>
      </div>
      <div class="form-group">
        <label for="aboutUrl">About URL:</label>
        <input
          v-model="saver.aboutUrl"
          type="text"
          name="aboutUrl"
          class="form-control"
        >
        <div class="hint">
          If you have a URL with more details about your work, put it here!
        </div>
      </div>
      <div class="form-group">
        <label for="author">Author:</label>
        <input
          v-model="saver.author"
          type="text"
          name="author"
          class="form-control"
        >
        <div class="hint">
          The author of this screensaver.
        </div>
      </div>

      <div class="form-group">
        <h5>Requirements:</h5>
        <input
          id="screen"
          v-model="saver.requirements"
          type="checkbox"
          value="screen"
        >
        <label for="screen">Screen capture</label>
        <div class="hint">
          This screensaver will be sent an image of the desktop
        </div>
      </div>
    </form>
  </div>
</template>

<script>
  export default {
    name: "SaverForm",
    components: { },
    props: ["saver"],
    methods: {
    }
  };
</script>
