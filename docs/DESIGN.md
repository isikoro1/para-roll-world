# para-roll-world 設計書

## 目的

`para-roll-world` は、上から見た傘の群れが静かに回転し、足跡が画面内を歩く抽象アニメーションアプリです。

実装方針は次の通りです。

- 静的フロントエンドのみで動かす
- 傘は画像を使わず Canvas API で手続き的に描画する
- 毎回違う世界を生成する
- レアな傘模様やレアな配置を低確率で混ぜる
- アニメーション中に重い再生成をしない

## 技術構成

- Vite
- React
- TypeScript
- Canvas API
- CSS
- requestAnimationFrame

バックエンド、データベース、認証はありません。

## ファイル構成と責務

### `src/App.tsx`

React 側の薄い殻です。

主な責務:

- Canvas の初期化
- requestAnimationFrame の開始と停止
- リサイズ時の Canvas 再設定
- スワイプ / ドラッグによる世界再生成
- `R` キーによる世界再生成
- マウスやポインター入力を足跡の目的地へ反映
- 無入力時の自動散歩ターゲット生成
- 描画順の制御

描画順:

1. 背景
2. 足跡
3. 傘
4. 右下のシード値 UI

足跡を傘より先に描くことで、足跡が傘の下にあるように見せています。

### `src/lib/world.ts`

世界全体の生成を担当します。

主な責務:

- 生成モードの反映
- 背景色の生成
- 配置モードの抽選
- 配置レアリティの抽選
- 傘の数、位置、サイズ、回転速度の決定
- 傘デザインの割り当て
- 背景描画

`createWorld(width, height)` が中心関数です。
この関数は Canvas サイズを受け取り、描画ループで使う `WorldState` を返します。

### `src/lib/umbrella.ts`

傘1本のデザイン生成と描画を担当します。

主な責務:

- 傘デザインの生成
- 基本模様の描画
- rare / superRare / mythic 装飾の描画
- weird 傘の描画
- 傘のリブ、外周、中心キャップの描画

傘の外形は、レアでも大きく崩さない方針です。
レア感は外形ではなく、内側の装飾レイヤーで出します。

### `src/lib/footprints.ts`

足跡の状態更新と描画を担当します。

主な責務:

- 足跡の目的地管理
- follower 位置の補間
- 速度上限による不自然な高速移動の抑制
- 歩幅ごとの足跡生成
- 左右交互の足跡
- 足跡のフェードアウト
- 靴底風の足跡描画

### `src/lib/random.ts`

ランダム生成の補助関数を集約しています。

主な責務:

- 乱数ヘルパー
- 配列からのランダム選択
- weighted な生成モード選択
- HSL ベースの色生成
- シード表示用ラベル生成

### `src/types.ts`

アプリ全体で共有する型定義を集約しています。

主な型:

- `GenerationMode`
- `LayoutMode`
- `LayoutRarity`
- `UmbrellaRarity`
- `UmbrellaPatternType`
- `UmbrellaDesign`
- `UmbrellaInstance`
- `Footprint`
- `FootprintState`
- `WorldState`

## 生成モード

世界全体の傘デザイン割り当て方針です。

| モード | 内容 |
| --- | --- |
| `full-random` | 傘ごとに独立したデザインを生成 |
| `unified` | すべての傘が同じデザイン |
| `two-type` | 2種類のデザインを交互に配置 |
| `rare-weird` | weird や上位レアが出やすい低確率モード |

## 傘の基本模様

基本模様は次の8種類です。

- `solid`
- `alternating`
- `dots`
- `stripes`
- `rings`
- `checker`
- `flower`
- `weird`

通常のレア傘は、`weird` 以外の基本模様の上にレア装飾を重ねます。

## 傘のレアリティ

傘のレアリティは階層構造です。

| レアリティ | 内容 |
| --- | --- |
| `normal` | 基本模様のみ |
| `rare` | 基本模様 + rare 装飾 |
| `superRare` | 基本模様 + rare 装飾 + superRare 装飾 |
| `mythic` | 基本模様 + rare 装飾 + superRare 装飾 + mythic 装飾 |
| `weird` | weird 専用の実験的な傘 |

### rare 装飾

- `jewels`
- `lace`
- `moon`
- `pinwheel`
- `confetti`
- `constellation`

### superRare 装飾

- `halo`
- `sundial`
- `petalCrown`
- `prismOrbit`

### mythic 装飾

- `aurora`
- `eclipse`
- `cometMap`

## 配置モード

配置にもレアリティがあります。

### normal 配置

- `neat-grid`
- `offset-grid`
- `wide-grid`
- `dense-grid`
- `diagonal-drift`

### rare 配置

- `wave-grid`
- `courtyard-grid`

### superRare 配置

- `spiral-vortex`
- `radial-bloom`

### mythic 配置

- `nested-orbit`

## 回転速度モード

世界全体の回転速度の傾向です。

- `sleepy`
- `steady`
- `breezy`
- `mixed`

個々の傘の速度は、この速度モードを基準にさらに少しばらつかせます。

## インタラクション

| 操作 | 内容 |
| --- | --- |
| マウス移動 | 足跡の目的地を更新 |
| スワイプ / ドラッグ | 世界を再生成 |
| `R` キー | 世界を再生成 |
| 無入力 | 足跡が近場を自動散歩 |

クリックだけでは再生成しません。
誤操作を避けるため、一定距離以上のスワイプ / ドラッグで再生成します。

## パフォーマンス方針

- 傘デザインは生成時に一度だけ作る
- 毎フレーム新しい傘デザインは作らない
- 傘の位置やサイズは `WorldState` に保持する
- 毎フレーム行う処理は、回転値更新と Canvas 描画に絞る
- Canvas の `save()` / `restore()` を使い、傘ごとの transform を局所化する

## 公開

公開 URL:

https://para-roll-world.isikoro.dev/

GitHub Pages の `gh-pages` ブランチへ `dist` をデプロイします。

関連ファイル:

- `public/CNAME`
- `vite.config.ts`
- `package.json` の `deploy` script

独自ドメイン直下で公開するため、Vite の `base` は `/` です。

## 今後拡張しやすい場所

- 傘の基本模様を増やす: `src/lib/umbrella.ts`
- レア装飾を増やす: `src/lib/umbrella.ts`
- 配置モードを増やす: `src/lib/world.ts`
- 生成確率を調整する: `src/lib/world.ts` と `src/lib/random.ts`
- 足跡の動きを調整する: `src/lib/footprints.ts` と `src/App.tsx`
