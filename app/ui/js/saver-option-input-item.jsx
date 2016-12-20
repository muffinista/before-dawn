'use strict';

import React from 'react';

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
  handleChange() {
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
      <fieldset className={className} key={this.state.option.index}>
        <div className="form-group row">
          <label className="col-xs-2 col-form-label">Name</label>
          <div className="col-xs-10" >
            <input
                type="text"
                ref="name" name="name" className="form-control"
                placeholder="Pick a name for this option"
                value={this.state.option.name}
                onChange={this.handleChange} />
          </div>
        </div>

        <div className="form-group row">
          <label className="col-xs-2 col-form-label">Description</label>
          <div className="col-xs-10" >
            <input type="text"
                   ref="description"
                   name="description"
                   placeholder="Describe what this option does"
                   className="form-control"
                   value={this.state.option.description}
                   onChange={this.handleChange} />
          </div>
        </div>

        <div className="form-group row">
          <label className="col-xs-2 col-form-label">Type</label>
          <div className="col-xs-10" >
            <select
                ref="type" name="type" className="form-control"
                value={this.state.option.type} onChange={this.onTypeChange}>
              <option value="slider">slider</option>
              <option value="text">text</option>
            </select>
          </div>
        </div>

        <div className="form-group row">
          <span className="only-for-slider">
            <label className="col-xs-2 col-form-label">Min</label>
            <div className="col-sm-2">
              <input ref="min"
                     type="number"
                     name="min"
                     className="form-control"
                     value={this.state.option.min}
                     onChange={this.handleChange} />
            </div>

            <label className="col-xs-2 col-form-label">Max</label>
            <div className="col-sm-2">
              <input ref="max"
                     type="number"
                     name="max"
                     className="form-control"
                     value={this.state.option.max}
                     onChange={this.handleChange} />
            </div>
          </span>

          <label className="col-xs-2 col-form-label">Default</label>
          <div className={defaultClassName}>
            <input ref="default"
                   type="text"
                   name="default"
                   placeholder="Default value of this option"
                   className="form-control"
                   value={this.state.option.default}
                   onChange={this.handleChange} />
          </div>
        </div>

        <div className="form-actions">
          <button className={"btn btn-danger remove-option"} onClick={() => this.props.onDelete(this)}>Remove this Option</button>
        </div>
      </fieldset>
    );
  }

}
