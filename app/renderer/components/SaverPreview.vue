<template>
  <div>
    <iframe class="preview" />
  </div>
</template>

<script>
  const _ = require('lodash');
  export default {
    name: 'saver-preview',
    props: ['saver', 'screenshot', 'bus'],
    data() {
      return {
        options: {}
      }
    },
    components: { },
    mounted: function () {
      this.bus.$on('options-changed', this.debounceHandleOptionsChange);
      window.addEventListener('resize', this.debounceHandleResize);
      this.handleResize();
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
        var val = this.$electron.screen !== undefined &&
            this.saver !== undefined &&
            this.$el !== undefined;

        return val;
      },
      debounceHandleResize() {
        return _.debounce(this.handleResize, 200);
      },
      debounceHandleOptionsChange() {
        return _.debounce(this.handleOptionsChange, 200);
      }
    },
    methods: {
      iframeWidth() {
        if ( this.$el === undefined ) {
          return 0;
        }

        return this.$el.clientWidth;
      },
      iframeHeight() {
        return this.iframeWidth() * this.aspectRatio;
      },
      handleOptionsChange(data) {
        this.options = data;
        this.handleRedraw();
      },
      handleResize() {
        var iframe = this.$el.querySelector("iframe");
        if ( iframe == null ) {
          return;
        }

        iframe.style.width = this.iframeWidth() + "px";
        iframe.style.height = this.iframeHeight() + "px";

        this.handleRedraw();
      },
      handleRedraw() {
        var iframe = this.$el.querySelector("iframe");
        var url_opts = {
          width: this.iframeWidth(),
          height: this.iframeHeight(),
          preview: 1,
          screenshot: this.screenshot
        };

        var mergedOpts = Object.assign({},
                                       url_opts,
                                       this.saver.settings,
                                       this.options);
        var previewUrl = this.saver.getUrl(mergedOpts);

        iframe.src = previewUrl;
      }
    },
  };
</script>

<style>
</style>
