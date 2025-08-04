# 【React & TypeScript】高精度タイマーで作る！ストップウォッチ開発チュートリアル (018)

## 🚀 はじめに (The "Why")

こんにちは！このチュートリアルでは、ReactとTypeScriptを使って、ただのタイマーではない、ミリ秒単位まで計測可能な「高精度ストップウォッチ」を開発します。

**完成形のイメージ:**
![ストップウォッチの完成イメージ](https://i.imgur.com/9Jz2a4i.gif)

「時間を計る」というシンプルな機能ですが、その裏側にはフロントエンド開発の重要なエッセンスが詰まっています。このチュートリアルを通して、あなたは以下の核心的な技術をマスターします。

1.  **正確な時間計測:** なぜ`setInterval`だけでは不十分なのか？ブラウザの描画と同期する`requestAnimationFrame`と、絶対的な時刻基準である`Date.now()`を組み合わせることで、ズレの少ない正確なタイマーを実装する方法を学びます。
2.  **`useRef`の真価:** `useState`が再レンダリングをトリガーするのに対し、`useRef`は再レンダリングを引き起こさずに値を保持し続けることができます。タイマーIDや計測開始時刻といった「裏方」のデータを管理する上で、`useRef`がいかに強力であるかを体感します。
3.  **複雑な状態ロジック:** 「計測中」「停止中」といった状態に応じて、ボタンの表示や活性/非活性を切り替えるなど、複数の状態が絡み合うロジックを整理し、クリーンに実装する思考法を身につけます。

この課題を乗り越えれば、あなたは単にUIを作るだけでなく、時間の概念を正確に扱い、パフォーマンスを意識したインタラクティブなコンポーネントを構築する深い知識を得られるでしょう。

さあ、時間の流れをコードで捉えに行きましょう！

---

## 🛠 環境構築 (公式ドキュメント完全準拠)

`Vite`を使い、モダンな開発環境を迅速にセットアップします。

### 1. Viteプロジェクトの作成

```bash
npm create vite@latest stopwatch-app -- --template react-ts
cd stopwatch-app
```

### 2. Tailwind CSS と shadcn/ui のセットアップ

UI構築のために、公式ドキュメントに従ってTailwind CSSとshadcn/uiを導入します。

**a. Tailwind CSSの追加**

```bash
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**b. `tailwind.config.js` の設定**

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

**c. `src/index.css` の編集**

ファイルの中身を以下に置き換えます。

```css
/* src/index.css */
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**d. `tsconfig.json` のパスエイリアス設定**

```json
// tsconfig.json
{
  "compilerOptions": {
    // ...
    "baseUrl": ".",
    "paths": {
      "@/*": [
        "./src/*"
      ]
    }
  },
  // ...
}
```

**e. `vite.config.ts` の更新**

```bash
npm install -D @types/node
```

```typescript
// vite.config.ts
import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

**f. `shadcn/ui` の初期化**

```bash
npx shadcn-ui@latest init
```

表示される質問には、以下のように答えてください。

```
Would you like to use TypeScript (recommended)? yes
Which style would you like to use? › Default
Which color would you like to use as base color? › Slate
Where is your global CSS file? › › src/index.css
Do you want to use CSS variables for colors? › yes
Where is your tailwind.config.js located? › tailwind.config.js
Configure import alias for components: › @/components
Configure import alias for utils: › @/lib/utils
Are you using React Server Components? › no
```

### 3. 必要なUIコンポーネントの追加

今回はボタンのみ使用します。

```bash
npx shadcn-ui@latest add button
```

以上で環境構築は完了です！ `npm run dev` を実行して、開発を始めましょう。

---

## 🧠 思考を促す開発ステップ

### Step 1: 時間をフォーマットするヘルパー関数

まず、ミリ秒単位の数値を `MM:SS:ms` 形式の文字列に変換する関数を用意しておくと便利です。`src/lib/utils.ts`（shadcn/uiが生成したファイル）に追記しましょう。

```ts
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// TODO: この関数を追加しましょう
export const formatTime = (time: number) => {
  const minutes = Math.floor(time / 60000).toString().padStart(2, '0');
  const seconds = Math.floor((time % 60000) / 1000).toString().padStart(2, '0');
  const milliseconds = (time % 1000).toString().padStart(3, '0').slice(0, 2);
  return `${minutes}:${seconds}.${milliseconds}`;
};
```

### Step 2: `useState` と `useRef` で状態を定義する

`App.tsx`で、ストップウォッチに必要な状態と参照を定義します。なぜ`useRef`を使うのか、コメントを読んで考えてみましょう。

```tsx
// src/App.tsx
import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/utils";

function App() {
  // TODO: 経過時間（ミリ秒）を保持するstateを定義しましょう。
  const [time, setTime] = useState(0);
  
  // TODO: ストップウォッチが動作中かどうかを保持するstateを定義しましょう。
  const [isActive, setIsActive] = useState(false);

  // TODO: ラップタイムの配列を保持するstateを定義しましょう。
  const [laps, setLaps] = useState<number[]>([]);

  // requestAnimationFrameのIDを保持します。
  // 再レンダリングを引き起こさずに値を更新したい場合にuseRefは最適です。
  const animationFrameId = useRef<number | null>(null);

  // 計測開始時刻のタイムスタンプを保持します。
  // これも再レンダリングは不要です。
  const startTime = useRef<number | null>(null);

  // 一時停止した時点での経過時間を保持します。
  const pausedTime = useRef(0);

  return ( <div/> ); // この行は後でUIに置き換えます
}

export default App;
```

### Step 3: UIの骨格を作成する

ストップウォッチの表示エリアと操作ボタン、ラップタイムリストの基本的なレイアウトを作成します。

```tsx
// src/App.tsx
// ... (imports)

function App() {
  // ... (useState, useRef definitions)

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center font-mono">
      <div className="text-8xl font-bold mb-8">
        {/* TODO: formatTimeユーティリティを使って、`time` stateを表示しましょう */}
        <span>{formatTime(time)}</span>
      </div>

      <div className="space-x-4 mb-8">
        {/* TODO: 4つのボタンをここに配置します */}
        <Button>ラップ</Button>
        <Button>{/* TODO: isActiveに応じて "ストップ" または "スタート" を表示 */}</Button>
        <Button>リセット</Button>
      </div>

      <div className="w-80 h-64 overflow-y-auto bg-gray-800 rounded-lg p-4">
        <ul className="space-y-2">
          {/* TODO: laps配列をmapでループして、ラップタイムをリスト表示しましょう */}
          {laps.map((lap, index) => (
            <li key={index} className="flex justify-between text-lg">
              <span>Lap {index + 1}</span>
              <span>{formatTime(lap)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### Step 4: `requestAnimationFrame`でタイマーループを実装

ここが最重要ポイントです。`setInterval`ではなく`requestAnimationFrame`を使い、正確なタイマー処理を実装します。

```tsx
// ... (inside App component)

// useCallbackで関数をメモ化し、不要な再生成を防ぎます。
const animate = useCallback(() => {
  if (startTime.current === null) return;
  
  // TODO: 現在時刻と開始時刻の差分から経過時間を計算しましょう。
  // 一時停止していた時間 (pausedTime.current) も考慮に入れるのがポイントです。
  const elapsedTime = Date.now() - startTime.current + pausedTime.current;
  setTime(elapsedTime);

  // TODO: 次のフレームで再びanimate関数を呼び出すように予約しましょう。
  animationFrameId.current = requestAnimationFrame(animate);
}, []);
```

### Step 5: スタート・ストップ処理の実装

`handleStartStop`関数を作成し、`useEffect`を使って`isActive`の変更を監視し、タイマーループを開始・停止させます。

```tsx
// ... (inside App component)

const handleStartStop = () => {
  if (isActive) {
    // --- ストップ処理 ---
    // TODO: アニメーションフレームをキャンセルしましょう。
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
    // TODO: 停止した時点の経過時間をpausedTimeに記録しましょう。
    pausedTime.current = time;
  } else {
    // --- スタート処理 ---
    // TODO: 計測開始時刻を現在のタイムスタンプで設定しましょう。
    startTime.current = Date.now();
    // TODO: アニメーションを開始しましょう。
    animationFrameId.current = requestAnimationFrame(animate);
  }
  // TODO: isActiveの真偽値を反転させましょう。
  setIsActive(!isActive);
};

// useEffectは不要になりました。handleStartStop内で直接ロジックを管理します。
```

*修正：当初`useEffect`での管理を提案していましたが、スタート・ストップのロジックはイベントハンドラ内で直接管理する方が、状態の依存関係がシンプルになり、直感的でバグが少なくなります。`useEffect`は`isActive`という「状態」の変更を監視して副作用を起こしますが、今回は「ボタンが押された」という「イベント」を起点に処理を開始/停止するため、ハンドラに直接記述する方が適切です。*

### Step 6: ラップとリセット処理の実装

`handleLap`と`handleReset`関数を実装します。

```tsx
// ... (inside App component)

const handleLap = () => {
  // TODO: 計測中 (isActive) でなければ何もしない、というガード節を書きましょう。
  if (!isActive) return;
  // TODO: 現在のtimeをlaps配列の末尾に追加しましょう。
  // ヒント: setLaps(prevLaps => [...prevLaps, time]);
  setLaps(prevLaps => [...prevLaps, time]);
};

const handleReset = () => {
  // TODO: すべての状態とuseRefの値を初期値に戻しましょう。
  setIsActive(false);
  setTime(0);
  setLaps([]);
  if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current);
  animationFrameId.current = null;
  startTime.current = null;
  pausedTime.current = 0;
};
```

### Step 7: ボタンの制御とUIの完成

最後に、イベントハンドラをボタンに紐付け、状態に応じてボタンの表示や活性/非活性を制御します。

```tsx
// ... (inside App component's return statement)

<div className="space-x-4 mb-8">
  <Button onClick={handleLap} disabled={!isActive && time === 0}>
    ラップ
  </Button>
  <Button onClick={handleStartStop} className="w-24">
    {isActive ? "ストップ" : "スタート"}
  </Button>
  <Button onClick={handleReset} disabled={isActive || time === 0}>
    リセット
  </Button>
</div>

// ... (lap list)
```

これで高精度ストップウォッチの完成です！

---

## 📚 深掘りコラム (Deep Dive)

### なぜ`setInterval`はストップウォッチに不向きなのか？

`setInterval(() => setTime(t => t + 10), 10)` のように書くと、一見10ミリ秒ごとに時間が進みそうに見えます。しかし、JavaScriptはシングルスレッドで動作し、ブラウザには他にもたくさんのタスク（レンダリング、他のスクリプト実行など）があります。もし`setInterval`の実行タイミングでブラウザが別の重い処理をしていた場合、コールバック関数の実行は**遅延**します。この小さな遅延が積み重なると、実際の時間とストップウォッチの表示との間に大きなズレが生じてしまうのです。

一方、`requestAnimationFrame`はブラウザの描画サイクルと同期しており、コールバックの実行タイミングが最適化されています。そして、その中で `Date.now()` という「絶対的な時刻」からの差分を計算することで、途中の処理が多少遅延しても、表示される時間は常に正確なものになります。これが、正確性が求められるタイマー実装におけるベストプラクティスです。

---

## 🔥 挑戦課題 (Challenges)

-   **Easy 難易度: ラップタイムの差分表示**
    -   ラップタイムリストに、一つ前のラップとの時間差も表示してみましょう。最初のラップは、スタートからの時間そのものです。

-   **Medium 難易度: コンポーネント分割**
    -   `App.tsx`が大きくなってきました。ロジックを`hooks/useStopwatch.ts`というカスタムフックに切り出してみましょう。また、UIを`Display.tsx`, `Controls.tsx`, `Laps.tsx`のようにコンポーネントに分割し、`App.tsx`を整理してください。

-   **Hard 難易度: キーボードショートカット**
    -   `useEffect`を使って`window`にキーボードイベントリスナーを追加し、スペースキーで「スタート/ストップ」、`L`キーで「ラップ」、`R`キーで「リセット」ができるように機能を拡張してみましょう。コンポーネントがアンマウントされる際に、イベントリスナーをクリーンアップするのを忘れないでください。

---

## ✅ 結論

お疲れ様でした！このチュートリアルを通して、あなたは以下の重要な概念を実践的に学びました。

-   `requestAnimationFrame`と`Date.now()`を用いた、正確でパフォーマンスの良いタイマーの実装方法。
-   `useState`と`useRef`の役割の違いと、それぞれの適切な使い分け。
-   複数の状態が絡み合うコンポーネントのロジックを、イベントハンドラと状態更新を通じて管理する手法。

時間の流れという目に見えないものを、ReactのHooksを使って正確に捉えるスキルは、アニメーションやゲーム、リアルタイム更新が必要なアプリケーションなど、様々な場面で応用できます。ぜひこの知識を武器に、さらにインタラクティブなWeb開発の世界を楽しんでください。

Happy Coding!
