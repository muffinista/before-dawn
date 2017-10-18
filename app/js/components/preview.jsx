"use strict"

import React from "react";
import PropTypes from "prop-types";
const _ = require("lodash");

export default class Preview extends React.Component {
  render() {
    var s = this.props.saver;
    var url_opts = this.props.url_opts;
    var saver_opts = this.props.saver_opts;
    var mergedOpts;

    mergedOpts = _.merge(url_opts, s.settings);   
    mergedOpts = _.merge(mergedOpts, saver_opts);

    console.log("PREVIEW", mergedOpts);
    var previewUrl = s.getPreviewUrl(mergedOpts);

    return (<div><iframe scrolling='no' className='mini' src={previewUrl} /></div>);
  }
};

Preview.propTypes = {
  saver: PropTypes.object.isRequired,
  url_opts: PropTypes.object,
  saver_opts: PropTypes.object  
};
