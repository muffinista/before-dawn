'use strict'

import React from 'react';
var ReactDOM = require('react-dom');
var SliderWithValue = require('./slider-with-value');
var SaverOptionInput = require('./saver-option-input');


export default class AttributesForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { saver: this.props.saver };


    this.handleNameChange = this.handleOptionChange.bind(this);
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    this.handleAboutUrlChange = this.handleAboutUrlChange.bind(this);
    this.handleAuthorChange = this.handleAuthorChange.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
  }

  handleNameChange(event) {
    this.state.saver.name = event.target.value;
  }

  handleDescriptionChange(event) {
    this.state.saver.description = event.target.value;
  }

  handleAboutUrlChange(event) {
    this.state.saver.aboutUrl = event.target.value;
  }

  handleAuthorChange(event) {
    this.state.saver.author = event.target.value;
  }

  handleOptionChange(event, vals) {
    this.state.saver.options = vals;
  }

  render() {
    var self = this;

    var guts = React.createElement(
      'fieldset', null, 
      <div>
        <div className="form-group">
          <label htmlFor="name">Name:</label>
          <input type="text" name="name" className="form-control" value={this.state.saver.name} onChange={this.handleNameChange} />
          <div className="hint">The name of your screensaver.</div>
        </div>
        <div className="form-group">
          <label htmlFor="name">Description:</label>
          <input type="text" name="description" className="form-control" value={this.state.saver.description} onChange={this.handleDescriptionChange} />
          <div className="hint">A brief description of your screensaver.</div>
        </div>
        <div className="form-group">
          <label htmlFor="aboutUrl">About URL:</label>
          <input type="text" name="aboutUrl" className="form-control" value={this.state.saver.aboutUrl} onChange={this.handleAboutUrlChange} />
          <div className="hint">If you have a URL with more details about your work, put it here!</div>
        </div>
        <div className="form-group">
          <label htmlFor="author">Author:</label>
          <input type="text" name="author" className="form-control" value={this.state.saver.author} onChange={this.handleAuthorChange} />
          <div className="hint">The author of this screensaver.</div>
        </div>
      </div>
    );

    var opts = React.createElement(
      'fieldset', null,
      <SaverOptionInput options={this.state.saver.options} onChange={this.handleOptionChange}/>);
    
    return React.createElement('div', null, guts, opts);   
  }
}
