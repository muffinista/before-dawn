#!/usr/bin/env node

/* eslint-disable no-console */

require("dotenv").config();

const rimraf = require("rimraf");
const tmp = require("tmp");
const path = require("path");
const fs = require("fs");
const pngToIco = require("png-to-ico");
const jimp = require("jimp");


const sizes = [256, 128, 48, 32, 16];

async function main() {
  let outputs = [];
  let pauseOutputs = [];

  const image = await jimp.read("assets/icon.png");
  const pauseImage = await jimp.read("assets/icon-paused.png");

  const tmpDir = tmp.dirSync().name;
  rimraf.sync(tmpDir);

  for ( let index in sizes ) {
    const size = sizes[index];
    console.log(size);

    // const images = sizes.map(async (s) => {
    const name = path.join(tmpDir, `icon-${size}.png`);
    await image.resize(size, jimp.AUTO);
    await image.writeAsync(name);

    outputs.push(name);

    const pausedName = path.join(tmpDir, `icon-paused-${size}.png`);
    await pauseImage.resize(size, jimp.AUTO);
    await pauseImage.writeAsync(pausedName);

    pauseOutputs.push(pausedName);
  }

  console.log(outputs);
  const buf = await pngToIco(outputs);
  fs.writeFileSync(path.join("src", "main", "assets", "icon.ico"), buf);

  console.log(pauseOutputs);
  const buf2 = await pngToIco(pauseOutputs);
  fs.writeFileSync(path.join("src", "main", "assets", "icon-paused.ico"), buf2);
}

main().catch(e => console.error(e));
