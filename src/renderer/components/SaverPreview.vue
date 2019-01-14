<template>
  <div>
    <webview class="preview"
      v-observe-visibility="{ callback: visibilityChanged, once: true, }" />
  </div>
</template>

<script>
  const debounce = require("lodash.debounce");
  export default {
    name: "saver-preview",
    props: ["screenshot", "bus", "saver"],
    data() {
      return {
        options: {}
      }
    },
    created() {
      this.debounceHandleResize = debounce(this.handleResize, 200);
      this.debounceHandleOptionsChange = debounce(this.handleOptionsChange, 200);
    },
    async mounted() {
      if ( this.bus !== undefined ) {
        this.bus.$on("options-changed", this.debounceHandleOptionsChange);
        this.bus.$on("saver-changed", this.handleSaverChange);
      }

      window.addEventListener("resize", this.debounceHandleResize);
    },
    beforeDestroy: function () {
      window.removeEventListener("resize", this.debounceHandleResize);
    },
    computed: {
      aspectRatio() {
        var screen = this.$electron.screen;
        var size = screen.getPrimaryDisplay().bounds;
        var ratio = size.height / size.width;
        return ratio;
      },
      isLoaded() {
        return this.saver !== undefined;
      }
    },
    methods: {
      visibilityChanged(isVisible, entry) {
        if ( isVisible ) {
          // webview will have scrollbars by default and you can't
          // easily hide them
          var webview = this.$el.querySelector("webview");
          webview.addEventListener("dom-ready", () => {
            webview.insertCSS("html,body{ overflow: hidden !important; }");
          });

          this.handleSaverChange(this.saver);
          this.$nextTick(this.handleResize);
        }
      },
      webviewWidth() {
        if ( this.$el === undefined || this.$el.clientWidth <= 0 ) {
          return 0;
        }
        return this.$el.clientWidth - 4;
      },
      webviewHeight() {
        return this.webviewWidth() * this.aspectRatio;
      },
      urlOpts(s) {
        var base = {
          width: this.webviewWidth(),
          height: this.webviewHeight(),
          preview: 1,
          screenshot: this.screenshot,
          _: Math.random()
        };

        if ( typeof(s) === "undefined" ) {
          s = this.saver;
        }
        
        var mergedOpts = Object.assign(
          base,
          s.settings,
          this.options);

        return mergedOpts;
      },
      handleOptionsChange(data) {
        this.options = data;
        this.handleRedraw();
      },
      handleSaverChange(s) {
        this.handleRedraw();
      },
      handleResize() {
        var webview = this.$el.querySelector("webview");
        if ( this.webviewWidth() > 0 ) {
          console.log("resize to", this.webviewWidth(), this.webviewHeight());
          // only set the height manually! use css to set one dimension
          webview.style.height = this.webviewHeight() + "px";
          this.handleRedraw();
        }
      },
      handleRedraw() {
        if ( this.$el === undefined || this.saver === undefined ) {
          return;
        }
        let webview = this.$el.querySelector("webview");
        webview.src = this.saver.getUrl(this.urlOpts(this.saver))
      }
    },
  };
</script>

<style>
</style>
