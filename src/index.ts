#!/usr/bin/env node
// Copyright 2024 SIL Global
import { CommanderError, program } from 'commander';
import * as config from './config.js';
import * as html from './html.js';
import * as img from './img.js';
import * as fs from 'fs';
import require from './cjs-require.js';

////////////////////////////////////////////////////////////////////
// Get parameters
////////////////////////////////////////////////////////////////////
program
//  .version(version, '-v, --version', 'output the current version')
  .description("Utility to generate flashcards for analyzing SE Asia languages")
    .option("-c, --config <path to config.json configuration file>", "path to config.json configuration file")
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

// Validate required parameters given
if (!options.config) {
  console.error("Need to pass config.json file parameter <-c>");
  process.exit(1);
}

// Check if config.json file exists
if (!fs.existsSync(options.config)) {
  console.error(`Can't open config.json file: "${options.config}"`);
  process.exit(1);
}

if (debugMode) {
  console.log('Parameters:');
  console.log(`config.json path: "${options.config}"`);
  console.log('\n');
}

////////////////////////////////////////////////////////////////////
// Routing commands to functions
////////////////////////////////////////////////////////////////////

const configFile = readJSON(options.config);

// Validate config file
if (!configFile.lwc) {
  console.error(`config file missing language name for "lwc":`);
  process.exit(1);
}

if (!configFile.wordlist) {
  console.error(`config file missing wordlist tsv path "wordlist":`);
  process.exit(1);
}
if (!fs.existsSync(configFile.wordlist)) {
  console.error(`Can't open wordlist.tsv ${configFile.wordlist}`);
  process.exit(1);
}

if (!configFile.images) {
  console.error(`config file missing images path "images":`);
  process.exit(1);
}
if (!fs.existsSync(configFile.images)) {
  console.error(`Can't open images folder ${configFile.images}`);
  process.exit(1);
}

if (configFile.startUID && configFile.endUID && configFile.startUID > configFile.endUID) {
  console.error(`config file has invalid range: startUID ${configFile.startUID} > endUID ${configFile.endUID}`);
  process.exit(1);
}

const Img = new img.Img(configFile.images);
const lwc = configFile.lwc;
const tsvText = fs.readFileSync(configFile.wordlist, 'utf-8');
const tsv = convertTSV(lwc, tsvText);

const Html = new html.Html(`${lwc}-flashcards.htm`);

// Determine range of UID indexes
let cards : string[] = [];
const startUID = (configFile.startUID) ? configFile.startUID : 1;
const endUID = (configFile.endUID) ? configFile.endUID : 50;
tsv.forEach((f, index) => {
  let UID = f.uid;
  // Only printing cards that have an image
  if (startUID <= UID && UID <= endUID && f.img) {
    /*
    if (f.lwc.length > config.longGloss) {
      longCards.push(Html.makeFlashcard(f, Img.DEFAULT_X+40));
    } else {
      cards.push(Html.makeFlashcard(f, Img.DEFAULT_X+40));
    }*/
    cards.push(Html.makeFlashcard(f, Img.DEFAULT_X+40));
  } else {
    return;
  }
});

// Write flashcards to file
//Html.writeFlashcards2x3(cards);
Html.writeFlashcards1x2(cards);
//Html.writeFlashcards1x2(longCards);
Html.writeHTML();

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


function convertTSV(lwc: string, tsvText: any) : config.configType[] {
  let c : config.configType[] = [];
  let lines = tsvText.split('\n');
  let headers = lines[0].split('\t');
  let lwcIndex = headers.indexOf(lwc);
  if (lwcIndex < 0) {
    console.error(`config file has lwc ${lwc} that's not in the wordlist headers`);
    process.exit(1);
  }

  // Discard header line
  lines = lines.splice(1);
  lines.forEach((l, index) => {
    if (l != '') {
      const s = l.split('\t');
      let uid = parseInt(s[0]);
      // Sanity check entries
      if (!s[4]) {
        console.warn(`English entry not found for UID: ${s[0]}. Skipping...`);
        return;
      }
      let unit : config.configType = {
        uid: s[0],
        pos: s[2],
        english: s[4],
        lwc: s[lwcIndex],
        ipa: "{IPA here}",
      }

      let imgPath = Img.getImgageName(uid);
      if (imgPath) {
        unit.img = {
          uid: uid,
          path: imgPath,
          x: Img.DEFAULT_X,
          y: Img.DEFAULT_Y
        }
      }
      c[uid] = unit;
    }
  });

  return c;
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
