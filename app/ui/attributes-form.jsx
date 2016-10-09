'use strict'

var React = require('react');
var ReactDOM = require('react-dom');
var SliderWithValue = require('./slider-with-value');
var SaverOptionInput = require('./saver-option-input');

module.exports = React.createClass({
  handleNameChange: function(event) {
    //this.setState({value: event.target.value});
  },
  handleDescriptionChange: function(event) {
    //this.setState({value: event.target.value});
  },
  handleAboutUrlChange: function(event) {
    //this.setState({value: event.target.value});
  },
  handleAuthorChange: function(event) {
    //this.setState({value: event.target.value});
  },
  render: function() {
    var self = this;
    var s = this.props.saver;

    var guts = React.createElement('fieldset', null, 
                                   <div>
                                     <div className="form-group">
                                       <label htmlFor="name">Name:</label>
                                       <input type="text" name="name" className="form-control" value={s.name} onChange={this.handleNameChange} />
                                       <div className="hint">The name of your screensaver.</div>
                                     </div>
                                     <div className="form-group">
                                       <label htmlFor="name">Description:</label>
                                       <input type="text" name="description" className="form-control" value={s.description} onChange={this.handleDescriptionChange} />
                                       <div className="hint">A brief description of your screensaver.</div>
                                     </div>
                                     <div className="form-group">
                                       <label htmlFor="aboutUrl">About URL:</label>
                                       <input type="text" name="aboutUrl" className="form-control" value={s.aboutUrl} onChange={this.handleAboutUrlChange} />
                                       <div className="hint">If you have a URL with more details about your work, put it here!</div>
                                     </div>
                                     <div className="form-group">
                                       <label htmlFor="author">Author:</label>
                                       <input type="text" name="author" className="form-control" value={s.author} onChange={this.handleAuthorChange} />
                                       <div className="hint">The author of this screensaver.</div>
                                     </div>
                                   </div>
    );

    var opts = React.createElement('fieldset', null, <SaverOptionInput options={s.options} />);
    
    return React.createElement('div', null, guts, opts);
    
  }
});
