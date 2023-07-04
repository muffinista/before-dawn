<div id="wrapper">
  <ul>
    {#each saver.options as option, index}
    <li key={index}>
      <div class="wrapper">
        {#if option.type === "boolean"}
          <form class="input">
            <label class="for-option" for="{option.name}">{option.name}: {option.description}</label>
            <div class="boolean-options">
              <label>Yes
                <input
                  type="radio"
                  name="{option.name}"
                  value="true"
                  checked="{saver.settings[option.name] == true || saver.settings[option.name] === "true"}"
                  on:change={notifyPreviewChange}
                ></label>
              <label>No
                <input
                  type="radio"
                  name="{option.name}"
                  value="false"
                  checked="{saver.settings[option.name] == false || saver.settings[option.name] === "false"}"
                  on:change={notifyPreviewChange}
                ></label>
              </div>
          </form>
          {:else if option.type === "slider"}
          <form class="input">
            <label class="for-option" for="{option.name}">{option.name}:</label>
            <input
              type="range"
              name="{option.name}"
              min="{option.min}"
              max="{option.max}"
              bind:value="{saver.settings[option.name]}"
              class="inputClass"
              on:change={notifyPreviewChange}
            >
            <small class="form-text text-muted">{option.description}</small>
          </form>

          {:else}
          <form class="input">
            <label class="for-option" for="{option.name}">{option.name}:</label>
            <input
              type="text"
              name="{option.name}"
              bind:value="{saver.settings[option.name]}"
              class="inputClass"
              on:change={notifyPreviewChange}
            >
            <small class="form-text text-muted">{option.description}</small>
          </form>
        {/if}
      </div>
    </li>
    {/each}
  </ul>
</div>

<script>
	import { createEventDispatcher } from "svelte";
  const dispatch = createEventDispatcher();

  export let saver;

  function notifyPreviewChange() {
		dispatch("optionsChanged", {
			options: saver.settings
		});
	}
</script>
