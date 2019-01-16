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
        options: {},
        webview: undefined
      }
    },
    created() {
      this.debounceHandleResize = debounce(this.handleResize, 200);
      this.debounceHandleOptionsChange = debounce(this.handleOptionsChange, 200);
    },
    async mounted() {
      this.webview = this.$el.querySelector("webview");
      this.webview.addEventListener('dom-ready', () => {
        this.webview.insertCSS("html,body{ overflow: hidden !important; }");
        this.webview.zoomable = true;
        this.setZoom();
      }, {once: true});

      if ( this.bus !== undefined ) {
        this.bus.$on("options-changed", this.debounceHandleOptionsChange);
        this.bus.$on("saver-changed", this.handleSaverChange);
      }

      window.addEventListener("resize", this.debounceHandleResize);
    },
    beforeDestroy: function () {
      //console.log("soon i will be dead");
      this.webview.zoomable = false;
      window.removeEventListener("resize", this.debounceHandleResize);
    },
    destroyed() {
      //console.log("i am dead!");
    },
    computed: {
      aspectRatio() {
        var screen = this.$electron.screen;
        var size = screen.getPrimaryDisplay().bounds;
        var ratio = size.height / size.width;
        return ratio;
      },
      screenWidth() {
        var screen = this.$electron.screen;
        var size = screen.getPrimaryDisplay().bounds;
        return size.width;
      },
      isLoaded() {
        return this.saver !== undefined;
      }
    },
    methods: {
      webviewWidth() {
        if ( this.$el === undefined || this.$el.clientWidth <= 0 ) {
          return 0;
        }
        return this.$el.clientWidth;
      },
      webviewHeight() {
        return this.webviewWidth() * this.aspectRatio;
      },
      webviewZoomLevel() {
        return this.webviewWidth() / this.screenWidth;
      },
      urlOpts(s) {
        var base = {
          width: this.screenWidth,
          height: this.screenWidth * this.aspectRatio,
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
        var webview = this.webview; //this.$el.querySelector("webview");
        if ( this.webviewWidth() > 0 ) {
          // only set the height manually! use css to set one dimension
          webview.style.height = this.webviewHeight() + "px";
          this.handleRedraw();
        }
      },
      handleRedraw() {
        if ( this.$el === undefined || this.saver === undefined ) {
          return;
        }

        let self = this;
        let webview = this.webview; //this.$el.querySelector("webview");
        // webview.loadURL(this.saver.getUrl(this.urlOpts(this.saver)));
        webview.src = this.saver.getUrl(this.urlOpts(this.saver));

        webview.addEventListener("dom-ready", () => {
          self.webview.insertCSS("html,body{ overflow: hidden !important; }");
          self.setZoom();
        }, { once: true });
      },
      setZoom() {
        let webview = this.webview; //this.$el.querySelector("webview");
        if ( webview.zoomable ) {
          webview.setZoomFactor(this.webviewZoomLevel());
        }
      },
      visibilityChanged(isVisible, entry) {
        if ( isVisible ) {
          this.handleSaverChange(this.saver);
          this.$nextTick(this.handleResize);
        }
      }
    },
  };
</script>

<style>
</style>
