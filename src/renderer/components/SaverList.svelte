<div class="saver-list-wrapper">
  <h1>Screensavers</h1>
  <ul class="saver-list list-group-flush">
    {#each savers as saver}
      <li class="{saver.key == current ? CHECKED_CLASS : UNCHECKED_CLASS}">
        <div class="d-flex w-100 justify-content-between">
          <label>
            <div class="body">
              <input
                type="radio" 
                name="screensaver" 
                bind:group="{current}"
                data-name="{saver.name}" 
                value="{saver.key}" 
                checked="{saver.key == current}"
                on:change={onSelect}
                >

              <b>{saver.name}</b>
              <template v-if="saver.editable === true">
                &nbsp;(<small>custom</small>)
              </template>
      
              <div class="description">
                <small>{saver.description}</small>
              </div>
            </div>
          </label>
        </div>
      </li>
    {/each}
  </ul>
</div>

<script>
	import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let savers;
  export let current;

  const UNCHECKED_CLASS = "list-group-item flex-column entry";
  const CHECKED_CLASS = `${UNCHECKED_CLASS} active`;

  function onSelect(e) {
    dispatch("saverPicked", {
      saver: e.target.value
    });
  }
</script>
