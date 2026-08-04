import * as fs from "fs";
import { createAPK } from "./utils/apkPackager";

async function run() {
    console.log("Generating test APK...");
    const htmlContent = "<html><body><h1>Hello World</h1></body></html>";
    const apkBlob = await createAPK("My Test App", htmlContent, "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEgAACxIB0t1+/AAAABZ0RVh0Q3JlYXRpb24gVGltZQAxMy8wNy8yNleYm0wAAAAgdEVYdFNvZnR3YXJlAEFkb2JlIEZpcmV3b3JrcyBDUzYst0g7AAAAFnRFWHREZXNjcmlwdGlvbgA4cHggY2FudmFzNIn3mgAAADJJREFUeJzt0AENAAAAwqAE39K3FhZgAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAD4MZvAAAdN7Y6IAAAAASUVORK5CYII=");

    const buffer = Buffer.from(await apkBlob.arrayBuffer());
    fs.writeFileSync("test_generated.apk", buffer);
    console.log("Generated test_generated.apk successfully!");
}
run();
