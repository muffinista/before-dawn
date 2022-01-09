#!/usr/bin/env node

/* eslint-disable no-console */
require("dotenv").config();

const SentryCli = require("@sentry/cli");
const { Octokit } = require("@octokit/rest");
const path = require("path");
const pjson = require(path.join(__dirname, "..", "package.json"));

let opts = {
  auth: `token ${process.env.GITHUB_AUTH_TOKEN}`
};

const octokit = new Octokit(opts);

let owner = "muffinista";
let repo = "before-dawn";
let tag_name = `v${pjson.version}`;
let draft = true;
let releaseName = `${pjson.productName} ${pjson.version}`;

const sentryCli = new SentryCli(path.join(__dirname, "sentry.properties"));

async function main() {
  let release = {
    owner: owner, 
    repo: repo, 
    tag_name: tag_name, 
    target_commitish: "main",
    name: tag_name,
    body: "description",
    draft: draft
  };
  
  console.log(`checking ${owner}/${repo} for ${tag_name}`);

  let result = await octokit.repos.getLatestRelease({owner, repo});
  if ( result.data.tag_name === tag_name ) {
    console.log("release already created!");
    return;
  }

  console.log(release);
  result = await octokit.repos.createRelease(release);

  console.log(result);

  // Create a release

  console.log("Create new release on sentry");
  await sentryCli.execute(["releases", "new", releaseName], true);

  console.log("Add commits to release");
  await sentryCli.execute(["releases", "set-commits", "--auto", releaseName], true);

  console.log("Upload sourcemaps");
  await sentryCli.execute(["releases", "files", releaseName, "upload-sourcemaps", "output"], true);

  console.log("Finalize release");
  await sentryCli.execute(["releases", "finalize", releaseName], true);

  console.log("Set new deploy");
  await sentryCli.execute(["releases", "deploys", releaseName, "new", "--env", "production"], true);

  //# upload symbols
  //bin/sentry-symbols.js
}

main().catch(e => console.error(e));

/* eslint-enable no-console */
