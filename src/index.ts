#!/usr/bin/env node
// Copyright 2024 SIL Global
import { CommanderError, program } from 'commander';
import puppeteer, { Puppeteer } from 'puppeteer';
import * as config from './config.js';
import * as html from './html.js';
import * as img from './img.js';
import * as fs from 'fs';
import * as path from 'path'
import require from './cjs-require.js';
//const __dirname = import.meta.dirname;

////////////////////////////////////////////////////////////////////
// Get parameters
////////////////////////////////////////////////////////////////////
program
//  .version(version, '-v, --version', 'output the current version')
  .description("Utility to generate flashcards for analyzing SE Asia languages")
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
const configJSON = `${process.cwd()}/config.json`;

// Check if config.json file exists
if (!fs.existsSync(configJSON)) {
  console.error(`Can't open config.json file`);
  process.exit(1);
}

////////////////////////////////////////////////////////////////////
// Routing commands to functions
////////////////////////////////////////////////////////////////////

const configFile = readJSON(configJSON);
config.validateFile(configFile);

const Img = new img.Img(configFile.images);
const lwc = configFile.lwc;
const tsvText = fs.readFileSync(configFile.wordlist, 'utf-8');
const tsv = convertTSV(lwc, tsvText);

const Html = new html.Html(`${lwc} (images) flashcards.htm`); // With images
const Html_wo = new html.Html(`${lwc} flashcards.htm`);       // Without images

// Determine range of UID indexes
let cards : string[] = [];
let cards_wo : string[] = [];
const startUID = (configFile.startUID) ? configFile.startUID : 1;
const endUID = (configFile.endUID) ? configFile.endUID : 50;
tsv.forEach((f, index) => {
  let UID = f.uid;
  if (startUID <= UID && UID <= endUID) {
    if (f.img) {
      // Cards with an image
      cards.push(Html.makeFlashcard(f, Img.defaultSize[0]));
    } else {
      // Cards without an image
      cards_wo.push(Html_wo.makeFlashcard(f, Img.defaultSize[0]));
    }
  } else {
    return;
  }
});

// Write flashcards to file
//Html.writeFlashcards2x3(cards);
console.info(Html.getFilename());
Html.writeFlashcards1x2(cards);
Html.writeHTML();
Html_wo.writeFlashcards1x2(cards_wo);
Html_wo.writeHTML();

console.log('All done processing');

await printPDF(Html_wo.getFilename());
console.log('Printed to PDF');

////////////////////////////////////////////////////////////////////
// Processor functions
////////////////////////////////////////////////////////////////////

function readJSON(file) {
  let obj;
  try {
    obj = require(file);
  } catch(e) {
    console.error(`Invalid JSON file ${file}. Exiting`);
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
  const englishColumn = 4;
  lines = lines.splice(1);
  lines.forEach((l, index) => {
    if (l != '') {
      const s = l.split('\t');
      let uid = parseInt(s[0]);
      // Sanity check entries
      if (!s[englishColumn]) {
        console.warn(`English entry not found for UID: ${uid}. Skipping...`);
        return;
      }
      let unit : config.configType = {
        uid: uid,
        pos: s[2], // TODO: fix
        english: s[englishColumn],
        lwc: s[lwcIndex],
        ipa: "{IPA here}", // TODO
      }

      let imgPath = Img.getImgageName(uid);
      if (imgPath) {
        unit.img = {
          uid: uid,
          path: imgPath,
          x: Img.defaultSize[0],
          y: Img.defaultSize[1]
        }
      }
      c[uid] = unit;
    }
  });

  return c;
}

async function printPDF(fileName: string) {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  let contentHtml = fs.readFileSync(fileName, 'utf8');
  await page.setContent(contentHtml, { waitUntil: 'domcontentloaded' });
  // let contentHtml = `"file:///${process.cwd()}/${fileName}"`
  //let contentHtml = 'file:///c:/src/sea-flash/Burmese flashcards.htm';
  //console.log(contentHtml);
  //await page.goto(contentHtml); //, {waitUntil: 'networkidle0'});
  // Reflect CSS used for screens instead of print
  await page.emulateMediaType('screen');
  const pdf = await page.pdf({
    path: 'result.pdf',
    margin: { top: '100px', right: '50px', bottom: '100px', left: '50px' },
    printBackground: true,
    format: 'A4'
  });
  await browser.close();
  return pdf
}