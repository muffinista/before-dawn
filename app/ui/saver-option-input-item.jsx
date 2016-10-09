'use strict';
var React = require('react');

module.exports = React.createClass({
  getInitialState: function() {
    return {
      value: this.props.option
    };
  },
  onTypeChange: function(ev) {
    var root = document.querySelector("select").parentNode.parentNode;

    if ( ev.target.value === "slider" ) {
      root.classList.add("slider");
    }
    else {
      root.classList.remove("slider");
    }

    this.handleChange(ev);
  },
  handleChange: function() {
    console.log("CHANGE", this.refs);
    var newVals = {
      "index": this.props.option.index,
      "name": this.refs.name.value,
      "type": this.refs.type.value,
      "description": this.refs.description.value,
      "min": this.refs.min.value,
      "max": this.refs.max.value,
      "default": this.refs.default.value
    };
    this.setState({
      option: newVals
    });

    this.props.onChange(this, newVals);
  },
  render: function() {
    var self = this;
    var opt = this.props.option;

    return (
      <li className={"list-group-item entry"} key={opt.name}>
        <div className="form-group">
          <input type="text" ref="name" name="name" className="form-control" initialValue={opt.name} onChange={this.handleChange} />
        </div>

        <div className="form-group">
          <input type="text" ref="description" name="description" className="form-control" initialValue={opt.description} onChange={this.handleChange} />
        </div>

        <div className="form-group">
          <select ref="type" name="type" className="form-control" initialInitialValue={opt.type} onChange={this.onTypeChange}>
            <option initialValue="slider">slider</option>
            <option initialValue="text">text</option>
          </select>
        </div>

        <span className="only-for-slider">
          <div className="form-group">
            <input ref="min" type="text" name="min" className="form-control" initialValue={opt.min} onChange={this.handleChange} />
            <input ref="max" type="text" name="max" className="form-control" initialValue={opt.max} onChange={this.handleChange} />
          </div>
        </span>


        <div className="form-group">
          <input ref="default" type="text" name="default" className="form-control" initialValue={opt.default} onChange={this.handleChange} />
        </div>

        <div className="form-actions">
          <button data-name={opt.name} className={"remove-option"} onClick={() => this.props.onDelete(this)}>x</button>
        </div>
      </li>
    );
  }
});
