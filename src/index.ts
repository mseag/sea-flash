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

// Content for the 3 types of flashcard pages
const ImagesHtml = new html.Html(`${lwc}_images_flashcards.htm`, lwc, html.HtmlType.IMAGE);
const NoImagesHtml = new html.Html(`${lwc}_without_images_flashcards.htm`, lwc, html.HtmlType.NO_IMAGE);
const BlankHtml = new html.Html(`${lwc}_blank_flashcards.htm`, lwc, html.HtmlType.BLANK);

// Determine range of UID indexes
let imageCards : any[] = [];
let noImageCards : any[] = [];
let blankCards: any[] = [];
const startUID = (configFile.startUID) ? configFile.startUID : 1;
const endUID = (configFile.endUID) ? configFile.endUID : 50;
const cardsPerAccordion = (configFile.cardsPerAccordion) ? configFile.cardsPerAccordion : 250;
tsv.forEach((f, index) => {
  let UID = f.uid;
  if (UID && startUID <= UID && UID <= endUID) {
    if (f.img?.path) {
      imageCards.push(
        {
          text: ImagesHtml.makeFlashcard(f, Img.defaultSize[0]),
          uid: UID
        }
      );
    } else {
      noImageCards.push(
        {
          text: NoImagesHtml.makeFlashcard(f, Img.defaultSize[0]),
          uid: UID
        }
      );
    }
  } else {
    return;
  }
});

// Generate blank flashcards
let blank : config.configType = {
  english: '<br>',
  lwc: '<br>',
  pos: config.PoS.I,
  ipa: ' '
}
blankCards.push(
  {
    text: BlankHtml.makeFlashcard(blank, Img.defaultSize[0]),
    uid: 0
  }
);
blankCards.push(
  {
    text: BlankHtml.makeFlashcard(blank, Img.defaultSize[0]),
    uid: 0
  }
);

// Write flashcards to file
//Html.writeFlashcards2x3(cards);
ImagesHtml.writeFlashcards1x2(imageCards, cardsPerAccordion);
ImagesHtml.writeHTML();

NoImagesHtml.writeFlashcards1x2(noImageCards, cardsPerAccordion);
NoImagesHtml.writeHTML();

BlankHtml.writeFlashcards1x2(blankCards, cardsPerAccordion);
BlankHtml.writeHTML();

console.log('All done processing');

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
