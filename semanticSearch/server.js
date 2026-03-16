require('dotenv').config();
const express = require('express');
const axios = require('axios');
const { Endee } = require('endee');
const dataset = require('./data.js'); 

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

const endeeClient = new Endee(); 

// Generate Vector Array from Text
async function getEmbedding(text) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent?key=${GEMINI_API_KEY}`;
    const response = await axios.post(url, {
        model: "models/gemini-embedding-001",
        content: { parts: [{ text: text }] }
    });
    return response.data.embedding.values; 
}

// Route 1: Database Ingestion
app.post('/ingest', async (req, res) => {
    try {
        try {
            await endeeClient.createIndex({
                name: "rag_knowledge_base_v3",
                dimension: 3072, 
                space_type: "cosine"
            });
            console.log("Index created successfully.");
        } catch (err) {
            console.log("Index exists, proceeding...");
        }

        // ADDED: 'await' to properly resolve the database index
        const index = await endeeClient.getIndex("rag_knowledge_base_v3");
        let successCount = 0;
        
        for (const item of dataset) {
            const vectorArray = await getEmbedding(item.text);
            const payload = [{ id: item.id, vector: vectorArray, meta: { text: item.text } }];
            
            // ADDED: Dynamic method routing to bypass documentation variations
            if (typeof index.upsert === 'function') {
                await index.upsert(payload);
            } else if (typeof index.insert === 'function') {
                await index.insert(payload);
            } else if (typeof index.add === 'function') {
                await index.add(payload);
            } else {
                throw new Error("SDK Method not found. Available methods: " + Object.keys(index).join(", "));
            }
            successCount++;
        }
        
        res.status(200).json({ message: `Successfully ingested ${successCount} items.` });
    } catch (error) {
        console.error("Ingestion Error:", error.message);
        res.status(500).json({ error: "Failed to ingest data." });
    }
});

// Route 2: Semantic Search Query
app.get('/search', async (req, res) => {
    try {
        const userQuery = req.query.q;
        if (!userQuery) return res.status(400).json({ error: "Search query 'q' is required." });

        const queryVector = await getEmbedding(userQuery);
        
        // ADDED: 'await' to properly resolve the database index
        const index = await endeeClient.getIndex("rag_knowledge_base_v3");

        let results;
        const queryPayload = { vector: queryVector, top_k: 3 };

        // ADDED: Dynamic method routing for the search function
        if (typeof index.query === 'function') {
            results = await index.query(queryPayload);
        } else if (typeof index.search === 'function') {
            results = await index.search(queryPayload);
        } else {
             throw new Error("Search method not found.");
        }

        res.status(200).json({ results: results });
    } catch (error) {
        console.error("Search Error:", error.message);
        res.status(500).json({ error: "Failed to execute search." });
    }
});

app.listen(PORT, () => {
    console.log(`Semantic Search API running on http://localhost:${PORT}`);
});