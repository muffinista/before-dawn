"use strict"

import React from "react";
import PropTypes from "prop-types";

var ReactDOM = require("react-dom");

import SliderWithValue from "./slider-with-value";
import SaverOptionInput from "./saver-option-input";


export default class AttributesForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { saver: this.props.saver };

    if ( this.state.saver.options === null || typeof(this.state.saver.options) === "undefined" ) {
      this.state.saver.options = [];
    }
    
    this.handleNameChange = this.handleNameChange.bind(this);
    this.handleDescriptionChange = this.handleDescriptionChange.bind(this);
    this.handleAboutUrlChange = this.handleAboutUrlChange.bind(this);
    this.handleAuthorChange = this.handleAuthorChange.bind(this);
    this.handleOptionChange = this.handleOptionChange.bind(this);
  }

  handleNameChange(event) {
    this.setState({
      saver: {
        ...this.state.saver,
        name: event.target.value
      },
    });

    //this.state.saver.name = event.target.value;
    this.props.onChanged(this.state.saver);
  }

  handleDescriptionChange(event) {
    this.setState({
      saver: {
        ...this.state.saver,
        description: event.target.value
      },
    });

    //this.state.saver.description = event.target.value;
    this.props.onChanged(this.state.saver);
  }

  handleAboutUrlChange(event) {
    this.setState({
      saver: {
        ...this.state.saver,
        aboutUrl: event.target.value
      },
    });

    //this.state.saver.aboutUrl = event.target.value;
    this.props.onChanged(this.state.saver);
  }

  handleAuthorChange(event) {
    this.setState({
      saver: {
        ...this.state.saver,
        author: event.target.value
      },
    });

    //this.state.saver.author = event.target.value;
    this.props.onChanged(this.state.saver);
  }

  handleOptionChange(vals) {
    this.setState({
      saver: {
        ...this.state.saver,
        options: event.target.vals
      },
    });

    //this.state.saver.options = vals;
    this.props.onChanged(this.state.saver);
  }

  render() {
    var self = this;

    return (
      <div className="container-fluid">
        <h4>Basic Information</h4>
        <small>You can enter the basics about this screensaver here.</small>
        <form>
          <div className="form-group">
            <label htmlFor="name">Name:</label>
            <input
                type="text" name="name"
                className="form-control"
                defaultValue={this.props.saver.name} onChange={this.handleNameChange} />
            <div className="hint">The name of your screensaver.</div>
        </div>

        <div className="form-group">
          <label htmlFor="name">Description:</label>
            <input
                type="text" name="description"
                className="form-control"
                defaultValue={this.state.saver.description} onChange={this.handleDescriptionChange} />
            <div className="hint">A brief description of your screensaver.</div>
        </div>
        <div className="form-group">
          <label htmlFor="aboutUrl">About URL:</label>
            <input
                type="text"
                name="aboutUrl"
                className="form-control" defaultValue={this.state.saver.aboutUrl} onChange={this.handleAboutUrlChange} />
            <div className="hint">If you have a URL with more details about your work, put it here!</div>
        </div>
        <div className="form-group">
          <label htmlFor="author">Author:</label>
            <input
                type="text"
                name="author"
                className="form-control"
                defaultValue={this.state.saver.author} onChange={this.handleAuthorChange} />
            <div className="hint">The author of this screensaver.</div>
        </div>
        </form>

        <h4>Configurable Options</h4>
        <small>You can offer users configurable options to control your screensaver. Manage those here.</small>
        <SaverOptionInput options={this.state.saver.options} onChange={this.handleOptionChange}/>

      </div>
    );

    /* <div className="container-fluid fieldset-padding">
       <h4>Configurable Options</h4>
       <small>You can offer users configurable options to control your screensaver. Manage those here.</small>
       <SaverOptionInput options={this.state.saver.options} onChange={this.handleOptionChange}/>
        </div>
      */
  }
}

AttributesForm.propTypes = {
  saver: PropTypes.object.isRequired,
  onChanged: PropTypes.func
};
