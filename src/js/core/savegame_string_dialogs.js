/**
 * Helper module for showing savegame export/import dialogs using copy-paste instead of file download/upload.
 * Only used for web builds.
 */

/* typehints:start */
import { HUDModalDialogs } from "../game/hud/parts/modal_dialogs";
/* typehints:end */

import { T } from "../translations";
import { waitNextFrame } from "./utils";

/**
 * Show a dialog with the serialized savegame string for copying
 * @param {HUDModalDialogs} dialogs
 * @param {string} serializedData The serialized savegame data
 * @param {string} gameName The name of the game/savegame
 * @returns {Promise<void>}
 */
export async function showExportSavegameStringDialog(dialogs, serializedData, gameName) {
    const contentHTML = `
        <div class="savegameStringDialog">
            <p>Copy the text below to save your game:</p>
            <textarea readonly class="savegameStringContent" id="export-savegame-textarea">${escapeHtml(serializedData)}</textarea>
            <div class="savegameStringActions" style="margin-top: 10px; display: flex; gap: 10px;">
                <button id="copy-savegame-btn" class="styledButton">Copy to Clipboard</button>
                <span id="copy-feedback" class="copyFeedback" style="display:none; align-self: center; font-weight: bold; color: #4CAF50;">✓ Copied!</span>
            </div>
        </div>
    `;

    const buttonSignals = dialogs.showInfo(
        `Export Savegame - ${gameName}`,
        contentHTML,
        ["done:good"]
    );

    // Wait for next frame to ensure DOM elements are rendered
    await waitNextFrame();

    const copyBtn = document.getElementById("copy-savegame-btn");
    const textarea = /** @type {HTMLTextAreaElement} */ (document.getElementById("export-savegame-textarea"));
    const feedback = document.getElementById("copy-feedback");

    if (copyBtn && textarea) {
        copyBtn.addEventListener("click", () => {
            // Select the text and copy to clipboard
            textarea.select();
            document.execCommand("copy");

            // Show feedback
            if (feedback) {
                feedback.style.display = "inline-flex";
                setTimeout(() => {
                    feedback.style.display = "none";
                }, 2000);
            }
        });
    }

    return new Promise(resolve => {
        buttonSignals.done.add(() => {
            resolve();
        });
    });
}

/**
 * Show a dialog for importing a savegame string
 * @param {HUDModalDialogs} dialogs
 * @returns {Promise<string>} Resolves with the pasted string when user clicks Import, rejects if cancelled
 */
export async function showImportSavegameStringDialog(dialogs) {
    const contentHTML = `
        <div class="savegameStringDialog">
            <p>Paste your savegame string below:</p>
            <textarea class="savegameStringContent" id="import-savegame-textarea" placeholder="Paste your savegame string here..." style="min-height: 150px; width: 100%;"></textarea>
        </div>
    `;

    const buttonSignals = dialogs.showInfo(
        "Import Savegame",
        contentHTML,
        ["import:good", "cancel:bad"]
    );

    // Wait for next frame to ensure DOM elements are rendered
    await waitNextFrame();

    return new Promise((resolve, reject) => {
        const onImport = () => {
            const textarea = /** @type {HTMLTextAreaElement} */ (document.getElementById("import-savegame-textarea"));
            if (textarea) {
                const pastedString = textarea.value.trim();
                if (pastedString) {
                    resolve(pastedString);
                } else {
                    reject(new Error("No savegame string provided"));
                }
            } else {
                reject(new Error("Dialog element not found"));
            }
        };

        const onCancel = () => {
            reject(new Error("Import cancelled by user"));
        };

        buttonSignals.import.add(onImport);
        buttonSignals.cancel.add(onCancel);
    });
}

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} text
 * @returns {string}
 */
function escapeHtml(text) {
    const map = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}
