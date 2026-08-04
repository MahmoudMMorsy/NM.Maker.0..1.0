import * as fs from "fs";
import jszip from "jszip";
import { BASE_APK_B64 } from "./utils/apkBase64";

async function run() {
    const zip = new jszip();
    const base = await zip.loadAsync(Buffer.from(BASE_APK_B64, "base64"));

    console.log("All files in base APK:");
    const files = Object.keys(base.files);
    for (const file of files) {
        console.log(`- ${file}`);
    }
}
run();
