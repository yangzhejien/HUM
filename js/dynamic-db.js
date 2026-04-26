// HUM Journal - Dynamic Database Integration
// Using Supabase for real-time cross-device article sync

// Supabase configuration
const SUPABASE_URL = 'https://gslggufgrtmdeyyyveay.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_9aToFofHZaM9crNMcCpaAQ_xGpm2MBJ';

let supabaseClient = null;
let useSupabase = false;

async function initDatabase() {
    try {
        if (typeof supabase !== 'undefined') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
            useSupabase = true;
            console.log('Supabase connected successfully');
        }
    } catch (error) {
        console.log('Using localStorage fallback:', error.message);
    }

    // Initialize localStorage if not exists
    if (!localStorage.getItem('hum_articles')) {
        localStorage.setItem('hum_articles', JSON.stringify([]));
    }
}

// Get all articles (from Supabase or localStorage)
async function getArticles() {
    await initDatabase();

    // Try Supabase first
    if (useSupabase && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('articles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            if (data && data.length > 0) {
                console.log('Loaded', data.length, 'articles from Supabase');
                // Sync to localStorage as backup
                localStorage.setItem('hum_articles', JSON.stringify(data));
                return data;
            }
        } catch (e) {
            console.log('Supabase error:', e.message);
        }
    }

    // Fallback to localStorage
    const data = localStorage.getItem('hum_articles');
    return data ? JSON.parse(data) : [];
}

// Get published articles
async function getPublishedArticles() {
    const articles = await getArticles();
    return articles.filter(a => a.status === 'published');
}

// Get pending review articles
async function getPendingArticles() {
    const articles = await getArticles();
    return articles.filter(a => a.status === 'pending');
}

// Get articles by category
async function getArticlesByCategory(category) {
    const articles = await getArticles();
    return articles.filter(a => a.category === category);
}

// Get all articles (alias for getArticles)
async function getAllArticles() {
    return await getArticles();
}

// Create article
async function createArticle(article) {
    await initDatabase();

    // Prepare article data for Supabase
    const supabaseArticle = {
        title: article.title,
        author: article.author,
        email: article.email || null,
        abstract: article.abstract || null,
        keywords: article.keywords || null,
        category: article.category || 'public',
        status: article.status || 'draft',
        content: article.content,
        file_name: article.file_name || null,
        date: article.date || new Date().toISOString(),
        created_at: article.created_at || new Date().toISOString()
    };

    let savedArticle = null;

    if (useSupabase && supabaseClient) {
        try {
            const { data, error } = await supabaseClient
                .from('articles')
                .insert([supabaseArticle])
                .select()
                .single();

            if (error) throw error;
            savedArticle = data;
            console.log('Article saved to Supabase:', savedArticle);
        } catch (e) {
            console.log('Supabase error:', e.message);
        }
    }

    // Also save to localStorage as backup
    const newArticle = {
        ...savedArticle,
        id: savedArticle?.id || Date.now().toString(),
        title: article.title,
        author: article.author,
        email: article.email || null,
        abstract: article.abstract || null,
        keywords: article.keywords || null,
        category: article.category || 'public',
        status: article.status || 'draft',
        content: article.content,
        file_name: article.file_name || null,
        date: article.date || new Date().toISOString(),
        created_at: savedArticle?.created_at || new Date().toISOString()
    };

    const articles = JSON.parse(localStorage.getItem('hum_articles') || '[]');
    articles.push(newArticle);
    localStorage.setItem('hum_articles', JSON.stringify(articles));

    return newArticle;
}

// Update article
async function updateArticle(id, updates) {
    await initDatabase();

    // Get articles from localStorage for backup
    let articles = JSON.parse(localStorage.getItem('hum_articles') || '[]');
    const index = articles.findIndex(a => a.id == id || a.id === id);

    if (index !== -1) {
        articles[index] = {
            ...articles[index],
            ...updates,
            updated_at: new Date().toISOString()
        };
    }

    // Update in Supabase
    if (useSupabase && supabaseClient) {
        try {
            const supabaseId = typeof id === 'string' ? parseInt(id) : id;
            await supabaseClient
                .from('articles')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', supabaseId);
            console.log('Article updated in Supabase');
        } catch (e) {
            console.log('Supabase update error:', e.message);
        }
    }

    localStorage.setItem('hum_articles', JSON.stringify(articles));
    return articles[index] || null;
}

// Delete article
async function deleteArticle(id) {
    await initDatabase();

    // Get articles from localStorage
    let articles = JSON.parse(localStorage.getItem('hum_articles') || '[]');
    articles = articles.filter(a => a.id != id && a.id !== id);

    // Delete from Supabase
    if (useSupabase && supabaseClient) {
        try {
            const supabaseId = typeof id === 'string' ? parseInt(id) : id;
            await supabaseClient
                .from('articles')
                .delete()
                .eq('id', supabaseId);
            console.log('Article deleted from Supabase');
        } catch (e) {
            console.log('Supabase delete error:', e.message);
        }
    }

    localStorage.setItem('hum_articles', JSON.stringify(articles));
}

// Publish article
async function publishArticle(id) {
    return updateArticle(id, {
        status: 'published',
        published_at: new Date().toISOString()
    });
}

// Unpublish article
async function unpublishArticle(id) {
    return updateArticle(id, {
        status: 'unpublished',
        unpublished_at: new Date().toISOString()
    });
}

// Initialize on load
initDatabase();

