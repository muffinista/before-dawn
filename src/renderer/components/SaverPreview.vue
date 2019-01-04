<template>
  <div>
    <webview class="preview" :src="previewUrl" />
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
        myUrl: ""
      }
    },
    mounted: function () {
      if ( this.bus !== undefined ) {
        this.bus.$on("options-changed", this.debounceHandleOptionsChange);
        this.bus.$on("saver-changed", this.handleSaverChange);
      }

      window.addEventListener("resize", this.debounceHandleResize);

      this.$nextTick(this.waitForWebview);
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
      },
      debounceHandleResize() {
        return debounce(this.handleResize, 200);
      },
      debounceHandleOptionsChange() {
        return debounce(this.handleOptionsChange, 200);
      },
      previewUrl: {
        get: function() {
          if ( this.myUrl === undefined ) {
            this.$forceUpdate();
          }
          return this.myUrl;
        },
        set: function(val) {
          this.myUrl = val;
        }       
      }
     
    },
    methods: {
      waitForWebview() {
        var webview;
        if ( this.webviewWidth() === 0 ) {
          this.$nextTick(this.waitForWebview);
        }

        // webview will have scrollbars by default and you can't
        // easily hide them
        webview = this.$el.querySelector("webview");
        webview.addEventListener("dom-ready", () => {
          webview.insertCSS("html,body{ overflow: hidden !important; }");
        });

        this.handleSaverChange(this.saver);
        this.$nextTick(this.handleResize);
      },
      webviewWidth() {
        if ( this.$el === undefined ) {
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
          screenshot: this.screenshot
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
        this.previewUrl = this.saver.getUrl(this.urlOpts(this.saver));
        this.handleRedraw();
      },
      handleSaverChange(s) {
        this.previewUrl = s.getUrl(this.urlOpts(s));
        this.handleRedraw();
      },
      handleResize() {
        var webview = this.$el.querySelector("webview");

        webview.style.width = this.webviewWidth() + "px";
        webview.style.height = this.webviewHeight() + "px";

        this.handleRedraw();
      },
      handleRedraw() {
        if ( this.$el === undefined || this.saver === undefined ) {
          return;
        }

        let webview = this.$el.querySelector("webview");
        webview.src = this.myUrl;
      }
    },
  };
</script>

<style>
</style>
