//import { fileURLToPath } from 'url'
import { resolve, join } from 'path';

import { defineConfig } from 'electron-vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { viteStaticCopy } from 'vite-plugin-static-copy'

/**
* @type {import('electron-vite').UserConfig}
*/
export default defineConfig({
  main: {
    build: {
      rollupOptions: {
        output: {
          format: 'es'
        }
      }
    }
  },
  preload: {
    build: {
      rollupOptions: {
        input: {
          shim:  resolve(__dirname, 'src/preload/shim.js'),
          grabber:  resolve(__dirname, 'src/preload/grabber.mjs'),
          preload:  resolve(__dirname, 'src/preload/preload.mjs'),
        },
      },
      isolatedEntries: true,
      externalizeDeps: false
    }
  },
  renderer: {
    build: {
      rollupOptions: {
        input: {
          grabber: resolve(__dirname, "src/renderer/grabber.html"),
          shim: resolve(__dirname, "src/renderer/shim.html"),
          prefs: resolve(__dirname, "src/renderer/prefs.html"),
          about: resolve(__dirname, "src/renderer/about.html"),
          new: resolve(__dirname, "src/renderer/new.html"),
          settings: resolve(__dirname, "src/renderer/settings.html"),
          editor: resolve(__dirname, "src/renderer/editor.html"),
        }
      },
      isolatedEntries: true
    },
    plugins: [
      svelte(),
      viteStaticCopy({
        targets: [
          {
            src: resolve("src/main/system-savers"),
            dest: "../",
            rename: { stripBase: 1 }
          },
        ],
      }),    
    ],
    resolve: {
      alias: {
        "@": join(__dirname, "src", "renderer"),
        "~": join(__dirname, "src")
  
      //   '@app': resolve(__dirname, 'src'),
      //   '@components': resolve(__dirname, 'src/components'),
      //   '@selectors': resolve(__dirname, 'src/selectors'),
      //   '@hooks': resolve(__dirname, 'src/hooks'),
      //   '@modules': resolve(__dirname, 'src/ducks/modules'),
      //   '@utils': resolve(__dirname, 'src/utils'),
      },
    },
  }
});