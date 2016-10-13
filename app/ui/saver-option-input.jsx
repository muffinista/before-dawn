'use strict';
var React = require('react');

//var SaverOptionInputItem = require('./saver-option-input-item');

import SaverOptionInputItem from './saver-option-input-item';

const _ = require('lodash');

module.exports = React.createClass({
  currentIndex: 0,
  getInitialState: function() {
    // re-map incoming options to add an index value we can
    // use to update/remove options according to user input
    var src = this.addIndexes(this.props.options, true);

    return {
      options: src
    };
  },
  indexOfOption: function(vals) {
    return _.findIndex(this.state.options, function(o) {
      return o.index == vals.index;
    });
  },
  addIndexes: function(arr, force) {
    var self = this;
    return arr.map(function(opt, i) {
      if ( force === true || typeof(opt.index) === "undefined" ) {
        opt.index = self.currentIndex;
      }
      self.currentIndex = self.currentIndex + 1;
      return opt;
    });
  },
  onDelete: function(item) {
    var newVals = item.state.value;
    var index = this.indexOfOption(newVals);

    var foo = this.state.options;
    foo.splice(index, 1);
    this.setState({
      options: foo
    });
  },
  onChanged: function(newVals) {
    var index = this.indexOfOption(newVals);
    this.state.options[index] = newVals;
    this.props.onChange(this, this.state.options);
  },
  onAddNew: function() {
    var tmp = this.state.options;
    console.log("add new", this.currentIndex);
    tmp.push(
      {
        "index": this.currentIndex,
        "name": "Option",
        "type": "slider",
        "description": "Description",
        "min": "1",
        "max": "100",
        "default": "75"
      }
    );

    this.currentIndex = this.currentIndex + 1;
    
    this.setState({
      options: tmp
    });
  },
  render: function() {
    var self = this;
    var els = this.state.options.map(function(opt, i) {
      return (<SaverOptionInputItem option={opt} onChange={self.onChanged} onDelete={self.onDelete} key={opt.index} />);
    });

    return(<div>
      {els}
      <div key={"add-new-option"}>
        <button onClick={() => this.onAddNew()}>add new option</button>
      </div>
    </div>);
  }
});
