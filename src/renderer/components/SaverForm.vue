<template>
  <div id="saver-form">
    <form>
      <div class="form-group">
        <label for="name">Name:</label>
        <input
          :value="name"
          type="text"
          name="name"
          class="form-control"
          required
          @change="$emit('update', 'name', $event.target.value)"
        >
        <div class="hint">
          The name of your screensaver.
        </div>
      </div>
      
      <div class="form-group">
        <label for="name">Description:</label>
        <input
          :value="description"
          type="text"
          name="description"
          class="form-control"
          required
          @change="$emit('update', 'description', $event.target.value)"
        >
        <div class="hint">
          A brief description of your screensaver.
        </div>
      </div>
      <div class="form-group">
        <label for="aboutUrl">About URL:</label>
        <input
          :value="aboutUrl"
          type="text"
          name="aboutUrl"
          class="form-control"
          @change="$emit('update', 'aboutUrl', $event.target.value)"
        >
        <div class="hint">
          If you have a URL with more details about your work, put it here!
        </div>
      </div>
      <div class="form-group">
        <label for="author">Author:</label>
        <input
          :value="author"
          type="text"
          name="author"
          class="form-control"
        >
        <div class="hint">
          The author of this screensaver.
        </div>
      </div>

      <div class="form-group">
        <h3>Requirements:</h3>
        <input
          id="screen"
          :checked="screen"
          type="checkbox"
          value="screen"
          @change="$emit('update', 'screen', $event.target.checked)"
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
    props: {
      name: {
        type: String,
        required: false,
        default: ""
      },
      description: {
        type: String,
        required: false,
        default: ""
      },
      aboutUrl: {
        type: String,
        required: false,
        default: ""
      },
      author: {
        type: String,
        required: false,
        default: ""
      },
      screen: {
        type: Boolean,
        required: false,
        default: false
      }
    },
    emits: ["update"],
    methods: {
    }
  };
</script>
