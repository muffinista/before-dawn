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
      this.bus.$on('options-changed', this.debounceHandleOptionsChange);
      this.bus.$on('saver-changed', this.handleSaverChange);      

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
            console.log("hey", this.saver, this.urlOpts(this.saver));
            this.$forceUpdate();
          }
          return this._previewUrl;
        },
        set: function(val) {
          console.log("SET TO", val);
          this._previewUrl = val;
        }       
      }
     
    },
    methods: {
      waitForIframe() {
        if ( this.iframeWidth() === 0 ) {
          this.$nextTick(this.waitForIframe);
        }

        console.log(this.aspectRatio);
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
        this.handleRedraw();
      },
      handleSaverChange(s) {
        //this.saver = s;
        //console.log("CHANGE", s);
        this.previewUrl = s.getUrl(this.urlOpts(s));
        //console.log("hi!!!", this.previewUrl);
        this.handleRedraw();
      },
      handleResize() {
        var iframe = this.$el.querySelector("iframe");

        //        console.log("handle resize", this.$el, iframe, this.saver.getUrl(this.urlOpts()));
        
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
