import * as fs from "fs";
import jszip from "jszip";

async function run() {
    const zip = new jszip();
    const bytes = fs.readFileSync("dist/nor-maker-standalone.apk");
    const base = await zip.loadAsync(bytes);

    console.log("All files in generated APK:");
    const files = Object.keys(base.files);
    for (const file of files) {
        console.log(`- ${file} (${base.files[file].dir ? "dir" : "file"})`);
    }
}
run();
