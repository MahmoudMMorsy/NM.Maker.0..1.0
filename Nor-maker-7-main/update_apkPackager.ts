import * as fs from "fs";

let content = fs.readFileSync("utils/apkPackager.ts", "utf8");

// Update generateArsc signature
content = content.replace(
    /const generateArsc = \(packageName: string\): Uint8Array => \{/,
    'const generateArsc = (packageName: string, ext: string): Uint8Array => {'
);

content = content.replace(
    /'res\/mipmap\/ic_launcher\.png'/,
    '`res/mipmap/ic_launcher.${ext}`'
);

content = content.replace(
    /const modifiedStrings = strings\.map\(\(s\) => \{/,
    'const modifiedStrings = strings.map((s, idx) => {'
);

content = content.replace(
    /if \(hasCustomIcon && s === 'extractNativeLibs'\) return 'icon';/,
    `if (hasCustomIcon && idx === 9) return 'icon';\n        if (hasCustomIcon && idx === 3) return 'roundIcon';`
);

content = content.replace(
    /restView\.setInt32\(8 \+ 9 \* 4, 0x01010002, true\);/,
    `restView.setInt32(8 + 9 * 4, 0x01010002, true);\n            restView.setInt32(8 + 3 * 4, 0x0101052c, true);`
);

content = content.replace(
    /if \(attrNameIndex === 9\) \{ \/\/ This was 'extractNativeLibs', now 'icon'\n                        \/\/ Change rawValue to -1\n                        restView\.setInt32\(attrPtr \+ 8, -1, true\);\n                        \/\/ Change dataType to TYPE_REFERENCE \(1\)\n                        restBytes\[attrPtr \+ 15\] = 1;\n                        \/\/ Change data to 0x7f010000\n                        restView\.setInt32\(attrPtr \+ 16, 0x7f010000, true\);\n                    \}/,
    `if (attrNameIndex === 9) {\n                        restView.setInt32(attrPtr + 8, -1, true);\n                        restBytes[attrPtr + 15] = 1;\n                        restView.setInt32(attrPtr + 16, 0x7f010000, true);\n                    } else if (attrNameIndex === 3 && hasCustomIcon) {\n                        restView.setInt32(attrPtr + 8, -1, true);\n                        restBytes[attrPtr + 15] = 1;\n                        restView.setInt32(attrPtr + 16, 0x7f010000, true);\n                    }`
);

content = content.replace(
    /const pngBase64 = iconUrl\.split\(\",\"\)?\[1\];\n\s*if \(\!pngBase64\) throw new Error\(\"Invalid icon\"\);\n\s*const pngBytes = Uint8Array\.from\(atob\(pngBase64\), c => c\.charCodeAt\(0\)\);\n\n\s*baseApk\.file\(\"res\/mipmap\/ic_launcher\.png\", pngBytes\);\n\s*const customArsc = generateArsc\(\"com\.normaker\.wrapper\"\);\n\s*baseApk\.file\(\"resources\.arsc\", customArsc\);/,
    `const mimeType = iconUrl.split(",")[0].split(":")[1].split(";")[0];\n            const ext = mimeType === "image/jpeg" ? "jpg" : "png";\n            const iconBase64 = iconUrl.split(",")[1];\n            if (!iconBase64) throw new Error("Invalid icon");\n            const iconBytes = Uint8Array.from(atob(iconBase64), c => c.charCodeAt(0));\n\n            baseApk.file(\`res/mipmap/ic_launcher.\${ext}\`, iconBytes);\n            const customArsc = generateArsc("com.normaker.wrapper", ext);\n            baseApk.file("resources.arsc", customArsc);`
);

content = content.replace(
    /if \(filename === \"resources\.arsc\" \|\| filename\.endsWith\(\"\.png\"\)\) \{/,
    `if (filename === "resources.arsc" || filename.endsWith(".png") || filename.endsWith(".jpg")) {`
);

fs.writeFileSync("utils/apkPackager.ts", content);
