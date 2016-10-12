'use strict';

import React from 'react';

export default class SaverOptionInputItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = { option: this.props.option };
    this.handleChange = this.handleChange.bind(this);
  }

  onTypeChange(ev) {
    var root = document.querySelector("select").parentNode.parentNode;

    if ( ev.target.value === "slider" ) {
      root.classList.add("slider");
    }
    else {
      root.classList.remove("slider");
    }

    this.handleChange(ev);
  }
  handleChange() {
    //console.log("CHANGE", this.refs);
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

    this.props.onChange(newVals);
  }
  render() {
    var self = this;
    //console.log("hey", this.state);

    var className = "list-group-item entry";
    if ( this.state.option.type === "slider" ) {
      className = className + " slider";
    }
    
    return (
      <li className={className} key={this.state.option.index}>
        <div className="form-group">
          <label>Name</label>
          <input type="text"
                 ref="name" name="name" className="form-control"
                 placeholder="Pick a name for this option"
                 value={this.state.option.name}
                 onChange={this.handleChange} />
        </div>

        <div className="form-group">
          <label>Description</label>
          <input type="text"
                 ref="description"
                 name="description"
                 placeholder="Describe what this option does"
                 className="form-control"
                 value={this.state.option.description}
                 onChange={this.handleChange} />
        </div>

        <div className="form-group">
          <label>Type</label>
          <select ref="type" name="type" className="form-control" initialInitialValue={this.state.option.type} onChange={this.onTypeChange}>
            <option value="slider">slider</option>
            <option value="text">text</option>
          </select>
        </div>

        <span className="only-for-slider">
          <div className="form-group">
            <label>Min</label>
            <input ref="min"
                   type="number"
                   name="min"
                   className="form-control"
                   value={this.state.option.min}
                   onChange={this.handleChange} />
          </div>
          <div className="form-group">
            <label>Max</label>
            <input ref="max"
                   type="number"
                   name="max"
                   className="form-control"
                   value={this.state.option.max}
                   onChange={this.handleChange} />
          </div>
        </span>


        <div className="form-group">
          <label>Default</label>
          <input ref="default"
                 type="text"
                 name="default"
                 placeholder="Default value of this option"
                 className="form-control"
                 value={this.state.option.default}
                 onChange={this.handleChange} />
        </div>

        <div className="form-actions">
          <button className={"remove-option"} onClick={() => this.props.onDelete(this)}>x</button>
        </div>
      </li>
    );
  }

//});
}
