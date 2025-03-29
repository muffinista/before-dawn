<div class="saver-list-wrapper">
  <h1>Screensavers</h1>
  <ul class="saver-list list-group-flush">
    {#each savers as saver (saver.key)}
      <li class="{saver.key == current ? CHECKED_CLASS : UNCHECKED_CLASS}">
        <div>
          <label>
            <div class="body">
              <input
                type="radio" 
                name="screensaver" 
                bind:group="{current}"
                data-name="{saver.name}" 
                value="{saver.key}" 
                checked="{saver.key == current}"
                onchange={onSelect}
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
  let { savers, current = $bindable(), saverPicked } = $props();

  const UNCHECKED_CLASS = "list-group-item flex-column entry";
  const CHECKED_CLASS = `${UNCHECKED_CLASS} active`;

  function onSelect(e) {
    saverPicked({
      saver: e.target.value
    });
  }
</script>
