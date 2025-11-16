#!/usr/bin/env node

import "dotenv/config";
import * as path from "path";
import * as tmp from "tmp";
import * as fs from "fs";
import pngToIco from "png-to-ico";
import { Jimp } from "jimp";

const sizes = [256, 128, 48, 32, 16];

async function main() {
  let outputs = [];
  let pauseOutputs = [];

  const image = await Jimp.read("assets/icon.png");
  const pauseImage = await Jimp.read("assets/icon-paused.png");

  const tmpDir = tmp.dirSync().name;

  for ( let index in sizes ) {
    const size = sizes[index];
    console.log(size);

    const name = path.join(tmpDir, `icon-${size}.png`);
    await image.resize({w: size, h: size});
    await image.write(name);

    outputs.push(name);

    const pausedName = path.join(tmpDir, `icon-paused-${size}.png`);
    await pauseImage.resize({w: size, h: size});
    await pauseImage.write(pausedName);

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
