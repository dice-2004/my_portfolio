// CLI パネル左上のドット絵。ページを開くたびに SPRITES からランダムに 1 つ選ぶ。
// 新しい案はここに足すだけでよい。frames の各行は 1 文字 = 1 ドットで、"." は透明、
// それ以外の文字は palette の色。frames が複数あると、AI が考え中のあいだ順に切り替わる。

export interface Sprite {
  id: string;
  /** 何を描いたか（メモ用） */
  note: string;
  palette: Record<string, string>;
  frames: string[][];
}

export const SPRITES: Sprite[] = [
  {
    id: "ninja",
    note: "Kawasaki Ninja 400（dice の愛車）。考え中はホイールが回る",
    palette: { T: "#4b524e", g: "#8fd43a", k: "#202422", K: "#3a403c", s: "#7d8580", w: "#d5dbd7", r: "#e0453c", c: "#a9cfdc", y: "#fff4b8" },
    frames: [
      [
        ".........................c.K..",
        "........................cc.K..",
        ".............gggg......ccgg...",
        "KK..........gggggg...gggggg...",
        ".gkkkkkk...gggggggggKKKKggg...",
        "..ggkkkkkkkggggggKKKKKKKgggg..",
        "...rggggggggggKKKKKrrKKKKgggy.",
        "...TggggKKKKKKKKKrrKKKKKKggg..",
        ".TTgggwwwwKKKKKgggggggKKgggTT.",
        ".Tg..wwwwwKKKKKgggggggTg...gT.",
        "Tg..s..gT.....rrggg..Tg..s..gT",
        "Tg.sss.gT............Tg.sss.gT",
        "Tg..s..gT............Tg..s..gT",
        ".Tg...gT..............Tg...gT.",
        ".TTgggTT..............TTgggTT.",
        "...TTT..................TTT...",
      ],
      [
        ".........................c.K..",
        "........................cc.K..",
        ".............gggg......ccgg...",
        "KK..........gggggg...gggggg...",
        ".gkkkkkk...gggggggggKKKKggg...",
        "..ggkkkkkkkggggggKKKKKKKgggg..",
        "...rggggggggggKKKKKrrKKKKgggy.",
        "...TggggKKKKKKKKKrrKKKKKKggg..",
        ".TTgggwwwwKKKKKgggggggKKgggTT.",
        ".Tgs.wwwwwKKKKKgggggggTgs.s.gT",
        "Tg..s..gT.....rrggg..Tg..s..gT",
        "Tg.s.s.gT............Tg.s.s.gT",
        "Tg..s..gT............Tg..s..gT",
        ".Tgs.s.gT.............Tgs.s.gT",
        ".TTgggTT..............TTgggTT.",
        "...TTT..................TTT...",
      ],
    ],
  },
];
