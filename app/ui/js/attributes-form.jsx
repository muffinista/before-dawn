'use strict'

import React from 'react';
var ReactDOM = require('react-dom');

import SliderWithValue from './slider-with-value';
import SaverOptionInput from './saver-option-input';


export default class AttributesForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { saver: this.props.saver };

    if ( this.state.saver.options === null || typeof(this.state.saver.options) === 'undefined' ) {
      this.state.saver.options = [];
    }
    
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    this.handleAboutUrlChange = this.handleAboutUrlChange.bind(this);
    this.handleAuthorChange = this.handleAuthorChange.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
  }

  handleNameChange(event) {
    this.state.saver.name = event.target.value;
    this.props.onChanged(this.state.saver);
  }

  handleDescriptionChange(event) {
    this.state.saver.description = event.target.value;
    this.props.onChanged(this.state.saver);
  }

  handleAboutUrlChange(event) {
    this.state.saver.aboutUrl = event.target.value;
    this.props.onChanged(this.state.saver);
  }

  handleAuthorChange(event) {
    this.state.saver.author = event.target.value;
    this.props.onChanged(this.state.saver);
  }

  handleOptionChange(vals) {
    this.state.saver.options = vals;
    this.props.onChanged(this.state.saver);
  }

  render() {
    var self = this;

    var guts = React.createElement(
      'div', null, 
      <div className="container-fluid">
        <h4>Basic Information</h4>
        <small>You can enter the basics about this screensaver here.</small>

        <div className="form-group row">
          <label htmlFor="name" className="col-xs-2 col-form-label">Name:</label>
          <div className="col-xs-10">
            <input
                type="text" name="name" ref="name"
                className="form-control"
                defaultValue={this.props.saver.name} onChange={this.handleNameChange} />
            <div className="hint">The name of your screensaver.</div>
          </div>
        </div>

        <div className="form-group row">
          <label htmlFor="name" className="col-xs-2 col-form-label">Description:</label>
          <div className="col-xs-10">
            <input
                type="text" name="description" ref="description"
                className="form-control"
                defaultValue={this.state.saver.description} onChange={this.handleDescriptionChange} />
            <div className="hint">A brief description of your screensaver.</div>
          </div>
        </div>
        <div className="form-group row">
          <label htmlFor="aboutUrl" className="col-xs-2 col-form-label">About URL:</label>
          <div className="col-xs-10">
            <input
                type="text"
                name="aboutUrl" ref="aboutUrl"
                className="form-control" defaultValue={this.state.saver.aboutUrl} onChange={this.handleAboutUrlChange} />
            <div className="hint">If you have a URL with more details about your work, put it here!</div>
          </div>
        </div>
        <div className="form-group row">
          <label htmlFor="author" className="col-xs-2 col-form-label">Author:</label>
          <div className="col-xs-10">
            <input
                type="text"
                name="author" ref="author"
                className="form-control"
                defaultValue={this.state.saver.author} onChange={this.handleAuthorChange} />
            <div className="hint">The author of this screensaver.</div>
          </div>
        </div>

      </div>
    );

    console.log("hey", this.state.saver);
    console.log(this.state.saver.options);
    var opts = React.createElement(
      'div', null,
      <div className="container-fluid fieldset-padding">
        <h4>Configurable Options</h4>
        <small>You can offer users configurable options to control your screensaver. Manage those here.</small>
        <SaverOptionInput options={this.state.saver.options} onChange={this.handleOptionChange}/>
      </div>
    );
    
    return React.createElement('div', null, guts, opts);   
  }
}
