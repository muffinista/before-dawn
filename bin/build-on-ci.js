#!/usr/bin/env node

/* eslint-disable no-console */

require("dotenv").config();
const fetch = require("node-fetch");

const apiUrl = "https://ci.appveyor.com/api/account/muffinista/builds";
const travisApiUrl = "https://api.travis-ci.org/repo/muffinista%2Fbefore-dawn/requests";


const body = {
  "accountName": "muffinista",
  "projectSlug": "before-dawn",
  "branch": "master"
};

const appveyorOpts = {
  method: "post",
  body:    JSON.stringify(body),
  headers: { 
    "Content-type": "application/json",
    "Authorization": `Bearer ${process.env.APPVEYOR_TOKEN}`
  },
};

const travisBody = {
  "request": {
    "branch": "master"
  }
};
const travisOpts = {
  method: "post",
  body: JSON.stringify(travisBody),
  headers: {
    "Content-type": "application/json",
    "Accept": "application/json",
    "Authorization": `token ${process.env.TRAVIS_TOKEN}`,
    "Travis-API-Version": "3"
  }
};
  

fetch(apiUrl, appveyorOpts)
    .then(res => res.json())
    .then(json => console.log(json))
    .then(() => {
      fetch(travisApiUrl, travisOpts)
      .then(res => res.json())
      .then(json => console.log(json));
    });