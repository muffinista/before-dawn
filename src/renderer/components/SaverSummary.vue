<template>
  <div class="saver-description">
    <h1>
      {{ name }} <small><a
        v-if="hasUrl"
        :href="aboutUrl"
        @click="open"
      >learn more</a></small>
    </h1>
    <template v-if="saver.editable">
      <div class="actions">
        <button
          class="btn btn-outline-secondary btn-sm edit" 
          href="#"
          role="button" 
          :data-name="saver.name" 
          @click.stop="onEditClick(saver)"
        >
          edit
        </button>
        <button
          class="btn btn-outline-secondary btn-sm" 
          href="#"
          role="button" 
          @click.stop="onDeleteClick(saver)"
        >
          delete
        </button>
      </div>
    </template>

    <p>{{ description }}</p>
    <span v-if="hasAuthor">
      by: {{ author }}
    </span>
  </div>
</template>

<script>
const ipcRenderer = window.ipcRenderer;

export default {
  name: "SaverSummary",
  components: { },
  props: {
    saver: {
      type: Object,
      required: true
    }
  },
  computed: {
    name() {
      return this.saver.name;
    },
    aboutUrl() {
      return this.saver.aboutUrl;
    },
    hasUrl() {
      return this.saver.aboutUrl !== undefined &&
        this.saver.aboutUrl !== "";
    },
    description() {
      return this.saver.description;
    },
    author() {
      return this.saver.author;
    },
    hasAuthor() {
      return this.saver.author !== undefined &&
        this.saver.author !== "";
    }
  },
  methods: {
    open(evt) {
      evt.preventDefault();
      ipcRenderer.send("launch-url", event.target.href);
    },
    onEditClick(s) {
      this.$emit("editSaver", s);
    },
    async onDeleteClick(s) {
      const result = await window.api.deleteSaverDialog(s);
      if ( result === 1 ) {
        this.$emit("deleteSaver", s);
      }
    }
  }
};
</script>
