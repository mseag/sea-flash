# SEA Flash

Utility to generate flashcards for analysis of SE Asia languages

Outputs to HTML which can then be printed to PDF.

## Parameters

**Required**

`-c [path to config.json file] `

: This handles publishing configuration

Sample configuration file with Windows pathing:
```json
{
  "lwc" : "Burmese",
  "wordlist": "C:\\src\\sea-flash\\EFEO-CNRS-SOAS Word List.tsv",
  "images" : "C:\\src\\sea-flash\\images",

  "startUID": 1,
  "endUID": 50
}
```

`lwc` 

: Language name in the wordlist to use for LWC fields in the flashcards

`wordlist` 

: [path to SEA wordlist, which is tab-separated values]

`images` 

: [path to images folder]

Images follow the naming convention of bw (black/white) or c (color) followed by 4-digit UID number.
Can be .jpg or .png

For example: bw0001.jpg correspondsd to word of UID 1

`startUID`

: Optional start UID for generating flashcards. If not given, will be 1.

`endUID`

: Optional end UID for last flashcard. If not given, will be something like 50.

## Pre-requisite
Install the current LTS of [nodejs](https://nodejs.org/).

Compile the project with
```bash
npm run build
```

Run the project with
```bash
node dist/index.js -c "C:\\src\\path...to..\\config.json"
```
