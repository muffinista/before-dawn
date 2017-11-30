<template>
<div>
    <iframe class="preview" :src="previewUrl" scrolling="no" />
</div>
</template>

<script>
  const _ = require('lodash');
  export default {
    name: 'saver-preview',
    props: ['screenshot', 'bus', 'saver'],
    data() {
      return {
        options: {},
        _previewUrl: ""
      }
    },
    mounted: function () {
      if ( this.bus !== undefined ) {
        this.bus.$on('options-changed', this.debounceHandleOptionsChange);
        this.bus.$on('saver-changed', this.handleSaverChange);
      }

      window.addEventListener('resize', this.debounceHandleResize);

      this.$nextTick(this.waitForIframe);
    },
    beforeDestroy: function () {
      window.removeEventListener('resize', this.debounceHandleResize);
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
        return _.debounce(this.handleResize, 200);
      },
      debounceHandleOptionsChange() {
        return _.debounce(this.handleOptionsChange, 200);
      },
      previewUrl: {
        get: function() {
          if ( this._previewUrl === undefined ) {
            this.$forceUpdate();
          }
          return this._previewUrl;
        },
        set: function(val) {
          this._previewUrl = val;
        }       
      }
     
    },
    methods: {
      waitForIframe() {
        if ( this.iframeWidth() === 0 ) {
          this.$nextTick(this.waitForIframe);
        }

        this.handleSaverChange(this.saver);
        this.$nextTick(this.handleResize);
      },
      iframeWidth() {
        if ( this.$el === undefined ) {
          return 0;
        }

        return this.$el.clientWidth - 4;
      },
      iframeHeight() {
        return this.iframeWidth() * this.aspectRatio;
      },
      urlOpts(s) {
        var base = {
          width: this.iframeWidth(),
          height: this.iframeHeight(),
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
        var iframe = this.$el.querySelector("iframe");

        iframe.style.width = this.iframeWidth() + "px";
        iframe.style.height = this.iframeHeight() + "px";

        this.handleRedraw();
      },
      handleRedraw() {
        if ( this.$el === undefined || this.saver === undefined ) {
          return;
        }
          
        var iframe = this.$el.querySelector("iframe");
        iframe.src = this._previewUrl;
      }
    },
  };
</script>

<style>
</style>
