"use strict";

import React from "react";
import PropTypes from "prop-types";
import SaverOptionInputItem from "./saver-option-input-item";

const _ = require("lodash");

export default class SaverOptionInput extends React.Component {
  constructor(props) {
    super(props);
    if ( typeof(props.options) === "undefined" ) {
      props.options = [];
    }

    console.log("HELLO PROPS", props);
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
    var newVals = item.state.option;
    var index = this.indexOfOption(newVals);

    var foo = this.state.options;
    foo.splice(index, 1);

    this.setState({
      options: foo
    });

    var tmp = _.cloneDeep(this.state.options);
    this.props.onDelete(index, tmp);
  }

  onChanged(newVals) {
    var index = this.indexOfOption(newVals);
    var pre = this.state.options;
    pre[index] = newVals;

    this.setState({options: pre});

    console.log("updated options", this.state.options);
    //this.state.options[index] = newVals;
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

    console.log("addNew", tmp);
    this.props.onChange(tmp);
  }

  render() {
    var self = this;
    console.log("RENDER INPUT", this.state.options);
    var els = this.state.options.map((opt, i) => {
      console.log(opt, i);
      return (<SaverOptionInputItem option={opt}
                                    onChange={self.onChanged}
                                    onDelete={(x) => self.onDelete(x)}
                                    key={opt.index} />);
    });

    return(
      <form>
        <div>
          {els}
          <fieldset>
            <button type="button" onClick={() => this.onAddNew()} className="btn btn-default">Add New Option</button>
          </fieldset>
        </div>
      </form>);
  }
}

SaverOptionInput.propTypes = {
  options: PropTypes.array,
  onChange: PropTypes.func,
  onDelete: PropTypes.func
};
