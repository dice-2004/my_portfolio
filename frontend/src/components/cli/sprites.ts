// CLI パネル左上のドット絵。絵のデータは sprites.json にあり、ページを開くたびにランダムで 1 つ選ぶ。
// 新しい案は sprites.json に 1 件足すだけでよい。frames の各行は 1 文字 = 1 ドットで、"." は透明、
// それ以外の文字は palette の色。frames が複数あると、AI が考え中のあいだ順に切り替わる。
// 候補から外したものは sprites-unused.json に置いてある（どこからも読み込んでいない）。
// JSON は import しているのでビルド時に取り込まれ、ブラウザからの通信は増えない。
import data from "./sprites.json";

export interface Sprite {
  id: string;
  /** 何を描いたか（メモ用） */
  note: string;
  palette: Record<string, string>;
  frames: string[][];
}

export const SPRITES: Sprite[] = data;
