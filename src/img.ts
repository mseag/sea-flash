import * as path from 'path';
import * as  fs from 'fs';

export interface imgType {
  uid : number; // ID number corresponding to word
  path : string;
  x : number; // Horizontal pixel size
  y : number; // Vertical pixel size
}

export const IMG_FILTER_REGEX = /(bw|c)\d{4}\.(jpg|png)/;

export class Img {
  public DEFAULT_X = 220; // pixels
  public DEFAULT_Y = 220; // pixels

  // Folder path of images
  private root: string;

  constructor(root: string) {
    this.root = root;
  }

  /** Return the full path of an image if it exists. Prefere color over black/white
   * UID: number
   * Returns string of the path or null
   */
  public getImgageName(UID: number, ) : string | null {
    let imgPaths = [
      this.root + path.sep + 'c' + UID.toString().padStart(4, '0') +  '.png',
      this.root + path.sep + 'c' + UID.toString().padStart(4, '0') +  '.jpg',
      this.root + path.sep + 'bw' + UID.toString().padStart(4, '0') +  '.png',
      this.root + path.sep + 'bw' + UID.toString().padStart(4, '0') +  '.jpg',
    ];

    let imgPath : string|null = null;
    imgPaths.forEach( p => {
      if (fs.existsSync(p)) {
        imgPath = p;
      }
    })
    return imgPath;
  }
}
