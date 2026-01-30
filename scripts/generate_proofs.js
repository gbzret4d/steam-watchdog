const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '../database.json');
const OUTPUT_PATH = path.join(__dirname, '../PROOFS.md');

function generateProofs() {
    console.log('Generating PROOFS.md...');

    if (!fs.existsSync(DB_PATH)) {
        console.error('Database not found:', DB_PATH);
        process.exit(1);
    }

    let database;
    try {
        const data = fs.readFileSync(DB_PATH, 'utf8');
        database = JSON.parse(data);
    } catch (e) {
        console.error('Error parsing database.json:', e);
        process.exit(1);
    }

    let markdown = `# Steam Dev Filter - Proofs Database\n\n`;
    markdown += `This document contains the proofs and details for developers listed in the Steam Dev Filter database.\n`;
    markdown += `*Auto-generated. Do not edit manually.*\n\n`;
    markdown += `Last Updated: ${new Date().toISOString().split('T')[0]}\n\n`;
    markdown += `---\n\n`;

    // Sort by name for readability
    const sortedEntries = Object.entries(database).sort((a, b) =>
        a[1].name.localeCompare(b[1].name)
    );

    for (const [id, entry] of sortedEntries) {
        markdown += `## <a id="${id}"></a>${entry.name}\n\n`;
        markdown += `- **Category**: ${entry.type}\n`;
        markdown += `- **Severity**: ${entry.severity ? entry.severity.toUpperCase() : 'UNKNOWN'}\n`;
        if (entry.aliases && entry.aliases.length > 0) {
            markdown += `- **Aliases**: ${entry.aliases.join(', ')}\n`;
        }
        markdown += `- **Notes**: ${entry.notes}\n`;

        // Handle single proof_url or (future) multiple proofs
        markdown += `- **Evidence**:\n`;
        if (entry.proof_url) {
            markdown += `  - [Primary Source](${entry.proof_url})\n`;
        }
        // Future: loop over entry.proofs if we add that array

        markdown += `\n---\n\n`;
    }

    fs.writeFileSync(OUTPUT_PATH, markdown, 'utf8');
    console.log(`Successfully generated PROOFS.md with ${sortedEntries.length} entries.`);
}

generateProofs();
