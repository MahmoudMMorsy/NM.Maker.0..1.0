
import JSZip from 'jszip';

interface J2MEAssets {
    icon?: string;
    player?: string;
    ground?: string;
    item?: string;
}

// Convert Base64 data URI to Uint8Array for zip storage
const dataURItoBlob = (dataURI: string): Uint8Array | null => {
    if (!dataURI) return null;
    try {
        const byteString = atob(dataURI.split(',')[1]);
        const arrayBuffer = new ArrayBuffer(byteString.length);
        const int8Array = new Uint8Array(arrayBuffer);
        for (let i = 0; i < byteString.length; i++) {
            int8Array[i] = byteString.charCodeAt(i);
        }
        return int8Array;
    } catch (e) {
        console.error("Failed to convert data URI", e);
        return null;
    }
};

export const createJ2MEPackage = async (
    title: string,
    vendor: string,
    javaCode: string,
    assets: J2MEAssets
): Promise<{ jar: Blob, jad: Blob }> => {
    const zip = new JSZip();
    const safeTitle = title.replace(/[^\w\s]/gi, '').replace(/\s+/g, '');
    const mainClass = "GameMidlet";

    // 1. MANIFEST.MF
    const manifest =
`Manifest-Version: 1.0
MIDlet-1: ${title}, /icon.png, ${mainClass}
MIDlet-Name: ${title}
MIDlet-Vendor: ${vendor}
MIDlet-Version: 1.0.0
MicroEdition-Configuration: CLDC-1.1
MicroEdition-Profile: MIDP-2.0
`;

    zip.folder("META-INF")?.file("MANIFEST.MF", manifest);

    // 2. Source Code
    zip.file(`${mainClass}.java`, javaCode);

    // 3. Assets
    if (assets.icon) {
        const blob = dataURItoBlob(assets.icon);
        if (blob) zip.file("icon.png", blob);
    }
    if (assets.player) {
        const blob = dataURItoBlob(assets.player);
        if (blob) zip.file("player.png", blob);
    }
    if (assets.ground) {
        const blob = dataURItoBlob(assets.ground);
        if (blob) zip.file("ground.png", blob);
    }
    if (assets.item) {
        const blob = dataURItoBlob(assets.item);
        if (blob) zip.file("item.png", blob);
    }

    // 4. Instructions
    zip.file("README.txt",
`J2ME SOURCE PROJECT FOR: ${title}
------------------------------------
This archive contains the source code and assets for a J2ME MIDP 2.0 game.

IMPORTANT:
This file is a SOURCE PROJECT, not a runnable application yet.
To run this game on a phone or KEmulator, you must compile it first.

HOW TO COMPILE:
1. Extract this ZIP file.
2. Open NetBeans (with Mobility Pack) or Sun Java Wireless Toolkit (WTK).
3. Create a new Project.
4. Copy 'GameMidlet.java' to the 'src' folder.
5. Copy the .png images to the 'res' folder.
6. Build/Compile the project.
7. The output .jar file will be in the 'dist' folder.

Why is this not a JAR?
The browser cannot compile Java code directly. We provide the complete source code
and assets so you can build it yourself.
`);

    // Generate ZIP (Acting as Source Package)
    const jarBlob = await zip.generateAsync({ type: "blob" });

    // 5. Generate JAD File (Included for reference)
    const jad =
`MIDlet-1: ${title}, /icon.png, ${mainClass}
MIDlet-Jar-Size: 1024
MIDlet-Jar-URL: ${safeTitle}.jar
MIDlet-Name: ${title}
MIDlet-Vendor: ${vendor}
MIDlet-Version: 1.0.0
MicroEdition-Configuration: CLDC-1.1
MicroEdition-Profile: MIDP-2.0
`;

    const jadBlob = new Blob([jad], { type: "text/vnd.sun.j2me.app-descriptor" });

    return { jar: jarBlob, jad: jadBlob };
};
