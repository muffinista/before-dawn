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
            :option="option"
            :value="values[option.name]"
            :name="option.name"
            @saverOption="handleOptionUpdate"
          />
        </template>
        <template v-else>
          <option-input
            :key="option.name"
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
  props: {
    options: {
      type: Object,
      required: true,
      default: function() { return {}; }
    },
    values: {
      type: Object,
      required: true,
      default: function() { return {}; }
    }
  },
  emits: ["saverOption"],
  methods: {
    handleOptionUpdate(name, value) {
      this.$emit("saverOption", name, value);
    }
  }
};
</script>
