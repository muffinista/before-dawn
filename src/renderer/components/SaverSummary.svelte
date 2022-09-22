<div class="saver-description">
  {#if saver}
    {saver.name}
    <h1>
      {saver.name} 
      {#if saver.aboutUrl && saver.aboutUrl !== ""}<small><a href="{saver.aboutUrl}" on:click={open}>learn more</a></small>{/if}
    </h1>
    {#if saver.editable}
      <div class="actions">
        <button
          class="btn btn-outline-secondary btn-sm edit" 
          href="#"
          on:click="{onEditClick}"
        >
        edit
        </button>
        <button
          class="btn btn-outline-secondary btn-sm" 
          href="#"
          on:click="{onDeleteClick}"
        >
          delete
        </button>
      </div>
    {/if}

    <p>{saver.description}</p>
    {#if saver.author && saver.author !== ""}
      <span>
        by: {saver.author}
      </span>
    {/if}
  {/if}
</div>

<script>
	import { createEventDispatcher } from "svelte";

  const dispatch = createEventDispatcher();

  export let saver;

  function open(event) {
    event.preventDefault();
    window.api.openUrl(event.target.href);
  }

  async function onEditClick() {
    dispatch("editScreensaver", {
      saver
    });
  }

  async function onDeleteClick() {
    const result = await window.api.deleteSaverDialog(saver);
    if ( result === 1 ) {
      dispatch("deleteScreensaver", {
        saver
      });
    }
  }
</script>
