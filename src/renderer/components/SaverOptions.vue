<template>
  <div id="wrapper">
    <ul>
      <li
        v-for="(option, index) in options"
        :key="index"
      >
        <template v-if="option.type === 'boolean'">
          <boolean-input
            :key="option.name"
            :saver="saver"
            :option="option"
            :value="values[option.name]"
            :name="option.name"
            @saverOption="handleOptionUpdate"
          />
        </template>
        <template v-else>
          <option-input
            :key="option.name"
            :saver="saver"
            :option="option"
            :value="values[option.name]"
            @saverOption="handleOptionUpdate"
          />
        </template>
      </li>
    </ul>
  </div>
</template>

<script>
import OptionInput from "@/components/OptionInput";
import BooleanInput from "@/components/BooleanInput";
export default {
  name: "SaverOptions",
  components: {
    optionInput: OptionInput,
    booleanInput: BooleanInput
  },
  props: ["saver", "options", "values"],
  emits: ["saverOption"],
  methods: {
    handleOptionUpdate(saver, name, value) {
      this.$emit("saverOption", saver, name, value);
    }
  }
};
</script>
