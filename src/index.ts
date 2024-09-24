#!/usr/bin/env node
// Copyright 2024 SIL Global
import { CommanderError, program } from 'commander';
import * as config from './config.js';
import * as fs from 'fs';
import require from './cjs-require.js';

////////////////////////////////////////////////////////////////////
// Get parameters
////////////////////////////////////////////////////////////////////
program
//  .version(version, '-v, --version', 'output the current version')
  .description("Utility to generate flashcards for analyzing SE Asia languages")
    .option("-c, --config <path to config.json configuration file>", "path to config.json configuration file")
    .option("-t, --tsv <path to wordlist.tsv", "path to wordlist.tsv file")
    .option("-p, --path <path to folder of images", "path to folder of images")
    .exitOverride();
try {
  program.parse();
} catch (error: unknown) {
  if (error instanceof CommanderError) {
    console.error(error.message);
  }
  process.exit(1);
}

// Debugging parameters
const options = program.opts();
const debugMode = true;
if (debugMode) {
  console.log('Parameters:');
  if (options.config) {
    console.log(`config.json path: "${options.config}"`);
  }
  if (options.tsv) {
    console.log(`wordlist.tsv file: "${options.tsv}"`);
  }
  if (options.path) {
    console.log(`Images path: "${options.path}"`);
  }
  console.log('\n');
}

// Check if tsv/JSON files exists
if (options.config && !fs.existsSync(options.config)) {
  console.error("Can't open config.json file " + options.config);
  process.exit(1);
}
if (options.tsv && !fs.existsSync(options.tsv)) {
  console.error("Can't open wordlist.tsv " + options.tsv);
  process.exit(1);
}
if (options.path && !fs.existsSync(options.path)) {
  console.error("Can't open images folder " + options.path);
  process.exit(1);
}

// Validate required parameters given
if (!options.config || !options.tsv || !options.path) {
  console.error("Need to pass another parameters <-c> <-t> <-p>");
  process.exit(1);
}

////////////////////////////////////////////////////////////////////
// Routing commands to functions
////////////////////////////////////////////////////////////////////

const config = fs.readFileSync(options.config, 'utf-8');
const tsvText = fs.readFileSync(options.tsv, 'utf-8');
const tsv = convertTSV(tsvText, config);
process.exit(1);

let kmp = readJSON(options.json);
let keyboards = readJSON(options.keyboards);

countKeyboards(tsv, kmp, keyboards);
compareVersions(tsv, kmp);
validate(kmp, keyboards);

console.log('All done processing');

////////////////////////////////////////////////////////////////////
// Processor functions
////////////////////////////////////////////////////////////////////

function readJSON(file) {
  let obj;
  try {
    obj = require(file);
  } catch(e) {
    console.error("Invalid JSON file ${file}. Exiting");
    process.exit(1);
  }
  return obj;
}

function countKeyboards(csv, kmp, keyboards) {
  let csvCount = Object.keys(csv).length;
  let kmpCount = kmp.keyboards.length;
  let keyboardsCount = keyboards.length;

  if (csvCount != kmpCount) {
    console.error(`keyboards.csv has ${csvCount} keyboards, kmp.json has ${kmpCount} keyboards`);
  }
  if (kmpCount != keyboardsCount) {
    console.error(`kmp.json has ${kmpCount} keyboards, keyboards.json has ${keyboardsCount} keyboards`);
  }
}

function convertTSV(tsvText: any, config: any) : config.configType[] {
  let c : config.configType[] = [];
  let lines = tsvText.split('\n');
  // Discard header line
  lines = lines.splice(1);
  lines.forEach((l, index) => {
    if (l != '') {
      const s = l.split('\t');
      let unit : config.configType = {
        id: index,
        english: s[2],
        pos: s[0],
        lwc: config.lwc,
        ipa: s[1],
        img: config.img,
      }
      c[s[1]] = unit;
    }
  });

  return c;
}


/**
 * Compare keyboard versions
 * @param {any} csv - Contents of keyboards.csv
 * @param {any} kmp - Contents of kmp.json
 */
function compareVersions(csv: any, kmp: any) {
  const kmpKeyboards = kmp.keyboards;
  console.log('id\tkeyboard.csv\tkmp.json');
  kmpKeyboards.forEach(k => {
    let id = k.id;
    if (!csv[id]) {
      console.error(`keyboards.csv doesn't contain ${id}`);
    } else {
      if (k.version != csv[id].Version) {
        console.error(`${id}\t${csv[id].Version}\t${k.version}`);

        // Overwrite csv version
        csv[id].Version = k.version;
      }
    }
  });

  // Write csv to temp file
  writeModifiedCSV(csv);
}


/**
 * Write modified.csv which contains updated keyboard versions
 * @param csv Contents of updated keyboards.csv
 */

function writeModifiedCSV(csv: any) {
  // Header
  fs.writeFileSync('./modified.csv', 'Shortname,ID,Name,Region,9.0 Web Keyboard,Version,Language ID,Language Name\n', 'utf8');
  
  for(const [id, value] of Object.entries(csv)) {
    let c: any = value;
    // Write a line at a time
    let line = `${c.Shortname},${id},${c.Name},${c.Region},${c.Web_9_0_Keyboard},${c.Version},${c.LanguageID},${c.LanguageName}\n`;
    fs.appendFileSync('./modified.csv', line);
  }
}

// Checks 1-to-1 between keyboards.csv and keyboards.json
function validate(csv, keyboards) {
  csv.keyboards.forEach(c => {
    let match = keyboards.find((k) => c.id == k.id);
    if (!match) {
      console.error(`keyboards.csv has ${c.id} but keyboards.json does not`);
    }
  })
}