"use strict"
import React from "react";

export default class SliderWithValue extends React.Component {
  constructor(props) {
    super(props);
    this.state = { value: this.props.value };
    this.onSliderChange = this.onSliderChange.bind(this);
  }

  onSliderChange(evt) {
    var val = evt.target.value;
    //this.value = val;
    this.setState({
      name: this.name,
      value: val
    });

    this.props.onChange({
      name: this.props.name,
      value: val
    });
  }

  render() {
    return <input type="range" defaultValue={this.props.value}
                  min={this.props.min} max={this.props.max}
                  onChange={this.onSliderChange}
                  className="slider slider-square-inverted" />
  }
}
