"use strict";

import React from "react";
import PropTypes from "prop-types";

export default class SaverOptionInputItem extends React.Component {
  constructor(props) {
    super(props);
    this.state = { option: this.props.option };
    this.handleChange = this.handleChange.bind(this);
    this.onTypeChange = this.onTypeChange.bind(this);    

    this.smallDefaultClass = "col-sm-2";
    this.largeDefaultClass = "col-sm-10";
  }

  onTypeChange(ev) {
    var root = document.querySelector("select").parentNode.parentNode;
    var defaultValue = document.querySelector(".default-value");
    
    if ( ev.target.value === "slider" ) {
      root.classList.add("slider");
      defaultValue.classList.remove(this.largeDefaultClass);
      defaultValue.classList.add(this.smallDefaultClass);      
    }
    else {
      root.classList.remove("slider");
      defaultValue.classList.add(this.largeDefaultClass);
      defaultValue.classList.remove(this.smallDefaultClass);      
    }

    this.handleChange(ev);
  }

  handleChange(evt) {
    var key = evt.target.name;
    var val = evt.target.value;
    var diff = this.state.option;
    diff[key] = val;
    
    this.props.onChange(diff);
  }

  render() {
    var className = "list-group-item entry";
    var defaultClassName = "";
    
    if ( this.state.option.type === "slider" ) {
      className = className + " slider";
      defaultClassName = "default-value col-sm-2";
    }
    else {
      defaultClassName = "default-value col-sm-10";
    }
    
    return (
      <fieldset className={className} key={this.props.option.index}>
        <div className="form-group row">
          <label className="col-sm-2 col-form-label">Name</label>
          <div className="col-sm-10" >
            <input type="text"
                   name="name" className="form-control"
                   placeholder="Pick a name for this option"
                   value={this.props.option.name}
                   onChange={this.handleChange} />
          </div>
        </div>

        <div className="form-group row">
          <label className="col-sm-2 col-form-label">Description</label>
          <div className="col-sm-10" >
            <input type="text"
                   name="description"
                   placeholder="Describe what this option does"
                   className="form-control"
                   value={this.props.option.description}
                   onChange={this.handleChange} />
          </div>
        </div>

        <div className="form-group row">
          <label className="col-sm-2 col-form-label">Type</label>
          <div className="col-sm-10" >
            <select
                name="type" className="form-control"
                value={this.props.option.type} onChange={this.onTypeChange}>
              <option value="slider">slider</option>
              <option value="text">text</option>
            </select>
          </div>
        </div>

        <div className="form-group row">
          <label className="col-sm-2 col-form-label only-for-slider">Min</label>
          <div className="col-sm-2 only-for-slider">
            <input type="number"
                   name="min"
                   className="form-control"
                   value={this.props.option.min}
                   onChange={this.handleChange} />
          </div>

          <label className="col-sm-2 col-form-label only-for-slider">Max</label>
          <div className="col-sm-2 only-for-slider">
            <input type="number"
                   name="max"
                   className="form-control"
                   value={this.props.option.max}
                   onChange={this.handleChange} />
          </div>

          <label className="col-sm-2 col-form-label">Default</label>
          <div className={defaultClassName}>
            <input type="text"
                   name="default"
                   placeholder="Default value of this option"
                   className="form-control"
                   value={this.props.option.default}
                   onChange={this.handleChange} />
          </div>
        </div>

        <div className="form-actions">
          <button type="button"
                  className={"btn btn-danger remove-option"}
                  onClick={() => this.props.onDelete(this)}>Remove this Option</button>
        </div>
      </fieldset>
    );
  }
}

SaverOptionInputItem.propTypes = {
  option: PropTypes.object,
  onChange: PropTypes.func,
  onDelete: PropTypes.func
};
