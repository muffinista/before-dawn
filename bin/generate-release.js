#!/usr/bin/env node

const Octokit = require("@octokit/rest");
const path = require("path");
const { exec } = require("child_process");

var pjson = require(path.join(__dirname, "..", "package.json"));

let opts = {
  auth: process.env.GITHUB_AUTH_TOKEN
};

const octokit = new Octokit(opts);

let owner = "muffinista";
let repo = "before-dawn";
let tag_name = `v${pjson.version}`;
let draft = true;

let release = {
  owner, 
  repo, 
  tag_name, 
  draft
};

// eslint-disable-next-line no-console
console.log(`checking ${owner}/${repo} for ${tag_name}`);

octokit.repos.getLatestRelease({owner, repo}).
  then((result) => {
    if ( result.data.tag_name != tag_name ) {
      octokit.repos.createRelease(release).then((result) => {
        // eslint-disable-next-line no-console
        console.log(result);

        exec("bin/create-sentry-release.sh", (err, stdout, stderr) => {
          if (err) {
            // node couldn't execute the command
            return;
          }
        
          // eslint-disable-next-line no-console
          console.log(`stdout: ${stdout}`);
          // eslint-disable-next-line no-console
          console.log(`stderr: ${stderr}`);
        });        
      });
    }
    else {
      // eslint-disable-next-line no-console
      console.log("release already created!");
    }
  });
