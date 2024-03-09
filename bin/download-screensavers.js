#!/usr/bin/env node

/* eslint-disable no-console */
import "dotenv/config";
import * as path from "path";
import * as fs from "fs";
import { rimraf } from 'rimraf'
import * as mkdirp from "mkdirp";
import { Octokit } from "octokit";

import Package from "../src/lib/package.js";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const srcRoot = path.join(__dirname, "..");
const workingDir = path.join(srcRoot, "data");

let opts = {};

const octokit = new Octokit(opts);

let owner = "muffinista";
let repo = "before-dawn-screensavers";


console.log("cleaning up working dir", workingDir);

// ensure directory exists, clean it out, then recreate just to be sure
mkdirp.sync(workingDir);
rimraf.sync(workingDir);
mkdirp.sync(workingDir);

async function main() {
  let result = await octokit.rest.repos.getLatestRelease({owner, repo});

  const tag_name = result.data.tag_name;
  const jsonFile = `${repo}-${tag_name}.json`;

  const jsonDest = path.join(srcRoot, "data", jsonFile);
  fs.writeFileSync(jsonDest, JSON.stringify(result.data));

  const url = result.data.zipball_url;
  const dest = path.join(srcRoot, "data", "savers");

  const p = new Package({
    repo: `${owner}/${repo}`,
    dest: dest,
    log: console.log
  });

  await p.downloadRelease(url, dest);
}

main().catch(e => console.error(e));

/* eslint-enable no-console */
