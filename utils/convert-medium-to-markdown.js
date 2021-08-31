#!/usr/bin/env node

const convert = require("medium-to-markdown");

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Provide a valid Medium URL as the first argument");
  process.exit(1);
}

const url = args[0];

convert
  .convertFromUrl(url)
  .then(result => console.log(result))
  .catch(err => console.error(err));
