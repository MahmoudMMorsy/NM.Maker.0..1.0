import * as React from 'react';
import { useState, useEffect } from 'react';
import forge from 'node-forge';
import { AndroidExportSettings, GameMetadata } from '../types';

interface Props {
    metadata: GameMetadata;
    onSave: (settings: AndroidExportSettings) => void;
    onUpdateMetadata: (metadata: GameMetadata) => void;
    onExport: () => void;
}

const AndroidExportSettingsWindow: React.FC<Props> = ({ metadata, onSave, onUpdateMetadata, onExport }) => {
    const [settings, setSettings] = useState<AndroidExportSettings>({
        packageName: 'com.mycompany.mygame',
        versionName: '1.0',
        versionCode: 1,
        minSdkVersion: 21,
        targetSdkVersion: 29,
        keystore: undefined,
        ...(metadata.androidExportSettings || {})
    });

    const [isGeneratingKey, setIsGeneratingKey] = useState(false);

    useEffect(() => {
        onSave(settings);
    }, [settings]);

    const handleGenerateKey = () => {
        setIsGeneratingKey(true);
        forge.pki.rsa.generateKeyPair({ bits: 2048, workers: -1 }, (err, keys) => {
            if (err) {
                console.error("Failed to generate key", err);
                alert("Failed to generate keystore");
                setIsGeneratingKey(false);
                return;
            }
            try {
                const cert = forge.pki.createCertificate();
                cert.publicKey = keys.publicKey;
                cert.serialNumber = '01';
                cert.validity.notBefore = new Date();
                cert.validity.notAfter = new Date();
                cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 25); // 25 years validity

                const attrs = [{
                    name: 'commonName',
                    value: metadata.title || 'NOR Game'
                }, {
                    name: 'organizationName',
                    value: 'NOR Maker'
                }];
                cert.setSubject(attrs);
                cert.setIssuer(attrs);
                cert.sign(keys.privateKey, forge.md.sha256.create());

                const privateKeyPem = forge.pki.privateKeyToPem(keys.privateKey);
                const certificatePem = forge.pki.certificateToPem(cert);

                setSettings(prev => ({
                    ...prev,
                    keystore: {
                        privateKeyPem,
                        certificatePem
                    }
                }));
            } catch (e) {
                console.error("Failed to create certificate", e);
                alert("Failed to create keystore");
            } finally {
                setIsGeneratingKey(false);
            }
        });
    };

    const handleClearKey = () => {
        if (confirm("Are you sure you want to remove the custom keystore? A default one will be used.")) {
            setSettings(prev => ({ ...prev, keystore: undefined }));
        }
    };

    const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                const dataUri = event.target?.result as string;

                // Convert to a standard 192x192 PNG via Canvas to guarantee PNG format, transparency, and correct dimensions for Android
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    canvas.width = 192;
                    canvas.height = 192;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.drawImage(img, 0, 0, 192, 192);
                        const pngDataUri = canvas.toDataURL('image/png');
                        onUpdateMetadata({ ...metadata, iconUrl: pngDataUri });
                    } else {
                        onUpdateMetadata({ ...metadata, iconUrl: dataUri });
                    }
                };
                img.onerror = () => {
                    onUpdateMetadata({ ...metadata, iconUrl: dataUri });
                };
                img.src = dataUri;
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="p-4 font-sans text-sm flex flex-col h-full bg-win-face">
            <h2 className="font-bold mb-4 font-ui text-[11px] text-win-blueGrad">Android Export Settings</h2>

            <div className="flex-1 overflow-auto pr-2 space-y-4">
                <div className="flex gap-4 items-end">
                    <div>
                        <label className="block mb-1 font-bold">App Icon</label>
                        <div className="w-16 h-16 border border-gray-400 shadow-win-in bg-white flex items-center justify-center overflow-hidden">
                            {metadata.iconUrl ? (
                                <img src={metadata.iconUrl} alt="App Icon" className="w-full h-full object-cover" />
                            ) : (
                                <div className="text-gray-400 text-xs text-center p-1">No Icon</div>
                            )}
                        </div>
                    </div>
                    <div>
                        <input
                            type="file"
                            accept="image/png, image/jpeg"
                            onChange={handleIconUpload}
                            className="hidden"
                            id="icon-upload"
                        />
                        <label
                            htmlFor="icon-upload"
                            className="px-3 py-1 bg-win-face hover:bg-gray-200 border border-gray-400 shadow-win-out active:shadow-win-in cursor-pointer text-xs block text-center"
                        >
                            Choose Image...
                        </label>
                        {metadata.iconUrl && (
                            <button
                                onClick={() => onUpdateMetadata({ ...metadata, iconUrl: null })}
                                className="mt-1 px-3 py-1 bg-red-100 hover:bg-red-200 border border-red-400 shadow-win-out active:shadow-win-in text-xs w-full"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>

                <div>
                    <label className="block mb-1 font-bold">Package Name</label>
                    <input
                        type="text"
                        value={settings.packageName}
                        onChange={e => {
                            // Only allow lowercase, numbers, and dots
                            const val = e.target.value.toLowerCase().replace(/[^a-z0-9.]/g, '');
                            setSettings({...settings, packageName: val})
                        }}
                        className="w-full border border-gray-400 px-2 py-1 shadow-win-in bg-white focus:outline-none focus:bg-[#ffffe0]"
                    />
                    <p className="text-xs text-gray-600 mt-1">Unique identifier (e.g. com.developer.game)</p>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block mb-1 font-bold">Version Name</label>
                        <input
                            type="text"
                            value={settings.versionName}
                            onChange={e => setSettings({...settings, versionName: e.target.value})}
                            className="w-full border border-gray-400 px-2 py-1 shadow-win-in bg-white focus:outline-none focus:bg-[#ffffe0]"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block mb-1 font-bold">Version Code</label>
                        <input
                            type="number"
                            value={settings.versionCode}
                            onChange={e => setSettings({...settings, versionCode: parseInt(e.target.value) || 1})}
                            className="w-full border border-gray-400 px-2 py-1 shadow-win-in bg-white focus:outline-none focus:bg-[#ffffe0]"
                        />
                    </div>
                </div>

                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block mb-1 font-bold">Min SDK</label>
                        <input
                            type="number"
                            value={settings.minSdkVersion}
                            onChange={e => setSettings({...settings, minSdkVersion: parseInt(e.target.value) || 21})}
                            className="w-full border border-gray-400 px-2 py-1 shadow-win-in bg-white focus:outline-none focus:bg-[#ffffe0]"
                        />
                    </div>
                    <div className="flex-1">
                        <label className="block mb-1 font-bold">Target SDK</label>
                        <input
                            type="number"
                            value={settings.targetSdkVersion}
                            onChange={e => setSettings({...settings, targetSdkVersion: parseInt(e.target.value) || 33})}
                            className="w-full border border-gray-400 px-2 py-1 shadow-win-in bg-white focus:outline-none focus:bg-[#ffffe0]"
                        />
                    </div>
                </div>

                <div className="border border-gray-300 p-3 bg-gray-50 shadow-win-in mt-4">
                    <label className="block mb-2 font-bold">App Signature (Keystore)</label>
                    {settings.keystore ? (
                        <div className="space-y-2">
                            <p className="text-green-700 font-bold text-xs">✓ Custom Keystore Generated</p>
                            <p className="text-xs text-gray-600">Your app will be signed with this unique key. Keep your project saved so you can update the app on the Play Store later.</p>
                            <button
                                onClick={handleClearKey}
                                className="px-3 py-1 bg-red-100 hover:bg-red-200 border border-red-400 shadow-win-out active:shadow-win-in text-xs"
                            >
                                Clear Keystore
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <p className="text-gray-600 text-xs">Using default debug signature. Generate a unique key for publishing.</p>
                            <button
                                onClick={handleGenerateKey}
                                disabled={isGeneratingKey}
                                className="px-3 py-1 bg-win-face hover:bg-gray-200 border border-gray-400 shadow-win-out active:shadow-win-in disabled:opacity-50 text-xs"
                            >
                                {isGeneratingKey ? "Generating RSA 2048 Key..." : "Generate New Keystore"}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-300 flex justify-end gap-2">
                <button
                    onClick={() => {
                        if (!settings.packageName || !settings.packageName.includes('.') || settings.packageName.startsWith('.') || settings.packageName.endsWith('.')) {
                            alert("Please enter a valid package name (e.g. com.developer.game).");
                            return;
                        }
                        onExport();
                    }}
                    className="px-4 py-2 bg-win-face hover:bg-gray-200 border border-gray-400 shadow-win-out active:shadow-win-in font-bold flex items-center gap-2"
                >
                    <span className="font-ui text-[10px]">Build APK</span>
                </button>
            </div>
        </div>
    );
};

export default AndroidExportSettingsWindow;
