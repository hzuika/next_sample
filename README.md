# next_sample
Next.jsのサンプルプロジェクト

ターミナルで以下のコマンドを実行してプロジェクトを作成しました．

```
npx create-next-app@latest
```

選択肢は以下の通りです．

```
√ What is your project named? ... next-sample
√ Would you like to use TypeScript? ... Yes
√ Would you like to use ESLint? ... Yes
√ Would you like to use Tailwind CSS? ... Yes
√ Would you like your code inside a `src/` directory? ... Yes
√ Would you like to use App Router? (recommended) ... Yes
√ Would you like to use Turbopack for `next dev`? ... Yes
√ Would you like to customize the import alias (`@/*` by default)? ... No
```

next.config.ts の `nextConfig` を編集します．

```ts
// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "export",
};

export default nextConfig;
```

ビルドします．

```
cd next-sample
npx next build
```