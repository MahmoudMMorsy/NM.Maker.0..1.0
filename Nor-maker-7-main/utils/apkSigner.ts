import JSZip from 'jszip';
import forge from 'node-forge';

const PRIVATE_KEY_PEM = `-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEAnjb1/wToxs1bKVuA1+Ef0TPd3mvnetJXKfbBQJCQZg5KMQnc
Fpq7/u+Vsi81eoOaDeGYHqHFAWWfs7U+VLo3u4XUs+WtFP/X7WkIhxMx8jDktI0I
tlCoXLsMw/DYYkiBAevO4t9heU4Lr3ILSITidIM5A6jO/yBa9iB95A7NGBEVDcc5
yTLQgkChBjXYZgBjXarQUH5Erw6wv/z/S591aiBtTnjY0qM/0MhRMvfadwc6GaTR
NlxUzRMGMagF9uuM7Xoe46aJWdQRH79m3c3SzCYbQvPNiGuGvthx1IIr8KIiGtTF
CdukLTgXvMj315uCj0ATT/gxUT7BO8hwYxjGfQIDAQABAoIBAA9emnYcJXrOjzkM
zQ7rrToW9ko5pEKPtWz7rhlWEdkAMV/jK9C8Vl/1KU8me+T7bNdFX5A2OduhYirE
hBoZ/vkGDrwtJyu/kNvc1Lm+eR8kdcs+WibP3hMoDpzoRDUEAxhLLo1mkuMEXGk+
RG9WjWMxLjQ3TWiGXZ/EV0Z006KvOvhzjktzya+U5mvOQ4g1WlaKPPsMU8dLg2sS
17Kv0evuDkPMscA21/tAHs1H5ikQjTOAKFZXxRYEzVhhEhNbw4wFBme5NVYQSJN8
EsaObPtJwzZIiyA/axvw9YYc373CPf25cWS8jm+KttG7cLoMXbodZSrjZyhl/zpF
z/EwodcCgYEA1RxYkgKslcq5jFP6wp6YB69EIvn1PLFAUOgluI8F103AqB5srf1Q
i7BCA1lJg6d1hCOtLgRgy9JyqVubY9gvtYpcySBYQetERXG41KAO4pBJfsBtoJMN
gP2uOKcIn8tq3/r9zXe9dEkJyvjXrtAJQGQaZsq0oKNLgEcy2swbEccCgYEAvg5S
idF/m/N6X80VfqtI+NP+q//jsVU7aqgABMpUywQRWhzt2LooNqBZge1GicJKjDM7
0iQV5VnZbUE715pTvYAVVg3zs9k3FfAQu+oFAO7EufEsTxC6jXNQkMDPYfBrj+SN
URy+3HiC42A67rJ7crQPFZloEwzColq8x+nC5ZsCgYEAhO6ZkPp6DTXXZ+E6mguz
aZe6ONcSUjl+lPk6DlWonxSxCC1yPVW12GypwM0BPk5Gz5YxgHLarkknnNy3oSBJ
IkScfBjg9L18aJT3ZioxHsJCFf6SY4dW9Q9Ija4jgwmwMOavSmtWkiK9KQ7v+utp
2fCXR2dKJKm3ftzqq/CFMiECgYEAimy6FyEcVYTXq7Eep7yvkHQveC0PNNjERuGH
6fVIHvmefci2P3UO1wKhTq14A9wcGdMzDdI0lHCFmTq7EESaG1qPr7bHukVKBtNs
DMHc1RoS9O9Ae3HOvjmwA047fbTzUsF/YAWUydWIV31+Tt52ZUvZ9Lxf/gf8Nu3p
s52B02MCgYBxLYbqMRG5tcywWu0S4QsJ1yU421tIetrinWNOn4/fxSKWVVBYdcBG
FVj/MT+sqDYix84+HXFXT2Ven/955HwlRKjCCxer79SiI83FPPgxiVQtYDq6jOYX
1JaDcH/oe4WnjbAAxuBzesEy/XlBgnIF/eVOoTyJdlHITw+sF+suKw==
-----END RSA PRIVATE KEY-----`;

const CERTIFICATE_PEM = `-----BEGIN CERTIFICATE-----
MIIC5TCCAc2gAwIBAgIBATANBgkqhkiG9w0BAQsFADA1MRIwEAYDVQQDEwlOT1Ig
TWFrZXIxEjAQBgNVBAoTCU5PUiBNYWtlcjELMAkGA1UEBhMCVVMwIBcNMjUwMTAx
MDAwMDAwWhgPMjA1NTAxMDEwMDAwMDBaMDUxEjAQBgNVBAMTCU5PUiBNYWtlcjES
MBAGA1UEChMJTk9SIE1ha2VyMQswCQYDVQQGEwJVUzCCASIwDQYJKoZIhvcNAQEB
BQADggEPADCCAQoCggEBAJ429f8E6MbNWylbgNfhH9Ez3d5r53rSVyn2wUCQkGY
OSjEJ3Baau/7vlbIvNXqDmg3hmB6hxQFln7O1PlS6N7uF1LPlrRT/1+1pCIcTMfI
w5LSNCLZQqFy7DMPw2GJIgQHrzuLfYXlOC69yC0iE4nSDOQOozv8gWvYgfeQOzRg
RFQ3HOcky0IJAoQY12GYAY12q0FB+RK8OsL/8/0ufdWogbU542NKjP9DIUTL32nc
HOhmk0TZcVM0TBjGoBfbrjO16HuOmiVnUER+/Zt3N0swmG0LzzYhrhr7YcdSCK/C
iIhrUxQnbpC04F7zI99ebgo9AE0/4MVE+wTvIcGMYxn0CAwEAATANBgkqhkiG9w0B
AQsFAAOCAQEANdhMe2FBFtUH94wt6LUbtiF+gckjNZBxl4GZXUjuW2yTMqJJElSK
qc1FW22ZET3Nrae+6ap8WFuWOHelV29DD77Hk7CkLdaOLKRLuWcvtwVBBpQcy198
CxJ5FSpq53QZzxBZxLyFMDF1Yc0+EHI0PV8UKK4UBjJ8UFHw4/fyk5xPaEXkW1b+
NtryQY2aRJk5Di5gOSiHs7NZlVYuCTU5V2EkJKp3wc7ektQER6LEa3q2ZnWaiYbj
WJtIeYx70mjh/9qrQr3hGvnUXhTlbRJqsqbdTS52zPQb+rahKnQtUf5hInyWqx3E
k9Wnye9d3srNoriSEk1k4wsC1hm42kkeDA==
-----END CERTIFICATE-----`;

/**
 * Robust, cryptographically correct APK V1 (JAR) Signer.
 * Generates valid META-INF/MANIFEST.MF, META-INF/CERT.SF, and META-INF/CERT.RSA files
 * using a stable 2048-bit RSA key and PKCS#7 signature blocks.
 */

// Helper to compute SHA-256 using fast native Web Crypto API
const sha256 = async (bytes: Uint8Array): Promise<string> => {
    // Falls back gracefully if running in environment where globalThis.crypto is structured differently,
    // though modern browser and Node.js environments have globalThis.crypto.subtle.
    const cryptoSubtle = typeof window !== 'undefined' ? window.crypto?.subtle : (globalThis as any).crypto?.subtle;
    if (cryptoSubtle) {
        const hashBuffer = await cryptoSubtle.digest('SHA-256', bytes);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const binary = hashArray.map(b => String.fromCharCode(b)).join('');
        return btoa(binary);
    } else {
        // Fallback to node-forge SHA-256 if Web Crypto is unavailable (e.g. non-secure local contexts)
        const md = forge.md.sha256.create();
        const binaryString = Array.from(bytes).map(b => String.fromCharCode(b)).join('');
        md.update(binaryString, 'raw');
        return forge.util.encode64(md.digest().getBytes());
    }
};

// Formats text according to strict JAR manifest line wrapping specifications (max 72 bytes)
const wrapManifestText = (text: string): string => {
    const lines = text.split('\r\n');
    const wrappedLines: string[] = [];
    for (let line of lines) {
        if (line === '') {
            wrappedLines.push('');
            continue;
        }
        let wrapped = '';
        let first = true;
        while (line.length > 0) {
            const limit = first ? 72 : 71; // 71 bytes for continuation lines (since continuation starts with space)
            if (line.length <= limit) {
                wrapped += (first ? '' : ' ') + line;
                break;
            } else {
                wrapped += (first ? '' : ' ') + line.substring(0, limit) + '\r\n';
                line = line.substring(limit);
                first = false;
            }
        }
        wrappedLines.push(wrapped);
    }
    return wrappedLines.join('\r\n');
};

export const signAPK = async (zip: JSZip, customPrivateKeyPem?: string, customCertificatePem?: string): Promise<void> => {
    // 1. Remove any pre-existing signature files in META-INF
    const filesToRemove = Object.keys(zip.files).filter(f => f.toUpperCase().startsWith("META-INF/"));
    filesToRemove.forEach(f => zip.remove(f));

    // 2. Identify all actual files to hash (exclude directories)
    const filesToHash = Object.keys(zip.files).filter(f => !zip.files[f].dir);

    // 3. Generate META-INF/MANIFEST.MF
    let manifestContent = "Manifest-Version: 1.0\r\nCreated-By: 1.0 (Android)\r\n\r\n";
    const manifestEntriesMap: Record<string, string> = {};

    for (const filename of filesToHash) {
        const fileData = await zip.file(filename)!.async("uint8array");
        const fileHash = await sha256(fileData);

        const entryText = `Name: ${filename}\r\nSHA-256-Digest: ${fileHash}\r\n\r\n`;
        const wrappedEntry = wrapManifestText(entryText);
        manifestContent += wrappedEntry;
        manifestEntriesMap[filename] = wrappedEntry;
    }

    // Write MANIFEST.MF
    zip.file("META-INF/MANIFEST.MF", manifestContent);

    // 4. Generate META-INF/CERT.SF
    const manifestBytes = new TextEncoder().encode(manifestContent);
    const manifestHash = await sha256(manifestBytes);

    let certSfContent = `Signature-Version: 1.0\r\nCreated-By: 1.0 (Android)\r\nSHA-256-Digest-Manifest: ${manifestHash}\r\n\r\n`;

    for (const filename of filesToHash) {
        const entryText = manifestEntriesMap[filename];
        const entryBytes = new TextEncoder().encode(entryText);
        const entryHash = await sha256(entryBytes);

        const sfEntry = `Name: ${filename}\r\nSHA-256-Digest: ${entryHash}\r\n\r\n`;
        certSfContent += wrapManifestText(sfEntry);
    }

    // Write CERT.SF
    zip.file("META-INF/CERT.SF", certSfContent);

    // 5. Use pre-generated, cryptographically compliant 2048-bit RSA Certificate and Private Key (allows upgrades without conflicts)
    const privateKey = forge.pki.privateKeyFromPem(customPrivateKeyPem || PRIVATE_KEY_PEM);
    const cert = forge.pki.certificateFromPem(customCertificatePem || CERTIFICATE_PEM);

    // 6. Sign CERT.SF to generate PKCS#7 signed-data block (META-INF/CERT.RSA)
    const p7 = forge.pkcs7.createSignedData();
    p7.content = forge.util.createBuffer(certSfContent, 'utf8');
    p7.addCertificate(cert);
    p7.addSigner({
        key: privateKey,
        certificate: cert,
        digestAlgorithm: (forge as any).oids?.sha256 || '2.16.840.1.101.3.4.2.1',
        authenticatedAttributes: [
            {
                type: (forge as any).oids?.contentType || '1.2.840.113549.1.9.3',
                value: (forge as any).oids?.data || '1.2.840.113549.1.7.1'
            },
            {
                type: (forge as any).oids?.messageDigest || '1.2.840.113549.1.9.4'
                // Value is automatically calculated and injected by forge during .sign()
            },
            {
                type: (forge as any).oids?.signingTime || '1.2.840.113549.1.9.5',
                value: new Date()
            }
        ]
    });
    p7.sign();

    // Serialize PKCS#7 signed data structure to binary DER format
    const derBytesStr = forge.asn1.toDer(p7.toAsn1()).getBytes();
    const certRsaBytes = new Uint8Array(derBytesStr.length);
    for (let i = 0; i < derBytesStr.length; i++) {
        certRsaBytes[i] = derBytesStr.charCodeAt(i);
    }

    // Write CERT.RSA
    zip.file("META-INF/CERT.RSA", certRsaBytes);
};
