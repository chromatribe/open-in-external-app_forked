---
name: README fork disclosure
overview: README.md を「改変フォーク版であること」が一目で分かる構成に書き換え、原作者への敬意・変更点の明示・ライセンス継承を正しく表現する。
todos:
  - id: readme-rewrite
    content: README.md をフォーク版構成にリライト（ヘッダー・Fork Notice・Changes from Upstream・Installation・末尾整理）
    status: completed
  - id: changelog-update
    content: CHANGELOG.md の先頭にフォーク版の変更履歴を追記
    status: completed
  - id: verify-and-commit
    content: lint / test / VSIX再生成 / コミット / push
    status: completed
isProject: false
---

# README.md フォーク版リライト計画

## 現状の問題点

- タイトル・バッジ・Installationセクションがすべて原作者（`YuTengjing`）の Marketplace ページを指している
- 「My extensions」セクションは原作者の他拡張リストで、そのまま載せると紛らわしい
- CHANGELOG.md も原作者のコミットリンクのまま
- ライセンス（MIT）は改変・再配布を許可しているので法的には問題ないが、「改変版です」と明示しないと誤解を招く

## 推奨する README 構成（上から順に）

### 1. ヘッダー部分

- タイトルを `Open in External App (Fork)` に変更
- サブタイトルに「This is a **community fork** of [open-in-external-app](https://github.com/tjx666/open-in-external-app) by [YuTengjing](https://github.com/tjx666).」を明記
- 原作バッジ行は削除し、fork リポジトリ自体のバッジ（あれば）に差し替え、またはバッジなしにする

### 2. Fork Notice セクション（新規）

以下のトーンで書く（日英両方に入れる）:

> 同じことを考えていたところ、すでに先に開発・公開されていた作者さんの存在を知りました。
> 素晴らしいベースを作ってくれた YuTengjing に感謝しつつ、いくつかの改善を加えてフォークとして公開しています。

具体的に含める内容:

- 原作リポジトリ（[tjx666/open-in-external-app](https://github.com/tjx666/open-in-external-app)）へのリンク
- 原作者 YuTengjing への感謝の言葉
- MIT ライセンスに基づく改変である旨
- 原作との設定互換性（設定キー `openInExternalApp.*` は共通で使える）の明記

### 3. Changes from Upstream セクション（新規）

このフォークで加えた変更の一覧を箇条書きで明示:

- `Promise.allSettled` による複数アプリ起動の安全化
- 外部プロセス実行へのタイムアウト導入
- 全分岐でのエラーハンドリング統一
- 設定バリデーションのキャッシュ化
- 未信頼ワークスペースでの `shellCommand` ブロック
- 環境変数展開のバッチ最適化
- `${config:...}` 変数キャッシュ
- `autoOpenOnFileOpen` オプション追加
- 日本語設定ドキュメントの追加

### 4. 既存セクションの調整

- **Motivation**: 原文をベースにしつつ、「同じ課題を感じていた、先に作ってくれた作者に感謝」という一文を日本語で自然に加える
- **Installation**: fork リポジトリからの VSIX インストール手順に書き換え（Marketplace 未公開なら VSIX 手動インストール手順を記載）
- **Configuration / 日本語HowTo / Limits / FAQ**: 内容はそのまま維持
- **My extensions**: 原作者のリストなので削除し、代わりに「原作者の他拡張」としてリンクだけ残す形にする
- **Backers**: ロゴデザイナーへの感謝はそのまま残す

### 5. License セクション（新規 or 強化）

- 「MIT License - Copyright (c) 2022 YuTengjing」を明記
- 「Fork modifications are also released under the same MIT License.」を追記

### 6. CHANGELOG.md の扱い

- 原作の履歴はそのまま残す
- フォーク版の変更履歴を先頭に追記し、コミットリンクは fork リポジトリ（`chromatribe/open-in-external-app_forked`）を指すようにする

## 触らないもの

- [LICENSE](LICENSE): 原作の MIT ライセンスファイルはそのまま維持（MIT の条件として著作権表示を残す義務がある）
- `package.json` の `author` / `publisher`: Marketplace に出さないなら現状維持でも可。出す場合は別途検討が必要
