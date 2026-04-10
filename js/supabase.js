// HUM Journal - Supabase Integration
// This module handles all database operations with Supabase

// Supabase configuration
const SUPABASE_URL = 'https://xbyywomrdepmbveideja.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_qzzZ_W-xFtKdLwX_hZc4Xg_apsVnBoY';

// Note: In production, these should be environment variables
// For now, we'll use a simple approach with fetch API

const DB_TABLE = 'articles';

// Initialize articles table if not exists
async function initDatabase() {
    try {
        // Try to fetch existing articles
        const response = await fetchArticles();
        return response;
    } catch (error) {
        console.log('Database initialization: ', error.message);
        // If table doesn't exist, we'll use localStorage as fallback
        return null;
    }
}

// Fetch all articles from Supabase
async function fetchArticles() {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${DB_TABLE}?select=*&order=date.desc`, {
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to fetch articles');
    }

    return await response.json();
}

// Insert new article to Supabase
async function insertArticle(article) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${DB_TABLE}`, {
        method: 'POST',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(article)
    });

    if (!response.ok) {
        throw new Error('Failed to insert article');
    }

    return true;
}

// Update article in Supabase
async function updateArticle(id, updates) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${DB_TABLE}?id=eq.${id}`, {
        method: 'PATCH',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        },
        body: JSON.stringify(updates)
    });

    if (!response.ok) {
        throw new Error('Failed to update article');
    }

    return true;
}

// Delete article from Supabase
async function deleteArticle(id) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/${DB_TABLE}?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
        }
    });

    if (!response.ok) {
        throw new Error('Failed to delete article');
    }

    return true;
}

// Check if Supabase is available
async function checkSupabaseAvailability() {
    try {
        await fetch(`${SUPABASE_URL}/rest/v1/`, {
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
            }
        });
        return true;
    } catch (error) {
        return false;
    }
}
