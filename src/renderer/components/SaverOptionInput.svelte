<form>
  <div class="form-group">
    <label for="name">Name</label>
    <div>
      <input
        bind:value="{option.name}"
        type="text"
        name="name"
        placeholder="Pick a name for this option"
        required
      >
    </div>
  </div>
  <div class="form-group">
    <label for="description">Description</label>
    <div>
      <input
        bind:value="{option.description}"
        type="text"
        name="description"
        placeholder="Describe what this option does"
      >
    </div>
  </div>       
  <div class="form-group">
    <label for="inputType">Type</label>
    <div>
      <select
        name="type"
        bind:value="{option.type}"
      >
      <option value="slider">
          slider
        </option>
        <option value="text">
          text
        </option>
        <option value="boolean">
          yes/no
        </option>
      </select>
    </div>
  </div>

  {#if option.type === "slider"}
    <div class="space-evenly">
      <div class="form-group">
        <label for="min">Min</label>
        <input
          name="min"
          bind:value="{option.min}"
          type="number"
        >
      </div>
        
      <div class="form-group">
        <label for="max">Max</label>
        <input
          name="max"
          bind:value="{option.max}"
          type="number"
        >
      </div>
      
      <div class="form-group">
        <label for="default">Default</label>
        <input
          name="default"
          bind:value="{option.default}"
          type="text"
          placeholder="Default value of this option"
        >
      </div>
    </div>
  {:else if option.type === "text"}
    <div class="form-group">
      <label for="default">Default</label>
      <div>
        <input
          name="default"
          bind:value="{option.default}"
          type="text"
          placeholder="Default value of this option"
        >
      </div>
    </div>
    {:else if option.type === "boolean"}
    <div class="form-group">
      <label for="default">Default</label>
      <div>
        <select
          name="default"
          bind:value="{option.default}"
        >
        <option
            disabled
            value=""
          >
            Please select one
          </option>
          <option value="true">
            Yes
          </option>
          <option value="false">
            No
          </option>
        </select>
      </div>
    </div>
  {/if}
</form>

<style>
div.space-evenly {
  display: flex;
  justify-content: space-between;
  max-width: 95%;
}

div.space-evenly > .form-group {
  max-width: 25%;
}

</style>

<script>
let { option = $bindable() } = $props();
</script>
