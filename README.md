<div align="center">

# Open in External App (Fork)

Open file with external application in VSCode.

**This is a community fork of [open-in-external-app](https://github.com/tjx666/open-in-external-app) by [YuTengjing](https://github.com/tjx666).**

Fork repository: [chromatribe/open-in-external-app_forked](https://github.com/chromatribe/open-in-external-app_forked)

</div>

## About This Fork

「VS Code からファイルを外部アプリで開きたい」と考えていたところ、まったく同じ発想で先に開発・公開されていた [YuTengjing](https://github.com/tjx666) さんの存在を知りました。  
素晴らしいベースを作ってくださったことに感謝しつつ、いくつかの改善を加えてフォーク版として公開しています。

This fork was born out of the same idea — I wanted to open files in external apps from VS Code.  
I found that [YuTengjing](https://github.com/tjx666) had already built exactly that.  
With deep respect and gratitude for the original work, I'm maintaining this fork with additional improvements.

- Original repository: [tjx666/open-in-external-app](https://github.com/tjx666/open-in-external-app)
- Licensed under [MIT](LICENSE) — Copyright (c) 2022 YuTengjing
- All existing configuration keys (`openInExternalApp.*`) are fully compatible with the original

## Changes from Upstream

Improvements added in this fork on top of v0.11.2:

- **Robustness**: `forEach(async)` in `openMultiple` replaced with `Promise.allSettled` — failures are now collected and reported per app
- **Timeout**: all external process calls (`exec`, `open` package, `vscode.env.openExternal`, WSL path conversion) are wrapped with a 15-second timeout
- **Unified error handling**: every branch in `open()` is covered by a single `try/catch`, giving consistent error messages to users
- **Config caching**: `getExtensionConfig()` now caches the Joi-validated result and invalidates only on `openInExternalApp.openMapper` changes, reducing per-command overhead
- **Security**: `shellCommand` execution is blocked in untrusted workspaces, with a prompt to manage workspace trust
- **Env var batch expansion**: `mergeEnvironments()` calls `parseVariables()` once for all env values instead of once per key
- **Config variable cache**: `${config:...}` lookups inside `parseVariables()` are cached per call to avoid redundant `getConfiguration().get()` calls
- **`autoOpenOnFileOpen`**: new per-extension option — set `true` to automatically launch the external app whenever the file is opened in VS Code
- **Japanese documentation**: Japanese setup guide added to this README

## 💡 Motivation

VSCode is a very excellent editor, but sometime I prefer to use external application to work with some files. For example, I like to use [typora](https://www.typora.io/) to edit the markdown files. Usually, I will right click to the file, and select `Reveal in File Explorer`, then open the file using external application.

But, with this extension, you can do it more simply. Just right click to the file, and select `Open in External App`, that file would be opened by system default application. You can also use this way to open `.psd` files with photoshop, `.html` files with browser, and so on...

## 🔌 Installation

This fork is not published to the VS Code Marketplace. Install it manually from the VSIX file.

1. Download `open-in-external-app-0.11.2.vsix` from the [releases page](https://github.com/chromatribe/open-in-external-app_forked/releases) (or build it yourself — see below).
2. Open VS Code / Cursor.
3. Open the Extensions view (`Cmd+Shift+X`).
4. Click `...` → **Install from VSIX...** and select the downloaded file.

### Build VSIX yourself

```bash
git clone https://github.com/chromatribe/open-in-external-app_forked.git
cd open-in-external-app_forked
npx pnpm install
npx pnpm package
```

## 🔧 Configuration

Via custom configuration, you can make extensions more powerful. For example, to see the rendering differences, You can open one HTML in chrome and Firefox at the same time.

Example configuration:

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      // represent file extension name
      "extensionName": "html",
      // the external applications to open the file which extension name is html
      "apps": [
        // openCommand can be shell command or the complete executable application path
        // title will be shown in the drop list if there are several apps
        {
          "title": "chrome",
          // On MacOS, openCommand should be 'Google Chrome.app'
          "openCommand": "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe"
        },
        {
          "title": "firefox",
          // On MacOS, openCommand should be 'Firefox Developer Edition.app'
          "openCommand": "C:\\Program Files\\Firefox Developer Edition\\firefox.exe",
          // open in firefox under private mode
          "args": ["-private-window"]
        }
      ]
    },
    {
      "extensionName": "tsx",
      // apps can be Object array or just the command you can access from shell
      "apps": "code"
    },
    {
      "extensionName": "psd",
      "apps": "/path/to/photoshop.exe"
    },
    // like code-runner, you can custom the shell command to open with file
    {
      "extensionName": "ts",
      "apps": [
        {
          "title": "run ts file",
          "shellCommand": "ts-node ${file}"
        }
      ]
    },
    {
      // shared config, details here: https://github.com/tjx666/open-in-external-app/issues/45
      "extensionName": "__ALL__",
      "apps": "MacVim"
    }
  ]
}
```

![open multiple](https://github.com/tjx666/open-in-external-app/blob/master/images/open-multiple.png?raw=true)

In VSCode, Right-clicking is different from right-clicking while holding `alt` key. If you just right click the file, you will see the command `Open in External App`, but if you right click file while holding `alt` key, you will see the command `Open in Multiple External Apps`.

![usage](https://github.com/tjx666/open-in-external-app/blob/master/images/usage.gif?raw=true)

## 🇯🇵 設定HowTo（日本語）

拡張機能の設定は `settings.json` の `openInExternalApp.openMapper` に書きます。  
まずは「拡張子ごとに、どのアプリで開くか」を定義するだけで使えます。

### 1) 最小構成（まずこれだけ）

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      "extensionName": "md",
      "apps": "Typora"
    }
  ]
}
```

- `extensionName`: 対象拡張子（例: `md`, `html`, `pdf`）
- `apps`: 開くアプリ。コマンド名または実行ファイルパスを指定

### 2) 1つの拡張子に複数アプリを設定

`apps` を配列にすると、`Open in Multiple External Apps` で複数選択できます。

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      "extensionName": "html",
      "apps": [
        {
          "title": "Chrome",
          "openCommand": "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
        },
        {
          "title": "Firefox",
          "openCommand": "C:\\Program Files\\Mozilla Firefox\\firefox.exe",
          "args": ["-private-window"]
        }
      ]
    }
  ]
}
```

### 3) どの拡張子でも共通で開く（共通設定）

`extensionName: "__ALL__"` を使うと、全ファイルに共通の処理を追加できます。

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      "extensionName": "__ALL__",
      "apps": "MacVim"
    }
  ]
}
```

### 4) shellCommand を使う場合の注意

`shellCommand` では `${file}` などの変数が使えます。

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      "extensionName": "ts",
      "apps": [
        {
          "title": "Run TS",
          "shellCommand": "ts-node ${file}"
        }
      ]
    }
  ]
}
```

- `shellCommand` は**信頼されていないワークスペースでは実行されません**
- その場合はワークスペースを Trusted にしてから実行してください

### 5) ファイルを開いたときに自動で外部アプリを起動したい

各拡張子設定で `autoOpenOnFileOpen: true` を指定すると、VS Code でそのファイルを開いたタイミングで外部アプリも起動します。

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      "extensionName": "md",
      "autoOpenOnFileOpen": true,
      "apps": [
        {
          "title": "mdmd",
          "openCommand": "/Applications/mdmd.app"
        }
      ]
    }
  ]
}
```

### 6) よくあるハマりどころ

- `title` は同じ `apps` 配列内で重複不可
- Electronアプリを開くときは `isElectronApp: true` が必要な場合あり
- WSL環境でWSLアプリを開く場合は `wslConvertWindowsPath: false` を設定

## :loudspeaker: Limits

This extension use two ways to open file in external applications.

### 1. Node package: [open](https://github.com/sindresorhus/open)

This package has one limit that can't open a file which is also made by electron. For example, you can't open `md` file in `typora` using this package. The `openCommand`, `args` configuration item is also supported by this package. When `isElectronApp: false`(by default), extension will use this way.

### 2. VSCode extension API: `vscode.env.openExternal(target: Uri)`

This API supports open file in application which is made by electron, but has one limit that [can't open file path which includes `Non-ascii` characters](https://github.com/microsoft/vscode/issues/88273). This API can only pass one argument `target`, `openCommand` and `args` configuration is also not work.

If you want to open file in application which is made by electron, you can choose one of two ways:

1. don not config it in VSCode settings, and set the default application of your operation system to open that file format.

2. using `isElectronApp` option:

   ```javascript
   {
        "extensionName": "md",
        "isElectronApp": true,
   }
   ```

   multiple apps example:

   ```javascript
   {
        "extensionName": "md",
        "apps": [
            {
                "title": "typora",
                "isElectronApp": true,
                // following config item is not work
                // "openCommand": "/path/to/typora.exe",
                // "args": ["--xxx"]
            },
            {
                "title": "idea",
                "openCommand": "/path/to/idea.exe",
                "args": ["--xxx"],
            }
        ]
    }
   ```

## ❓ FAQ

### Can I use variables in args and shellCommand?

Yes. you can use the variables placeholder documented at [predefined-variables](https://code.visualstudio.com/docs/editor/variables-reference#_predefined-variables). In addition to that, you can use:

- ${cursorLineNumber}
- ${cursorColumnNumber}

```jsonc
{
  "extensionName": "ts",
  "apps": [
    {
      "extensionName": "*",
      "apps": [
        {
          "title": "Explorer",
          // shell command combined with placeholder
          "shellCommand": "Explorer.exe /root,${fileDirname}"
        }
      ]
    },
    {
      "title": "run ts file",
      "shellCommand": "ts-node ${file}"
    }
  ]
}
```

### Can I add environment variables to the shellCommand?

Yes, you can use shellEnv to set additional environment variables:

```jsonc
{
  "extensionName": "ts",
  "apps": [
    {
      "extensionName": "*",
      "apps": [
        {
          "title": "run ts file",
          "shellCommand": "ts-node ${file}",
          "shellEnv": {
            "TOKEN": "tyekjjbqbptcxeycgmwqfepus"
          }
        }
      ]
    }
  ]
}
```

Or you can set separate environment variables for Windows, Linux and macOS:

```jsonc
{
  "extensionName": "ts",
  "apps": [
    {
      "extensionName": "*",
      "apps": [
        {
          "title": "run ts file",
          "shellCommand": "ts-node ${file}",
          "shellEnv": {
            "windows": {
              "PLATFORM": "Windows"
            },
            "linux": {
              "PLATFORM": "GNU/Linux"
            },
            "osx": {
              "PLATFORM": "macOS"
            }
          }
        }
      ]
    }
  ]
}
```

### How to use in WSL (Windows Subsystem for Linux)?

When using VSCode in WSL remote mode, file paths need to be converted between WSL and Windows formats depending on whether you're opening the file in a Windows application or a WSL application.

**By default, the extension converts WSL paths to Windows paths** (e.g., `/home/user/file.pdf` → `C:\Users\user\file.pdf`) to support opening files in Windows applications from WSL.

However, if you want to open files with **WSL applications** (like `evince`, `xdg-open`), you need to set `wslConvertWindowsPath: false` to keep the WSL native path:

```jsonc
{
  "openInExternalApp.openMapper": [
    // ✅ Open with Windows application (default behavior)
    {
      "extensionName": "lyx",
      "apps": [
        {
          "title": "Lyx (Windows)",
          "shellCommand": "lyx.exe ${file}"
          // wslConvertWindowsPath defaults to true
          // ${file} will be: C:\Users\username\file.lyx
        }
      ]
    },
    // ✅ Open with WSL application
    {
      "extensionName": "pdf",
      "apps": [
        {
          "title": "Evince (WSL)",
          "shellCommand": "evince ${file}",
          "wslConvertWindowsPath": false
          // ${file} will be: /home/username/file.pdf
        }
      ]
    }
  ]
}
```

**Related Issues:**

- [#16](https://github.com/tjx666/open-in-external-app/issues/16) - Opening files in Windows applications from WSL
- [#74](https://github.com/tjx666/open-in-external-app/issues/74) - Opening files in WSL applications from WSL

### assign keyboard shortcut for specific config item

`keybindings.json`:

```jsonc
{
  "key": "cmd+k cmd+o",
  "command": "openInExternalApp.open",
  "args": {
    // same with following id
    "configItemId": "xxx"
  }
}
```

`settings.json`:

```jsonc
{
  "openInExternalApp.openMapper": [
    {
      // extensionName is ignored when set configItemId arg in shortcut
      "extensionName": "",
      "id": "xxx",
      "apps": ""
    }
  ]
}
```

## License

MIT License — Copyright (c) 2022 [YuTengjing](https://github.com/tjx666)

Fork modifications are also released under the same [MIT License](LICENSE).

## 🧡 Backers

Thanks to `JiangShiqi` for designing the extension's logo.
