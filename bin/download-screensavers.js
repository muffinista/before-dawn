#!/usr/bin/env node

/* eslint-disable no-console */
require("dotenv").config();

const Package = require("../src/lib/package.js");
const Octokit = require("@octokit/rest");
const path = require("path");
const fs = require("fs");

const srcRoot = path.join(__dirname, "..");
const pjsonPath = path.join(srcRoot, "package.json");
const pjson = require(pjsonPath);

let opts = {
  auth: `token ${process.env.GITHUB_AUTH_TOKEN}`
};

const octokit = new Octokit(opts);

let owner = "muffinista";
let repo = "before-dawn-screensavers";

async function main() {
  let result = await octokit.repos.getLatestRelease({owner, repo});

//  console.log(result.data);
  const tag_name = result.data.tag_name;
  const jsonFile = `${repo}-${tag_name}.json`;

  const jsonDest = path.join(srcRoot, "data", jsonFile);
  fs.writeFileSync(jsonDest, JSON.stringify(result.data));

  const url = result.data.zipball_url;
  const zipFile = `${repo}-${tag_name}.zip`;
  const dest = path.join(srcRoot, "data", zipFile);

  const p = new Package({
    repo: `${owner}/${repo}`,
    dest: dest
  });

  await p.downloadFile(url, dest);

  pjson.resources.savers = zipFile;
  pjson.resources.data = jsonFile;
  fs.writeFileSync(pjsonPath, JSON.stringify(pjson, null, 2));
}

main().catch(e => console.error(e));

/* eslint-enable no-console */
