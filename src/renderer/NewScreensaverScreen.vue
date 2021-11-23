<template>
  <div id="new">
    <div class="content">
      <div
        :key="renderIndex"
        class="container-fluid"
      >
        <h1>New Screensaver</h1>
        <template v-if="!canAdd">
          <div class="need-setup-message">
            <p>
              Screensavers in Before Dawn are web pages, so if you can use HTML, 
              CSS, and/or Javascript, you can make your own screensaver. But before 
              you can do that, you'll need to set a local directory!
            </p>
            <div class="form-group">
              <label for="localSource">Local Source:</label>
              <template v-if="prefs !== undefined">
                <local-folder-input
                  :value="prefs.localSource"
                  handler="localSourceChange"
                  name="localSource"
                  @localSourceChange="localSourceChange"
                />
              </template>

              <small class="form-text text-muted">
                We will load screensavers from any directories listed here. Use this to add your own screensavers!
              </small>
            </div>
          </div>
        </template>  

        <template v-if="canAdd">
          <p>
            Screensavers in Before Dawn are web pages, so if you can use HTML, 
            CSS, and/or Javascript, you can make your own screensaver.
          </p>

          <p>
            Use this form to create a new screensaver. A template will be
            added to the system that you can fill in with your code.
          </p>
          <saver-form
            :name="saver.name"
            :description="saver.description"
            :author="saver.author"
            :about-url="saver.aboutUrl"
            :screen="saver.requirements.screen"
            @update="updateSaverAttr"
          />
        </template>
      </div>
    </div>
    <footer class="footer d-flex justify-content-between">
      <div>
        <button
          class="btn btn-large btn-secondary cancel"
          @click="closeWindow"
        >
          Cancel
        </button>
        <button
          class="btn btn-large btn-primary save"
          :disabled="disabled || !canAdd"
          @click="saveData"
        >
          Save
        </button>
      </div>
    </footer>
  </div> <!-- #new -->
</template>

<script>
import SaverForm from "@/components/SaverForm";
import LocalFolderInput from "@/components/LocalFolderInput";

export default {
  name: "NewScreensaverScreen",
  components: {
    SaverForm,
    LocalFolderInput
  },
  data() {
    return {
      saver: {
        requirements: ["screen"]
      },
      disabled: false,
      prefs: undefined,
      renderIndex: 0
    };
  },
  computed: {
    params: function() {
      // parse incoming URL params -- we'll get a link 
      // to the current screen images for previews here
      return new URLSearchParams(document.location.search);
    },
    canAdd: function() {
      return this.prefs !== undefined &&
        this.prefs.localSource !== undefined &&
        this.prefs.localSource !== "";
    }
  },
  async mounted() {
    this.prefs = await window.api.getPrefs();
    this.screenshot = await window.api.getScreenshot();
  },
  methods: {
    closeWindow() {
      window.api.closeWindow("addNew");
    },
    localSourceChange(ls) {
      var tmp = {
        localSource: ls
      };
      this.prefs = Object.assign(this.prefs, tmp);
      this.renderIndex += 1;
      this.disabled = false;

      window.api.updateLocalSource(ls);
    },
    updateSaverAttr(key, value) {
      var tmp = {
      };
      tmp[key] = value;
      if ( key === "screen" ) {
        tmp = {
          requirements: tmp
        };
      }
      this.saver = Object.assign(this.saver, tmp);
    },
    async saveData() {
      if ( document.querySelectorAll(":invalid").length > 0 ) {
        var form = document.querySelector("form");
        form.classList.add("submit-attempt");

        return;
      }

      this.disabled = true;
      // https://forum.vuejs.org/t/how-to-clone-property-value-as-simple-object/40032/2
      const clone = JSON.parse(JSON.stringify(this.saver));

      const data = await window.api.createScreensaver(clone);

      window.api.saversUpdated();

      window.api.openWindow("editor", {
        src: data.dest,
        screenshot: this.screenshot
      });
      window.api.closeWindow("addNew");
    }
  },
};
</script>
