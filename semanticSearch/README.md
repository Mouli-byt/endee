# Semantic Search API with Endee Vector Database

## Project Overview
This project implements a pure Semantic Search REST API. It bypasses traditional lexical keyword matching by utilizing Google's Gemini LLM to generate mathematical vector embeddings, storing and querying them via the Endee high-performance vector database. 

## System Design
The application is built on a standard Node.js/Express architecture, functioning as a middleware orchestrator:
1. **Data Transformation:** Text payloads are routed to Google's `gemini-embedding-001` API, converting strings into 3072-dimensional floating-point arrays.
2. **Storage:** The text metadata and vector arrays are ingested into a local Endee Docker container.
3. **Retrieval:** User queries are embedded via Gemini and sent to Endee, which calculates mathematical distance using Cosine Similarity to return the top 3 semantically relevant data points.

## Use of Endee
Endee serves as the core vector storage and nearest-neighbor search engine. It is hosted locally via Docker. The official `@endee/client` Node.js SDK is used to dynamically create indices (dimension: 3072, space_type: cosine), insert vectorized knowledge base payloads, and execute the final mathematical similarity queries.

## Setup Instructions

### 1. Prerequisites
* Node.js (v18+)
* Docker Desktop
* Google AI Studio API Key (Gemini)

### 2. Database Initialization
Run the Endee vector database locally using Docker:
```bash
docker run --ulimit nofile=100000:100000 -p 8080:8080 -v ./endee-data:/data --name endee-server --restart unless-stopped endeeio/endee-server:latest

### 3. Application Setup
Navigate to the API directory and install dependencies:
```bash
cd semanticSearch
npm install express axios dotenv endee