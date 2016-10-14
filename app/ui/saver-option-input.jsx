'use strict';

import React from 'react';
import SaverOptionInputItem from './saver-option-input-item';

const _ = require('lodash');

export default class SaverOptionInput extends React.Component {
  constructor(props) {
    super(props);

    this.currentIndex = 0;
    this.state = { options: this.addIndexes(props.options, true) };

    
    this.onChanged = this.onChanged.bind(this);
  }

  indexOfOption(vals) {
    return _.findIndex(this.state.options, function(o) {
      return o.index == vals.index;
    });
  }

  addIndexes(arr, force) {
    var self = this;
    return arr.map(function(opt, i) {
      if ( force === true || typeof(opt.index) === "undefined" ) {
        opt.index = self.currentIndex;
      }
      self.currentIndex = self.currentIndex + 1;
      return opt;
    });
  }

  onDelete(item) {
    var newVals = item.state.value;
    var index = this.indexOfOption(newVals);

    var foo = this.state.options;
    foo.splice(index, 1);
    this.setState({
      options: foo
    });
  }

  onChanged(newVals) {
    var index = this.indexOfOption(newVals);

    this.state.options[index] = newVals;
    this.props.onChange(this.state.options);
  }

  onAddNew() {
    var tmp = _.cloneDeep(this.state.options);

    var newOpt = {
      "index": this.currentIndex,
      "name": "New Option",
      "type": "slider",
      "description": "Description",
      "min": "1",
      "max": "100",
      "default": "75"
    };

    tmp.push(newOpt);
    this.currentIndex = this.currentIndex + 1;
       
    this.setState({
      options: tmp
    });

    this.props.onChange(tmp);
  }

  render() {
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
}
