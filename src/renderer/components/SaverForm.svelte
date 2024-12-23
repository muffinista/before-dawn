<script>
  let { saver = $bindable() } = $props();
</script>

<div id="saver-form">
  <form>
    <div class="form-group">
      <label for="name">Name:</label>
      <input bind:value={saver.name} type="text" name="name" required />
      <div class="hint">The name of your screensaver.</div>
    </div>

    <div class="form-group">
      <label for="name">Description:</label>
      <input
        bind:value={saver.description}
        type="text"
        name="description"
        required
      />
      <div class="hint">A brief description of your screensaver.</div>
    </div>
    <div class="form-group">
      <label for="aboutUrl">About URL:</label>
      <input bind:value={saver.aboutUrl} type="text" name="aboutUrl" />
      <div class="hint">
        If you have a URL with more details about your work, put it
        here!
      </div>
    </div>
    <div class="form-group">
      <label for="author">Author:</label>
      <input bind:value={saver.author} type="text" name="author" />
      <div class="hint">The author of this screensaver.</div>
    </div>

    <div class="form-group">
      <h3>Requirements:</h3>
      <input
        type="checkbox"
        name="requirements"
        bind:group={saver.requirements}
        value="screen"
      />
      <label for="screen">Screen capture</label>
      <div class="hint">
        This screensaver will be sent an image of the desktop
      </div>
    </div>
  </form>
</div>

