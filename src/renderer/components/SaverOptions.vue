<template>
  <div id="wrapper">
    <ul>
      <option-input
         v-for="option in options"
         v-on="$listeners"
         :saver="saver"
         :option="option"
         :value="values[option.name]"
         :key="option.name"></option-input>
    </ul>
  </div>
</template>

<script>
import OptionInput from '@/components/OptionInput';
export default {
  name: 'saver-options',
  props: ['saver', 'options', 'values'],
  components: {optionInput: OptionInput},
  methods: {
  }
}


  
</script>

<style>
</style>
