// HUM Journal - Supabase Dynamic Backend
// This file handles all database operations with Supabase

// Supabase configuration - using environment credentials
const supabaseUrl = 'https://gslggufgrtmdeyyyveay.supabase.co';
const supabaseAnonKey = 'sb_publishable_9aToFofHZaM9crNMcCpaAQ_xGpm2MBJ';

// For now, we'll use a simple API-less approach that works without backend
// This can be enhanced later with actual Supabase integration

class HUMDatabase {
    constructor() {
        this.storageKey = 'hum_articles';
        this.initialized = false;
    }

    // Initialize database
    async init() {
        if (this.initialized) return;

        // Try to load from localStorage first
        const stored = localStorage.getItem(this.storageKey);
        if (!stored) {
            localStorage.setItem(this.storageKey, JSON.stringify([]));
        }

        this.initialized = true;
    }

    // Get all articles
    async getArticles() {
        await this.init();
        const data = localStorage.getItem(this.storageKey);
        return JSON.parse(data || '[]');
    }

    // Get published articles only
    async getPublishedArticles() {
        const articles = await this.getArticles();
        return articles.filter(a => a.status === 'published');
    }

    // Get article by ID
    async getArticle(id) {
        const articles = await this.getArticles();
        return articles.find(a => a.id === id);
    }

    // Create new article
    async createArticle(article) {
        await this.init();
        const articles = await this.getArticles();

        const newArticle = {
            id: Date.now().toString(),
            ...article,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        articles.push(newArticle);
        localStorage.setItem(this.storageKey, JSON.stringify(articles));

        return newArticle;
    }

    // Update article
    async updateArticle(id, updates) {
        await this.init();
        const articles = await this.getArticles();
        const index = articles.findIndex(a => a.id === id);

        if (index === -1) throw new Error('Article not found');

        articles[index] = {
            ...articles[index],
            ...updates,
            updatedAt: new Date().toISOString()
        };

        localStorage.setItem(this.storageKey, JSON.stringify(articles));
        return articles[index];
    }

    // Delete article
    async deleteArticle(id) {
        await this.init();
        let articles = await this.getArticles();
        articles = articles.filter(a => a.id !== id);
        localStorage.setItem(this.storageKey, JSON.stringify(articles));
    }

    // Publish article
    async publishArticle(id) {
        return await this.updateArticle(id, {
            status: 'published',
            publishedAt: new Date().toISOString()
        });
    }

    // Unpublish article
    async unpublishArticle(id) {
        return await this.updateArticle(id, {
            status: 'unpublished',
            unpublishedAt: new Date().toISOString()
        });
    }
}

// Create global database instance
window.humDB = new HUMDatabase();

