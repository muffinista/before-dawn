'use strict';
var React = require('react');
var SaverOptionInputItem = require('./saver-option-input-item');
//var update = require('react-addons-update');

const _ = require('lodash');

module.exports = React.createClass({
  currentIndex: 0,
  getInitialState: function() {
    // re-map incoming options to add an index value we can
    // use to update/remove options according to user input
    var src = this.props.options.map(function(opt, i) {
      if ( typeof(opt.index) === "undefined" ) {
        opt.index = self.currentIndex;
        self.currentIndex = self.currentIndex + 1;
      }
      return opt;
    });

    return {
      options: src
    };
  },
  indexOfOption: function(vals) {
    return _.findIndex(this.state.options, function(o) {
      console.log(o.index, "vs", vals.index);
      return o.index == vals.index;
    });
  },
  onDelete: function(item) {
    var newVals = item.state.value;
    var index = this.indexOfOption(newVals);

    var foo = this.state.options;
    foo.splice(index, 1);
    this.setState({
      options: foo //update(this.state.options, {$splice: [[index, 1]]})
    });
  },
  onChanged: function(item) {
    var newVals = item.state.value;
    var index = this.indexOfOption(newVals);
    this.state.options[index] = newVals;   
  },
  onAddNew: function() {
    console.log("add new!");
    var tmp = this.state.options;
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
      if ( typeof(opt.index) === "undefined" ) {
        opt.index = self.currentIndex;
        self.currentIndex = self.currentIndex + 1;
      }

      return (<SaverOptionInputItem option={opt} onChange={self.onChanged} onDelete={self.onDelete} key={opt.index} />);
    });

    return(<ul className={"list-group"}>
      {els}
      <li key={"add-new-option"}>
        <button onClick={() => this.onAddNew()}>add new option</button>
      </li>
    </ul>);
  }
});
