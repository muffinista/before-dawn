<template>
  <div class="saver-description">
    <h1>{{name}} <small><a :href="aboutUrl" v-on:click="open" v-if="hasUrl">learn more</a></small></h1>
    <template v-if="saver.editable">
      <div class="actions">
        <a class="btn btn-outline-secondary btn-sm edit" 
          href="#" role="button" 
          :data-name="saver.name" 
          v-on:click.stop="onEditClick(saver)">edit</a>
        <a class="btn btn-outline-secondary btn-sm" 
          href="#" role="button" 
          v-on:click.stop="onDeleteClick(saver)">delete</a>
      </div>
    </template>

    <p>{{description}}</p>
    <span v-if="hasAuthor">
      by: {{author}}
    </span>


  </div>
</template>

<script>
  const {dialog} = require("electron").remote;
  export default {
    name: "saver-summary",
    props: ["saver"],
    components: { },
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
        this.$electron.shell.openExternal(event.target.href);
      },
      onEditClick(s) {
        console.log(s);
        this.$emit("editSaver", s);
      },
      onDeleteClick(s) {
        // @todo move to main
        dialog.showMessageBox(
          {
            type: "info",
            title: "Are you sure?",
            message: "Are you sure you want to delete this screensaver?",
            detail: "Deleting screensaver " + s.name,
            buttons: ["No", "Yes"],
            defaultId: 0
          },
          (result) => {
            if ( result === 1 ) {
              this.$emit("deleteSaver", s);
            }
          }
        ); 
      }
    }
  };
</script>
