const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const code = fs.readFileSync('services/geminiService.ts', 'utf8');
const htmlMatch = code.match(/const html = \`([\s\S]*?)<\/html>\`;/);
if (htmlMatch) {
    let html = htmlMatch[1] + "</html>";
    html = html.replace(/\$\{safeJSON\(fullGameData\)\}/g, '{"title":"Test"}');

    const virtualConsole = new jsdom.VirtualConsole();
    virtualConsole.sendTo(console);

    const dom = new JSDOM(html, { runScripts: "dangerously", virtualConsole });

    setTimeout(() => {
        console.log("Finished running scripts in JSDOM");
    }, 1000);
} else {
    console.log("HTML not found");
}
