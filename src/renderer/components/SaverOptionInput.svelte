<form>
  <div class="form-group row">
    <label class="col-sm-2 col-form-label" for="name">Name</label>
    <div class="col-sm-10">
      <input
        bind:value="{option.name}"
        type="text"
        name="name"
        class="form-control"
        placeholder="Pick a name for this option"
        required
      >
    </div>
  </div>
  <div class="form-group row">
    <label class="col-sm-2 col-form-label" for="description">Description</label>
    <div class="col-sm-10">
      <input
        bind:value="{option.description}"
        type="text"
        name="description"
        placeholder="Describe what this option does"
        class="form-control"
        required
      >
    </div>
  </div>       
  <div class="form-group row">
    <label class="col-sm-2 col-form-label" for="inputType">Type</label>
    <div class="col-sm-10">
      <select
        name="type"
        bind:value="{option.type}"
        class="form-control"
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
        <label class="col-sm-2 col-form-label" for="min">Min</label>
        <input
          name="min"
          bind:value="{option.min}"
          type="number"
          class="form-control"
        >
      </div>
        
      <div class="form-group">
        <label class="col-sm-2 col-form-label" for="max">Max</label>
        <input
          name="max"
          bind:value="{option.max}"
          type="number"
          class="form-control"
        >
      </div>
      
      <div class="form-group">
        <label class="col-sm-2 col-form-label" for="default">Default</label>
        <input
          name="default"
          bind:value="{option.default}"
          type="text"
          placeholder="Default value of this option"
          class="form-control"
        >
      </div>
    </div>
  {:else if option.type === "text"}
    <div class="form-group row">
      <label class="col-sm-2 col-form-label" for="default">Default</label>
      <div class="col-sm-10">
        <input
          name="default"
          bind:value="{option.default}"
          type="text"
          placeholder="Default value of this option"
          class="form-control"
        >
      </div>
    </div>
    {:else if option.type === "boolean"}
    <div class="form-group row">
      <label class="col-sm-2 col-form-label" for="default">Default</label>
      <div class="col-sm-2">
        <select
          name="default"
          bind:value="{option.default}"
          class="form-control"
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
  <div class="form-actions">
    <button
      type="button"
      class="btn btn-danger remove-option"
      on:click="{onDeleteClick(option)}"
    >
      Remove this Option
    </button>
  </div>
</form>

<script>
export let saver;
export let option;
function onDeleteClick() {
  const index = saver.options.indexOf(option);
  saver.options.splice(index, 1);
  saver = saver;
}
</script>
