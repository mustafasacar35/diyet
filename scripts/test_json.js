const notes = "{\"source\":\"ai_text\"}";
try {
    const parsed = typeof notes === 'string' ? JSON.parse(notes) : notes;
    console.log("Parsed:", parsed);
    console.log("Source:", parsed.source);
    console.log("Match:", parsed.source === 'ai_text');
} catch (e) {
    console.error(e);
}
