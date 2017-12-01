<template>
  <div id="prefs-form">
    <form v-on="$listeners">
      <fieldset>
        <div class="form-group">
          <label for="delay">Activate after</label>
          <select v-model="prefs.delay" class="form-control">
            <option value="0">never</option>
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
          <small class="form-text text-muted">
            The screensaver will activate once your computer has been idle for this amount of time.
          </small>
        </div>

        <div class="form-group">
          <label for="sleep">Disable displays after</label>
          <select v-model="prefs.sleep" class="form-control">
            <option value="0">never</option>
            <option value="1">1 minute</option>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
          <small class="form-text text-muted">
            The screensaver will stop, and the displays will
            be turned off to save energy after this amount
            of time.
          </small>
        </div>

        <div class="form-check">
          <label for="lock" class="form-check-label">
            <input type="checkbox" id="lock" class="form-check-input" v-model="prefs.lock" />
            Lock screen after running?
          </label>
          <small class="form-text text-muted">
            When the screen saver turns off, the user will need to enter their password.
          </small>
        </div>

        <div class="form-check">
          <label for="disable_on_battery" class="form-check-label">
            <input type="checkbox" id="disable_on_battery" class="form-check-input" v-model="prefs.disable_on_battery" />
            Disable when on battery?
          </label>
          <small class="form-text text-muted">
            If checked, Before Dawn won't
            activate when you're not plugged in -- your
            computer's power settings can blank the screen
            instead.
          </small>
        </div>

        <div class="form-check">
          <label for="auto_start" class="form-check-label">
            <input type="checkbox" class="form-check-input" v-model="prefs.auto_start" />
            Auto start on login?
          </label>
          <small class="form-text text-muted">
            If checked, Before Dawn will start when your computer starts.
          </small>
        </div>
        
      </fieldset>
    </form>

    <h1>Advanced Options <small>Be careful with these!</small></h1>

    <form>
      <fieldset>
        <div class="form-group">
          <label for="repo">Github Repo URL:</label>
          <div class="input-group">
            <div class="input-group-addon">github.com/</div>
            <input type="text" v-model="prefs.repo" class="form-control" placeholder="muffinista/before-dawn-screensavers" />
          </div>
          <small class="form-text text-muted">
            We will download releases from this repository instead of the default repo if specified.
          </small>
        </div>

        <div class="form-group">
          <label for="localSource">Local Source:</label>
          <div class="input-group">
            <input type="text" v-model="prefs.localSource" class="form-control" />
            <span class="input-group-btn">
              <button type="button" class="btn btn-secondary pick" @click.stop="showPathChooser">...</button>
            </span>
          </div>

          <small class="form-text text-muted">
            We will load screensavers from any directories listed here. Use this to add your own screensavers!
          </small>
        </div>
        
      </fieldset>
    </form>
  </div>
</template>

<script>
const {dialog} = require("electron").remote;
export default {
  name: 'prefs-form',
  components: {},
  props: ['prefs'],
  methods: {
    showPathChooser() {
      dialog.showOpenDialog(
        {
          properties: [ "openDirectory", "createDirectory" ]
        },
        this.handlePathChoice );
    },
    handlePathChoice(result) {
      if ( result !== undefined ) {
        this.prefs.localSource = result[0];
      }
    }
  }
};
</script>

<style>
</style>
