import cli_runtime_lib from "./cli_runtime_lib.js";
const args = process.argv.slice(2);
if (args[0] === "go") {
    let tr = cli_runtime_lib.generate_cmd_tree();
    console.log(JSON.stringify(tr, null, 4));
    process.exit(0);
}
cli_runtime_lib.run_inactive();
