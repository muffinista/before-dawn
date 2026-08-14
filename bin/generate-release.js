#!/usr/bin/env node

import "dotenv/config";
import { Octokit } from "octokit";
import { readFile } from 'fs/promises';

const pjson = JSON.parse(
  await readFile(
    new URL('../package.json', import.meta.url)
  )
);


let opts = {
  auth: `token ${process.env.GITHUB_AUTH_TOKEN}`
};

const octokit = new Octokit(opts);

let owner = "muffinista";
let repo = "before-dawn";
let tag_name = `v${pjson.version}`;
let draft = true;

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

  let result = await octokit.rest.repos.getLatestRelease({owner, repo});
  if ( result.data.tag_name === tag_name ) {
    console.log("release already created!");
  }
  else {
    console.log(release);

    // Create a release
    result = await octokit.rest.repos.createRelease(release);
    console.log(result);
  }

}

main().catch(e => console.error(e));
