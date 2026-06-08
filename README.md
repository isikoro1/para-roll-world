# para-roll-world

`para-roll-world` は、真上から見たたくさんの傘が静かに回転し、足跡がマウスカーソルをゆっくり追いかける、落ち着いた抽象アニメーションアプリです。

公開 URL: https://isikoro1.github.io/pararoll-world/

## Tech stack

- Vite
- React
- TypeScript
- Canvas API
- CSS
- requestAnimationFrame

## How to run

```bash
npm install
npm run dev
```

本番ビルド:

```bash
npm run build
```

## Controls

- マウス移動: 足跡の目的地を変更
- クリック: 新しい世界を生成
- `R` キー: 新しい世界を生成

## Generation modes

- `full-random`: 傘ごとに独立した配色と模様を生成
- `unified`: 全ての傘が同じデザイン
- `two-type`: 2種類のデザインをグリッド上で交互に配置
- `rare-weird`: 通常の傘の中に少し変わった傘を混ぜる低確率モード

## Notes

傘の見た目はすべて Canvas プリミティブで手続き的に描画しています。画像アセット、バックエンド、データベース、認証は使っていません。
