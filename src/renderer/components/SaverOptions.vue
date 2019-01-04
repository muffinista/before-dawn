<template>
  <div id="wrapper">
    <ul>
      <li v-for="(option, index) in options" :key="index">
        <template v-if="option.type === 'boolean'">
          <boolean-input
            v-on="$listeners"
            :saver="saver"
            :option="option"
            :value="values[option.name]"
            :name="option.name"
            :key="option.name"></boolean-input>
        </template>
        <template v-else>
          <option-input
            v-on="$listeners"
            :saver="saver"
            :option="option"
            :value="values[option.name]"
            :key="option.name"></option-input>
        </template>
      </li>
    </ul>
  </div>
</template>

<script>
import OptionInput from "@/components/OptionInput";
import BooleanInput from "@/components/BooleanInput";
export default {
  name: "saver-options",
  props: ["saver", "options", "values"],
  components: {
    optionInput: OptionInput,
    booleanInput: BooleanInput
  },
  methods: {
  }
}
</script>

<style>
</style>
