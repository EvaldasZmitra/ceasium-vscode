import * as vscode from "vscode";
import * as path from "path";
import * as os from "os";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("ceasium.ceasiumInit", init())
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("ceasium.ceasiumConfigure", configure())
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("ceasium.ceasiumRun", run())
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("ceasium.ceasiumBuild", build())
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("ceasium.ceasiumClear", clear())
  );
  context.subscriptions.push(
    vscode.commands.registerCommand("ceasium.ceasiumInstall", install())
  );
}

async function generateConfig(): Promise<any> {
  const platform = os.platform();

  let osInfo: string;
  switch (platform) {
    case "win32":
      osInfo = "Win32";
      break;
    case "darwin":
      osInfo = "Mac";
      break;
    case "linux":
      osInfo = "Linux";
      break;
    default:
      osInfo = "Unknown";
  }
  const config = await readConfig("build.json");
  return {
    configurations: [
      {
        name: osInfo,
        compilerPath: path.normalize(
          runCommand(`where ${config["compiler"]}`).trim()
        ),
        includePath: [],
      },
    ],
    version: 4,
    enableConfigurationSquiggles: true,
  };
}

function init(): (...args: any[]) => any {
  return () => {
    let terminal =
      vscode.window.activeTerminal ?? vscode.window.createTerminal();
    terminal.show();
    terminal.sendText("");
    terminal.sendText("ceasium init");
  };
}

function configure(): (...args: any[]) => any {
  return () => {
    readConfig("build.json").then((c) => {
      const libs: Array<string>[] = c["libraries"];
      let includes = Array.from(
        new Set<string>(
          libs.flatMap((lib) => {
            const arr: string[] = runCommand(`pkg-config --cflags ${lib}`)
              .trim()
              .split(" ")
              .filter((f) => f.slice(0, 2) === "-I")
              .map((f) => path.normalize(f.slice(2)));
            return arr;
          })
        )
      );
      let rootPath = vscode.workspace.workspaceFolders![0].uri.fsPath;
      const includePath = path.join(rootPath, "include");
      includes.push(includePath);

      generateConfig().then((x) => {
        x.configurations[0].includePath = includes;
        write(".vscode/c_cpp_properties.json", JSON.stringify(x, null, 2));
      });
      // readConfig(".vscode/c_cpp_properties.json").then((x) => {
      //   x["configurations"][0]["includePath"] = includes;
      //   write(".vscode/c_cpp_properties.json", JSON.stringify(x, null, 2));
      // });
    });
  };
}

function run(): (...args: any[]) => any {
  return () => {
    let terminal =
      vscode.window.activeTerminal ?? vscode.window.createTerminal();
    terminal.show();
    terminal.sendText("");
    terminal.sendText("ceasium run");
  };
}

function build(): (...args: any[]) => any {
  return () => {
    let terminal =
      vscode.window.activeTerminal ?? vscode.window.createTerminal();
    terminal.show();
    terminal.sendText("");
    terminal.sendText("ceasium build");
  };
}

function clear(): (...args: any[]) => any {
  return () => {
    let terminal =
      vscode.window.activeTerminal ?? vscode.window.createTerminal();
    terminal.show();
    terminal.sendText("");
    terminal.sendText("ceasium clear");
  };
}

function install(): (...args: any[]) => any {
  return () => {
    readConfig("build.json").then((c) => {
      console.log(c["packages"]);
      const options: vscode.QuickPickItem[] = Object.keys(c["packages"]).map(
        (x) => {
          return {
            label: x,
          };
        }
      );

      const selectedOption = vscode.window.showQuickPick(options, {
        placeHolder: "Choose an option",
      });
      selectedOption.then((x) => {
        let terminal =
          vscode.window.activeTerminal ?? vscode.window.createTerminal();
        terminal.show();
        terminal.sendText("");
        terminal.sendText(`ceasium install ${x?.label}`);
      });
    });
  };
}

async function readConfig(file: string) {
  const files = await vscode.workspace.findFiles(file);
  const fileContent = await vscode.workspace.fs.readFile(files[0]);
  return JSON.parse(Buffer.from(fileContent).toString("utf-8"));
}

async function write(file: string, content: string) {
  const files = await vscode.workspace.findFiles(file);
  vscode.workspace.fs.writeFile(files[0], Buffer.from(content));
}

export function deactivate() {}

function runCommand(command: string) {
  try {
    const cp = require("child_process");
    return Buffer.from(cp.execSync(command)).toString("utf-8");
  } catch {
    return "";
  }
}
