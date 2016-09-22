'use strict'

var React = require('react');

module.exports = React.createClass({
  onSliderChange: function(evt) {
    var val = evt.target.value;
    this.value = val;
    this.setState({
      name: this.name,
      value: val
    });

    this.props.onChange({
      name: this.props.name,
      value: val
    });
  },
  render: function() {
    return <input type="range" defaultValue={this.props.value}
                  min={this.props.min} max={this.props.max}
                  onChange={this.onSliderChange}
                  className="slider slider-square-inverted" />
  }
});
