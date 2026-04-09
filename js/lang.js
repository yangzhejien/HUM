/**
 * HUM Journal - Language Switcher
 * Handles bilingual (English/Chinese) content switching
 */

(function() {
    'use strict';

    // Language data - all translatable text
    const TRANSLATIONS = {
        // Navigation
        nav: {
            home: { en: 'Home', zh: '首页' },
            public: { en: 'Public', zh: '大众刊' },
            academic: { en: 'Academic', zh: '专业刊' },
            about: { en: 'About', zh: '关于' },
            journal: { en: 'Journal', zh: '期刊' },
            submit: { en: 'Submit', zh: '投稿' },
            rules: { en: 'Rules', zh: '规则' },
            admin: { en: 'Admin', zh: '管理' }
        },

        // Home page
        home: {
            heroTitle: { en: 'HUM JOURNAL', zh: 'HUM 期刊' },
            heroSubtitle: { en: 'Humanity & Thought Journal', zh: '人文与思想期刊' },
            heroSlogan: { en: '"Freedom of Thought, Rational Expression"', zh: '"思想自由，理性表达"' },
            heroSloganZh: { en: '思想自由，理性表达', zh: 'Freedom of Thought, Rational Expression' },

            section1: { en: 'Section I', zh: '板块一' },
            section2: { en: 'Section II', zh: '板块二' },

            publicTitle: { en: 'HUM-Public', zh: 'HUM-大众刊' },
            publicTitleCn: { en: '大众刊', zh: 'Public' },
            publicDesc: { en: 'Open publication without barriers. Free expression of ideas. All viewpoints welcome except illegal, abusive, discriminatory, or provocative content.', zh: '无门槛发表，观点自由。除违法、辱骂、歧视、引战内容外，欢迎所有观点。' },
            publicEnter: { en: 'Enter →', zh: '进入大众刊 →' },

            academicTitle: { en: 'HUM-Academic', zh: 'HUM-专业刊' },
            academicTitleCn: { en: '专业刊', zh: 'Academic' },
            academicDesc: { en: 'Emphasis on logic and academic rigor. Peer-reviewed scholarly contributions. Building foundation for future formal development.', zh: '注重逻辑与学术规范，为未来正规发展铺路。' },
            academicEnter: { en: 'Enter →', zh: '进入专业刊 →' },

            latestArticles: { en: 'Latest Articles', zh: '最新文章' },
            loading: { en: 'Loading...', zh: '加载中...'},
            noArticles: { en: 'No articles yet. Submit your work!', zh: '暂无文章，快来投稿吧！'}
        },

        // About page
        about: {
            title: { en: 'About HUM Journal', zh: '关于 HUM 期刊' },
            subtitle: { en: 'Humanity & Thought Journal', zh: '人文与思想期刊' },

            tributeTitle: { en: 'Tribute to the Pioneer', zh: '致敬前辈' },
            tributeText: { en: 'This journal is dedicated to all those who have pursued truth and freedom of thought before us.', zh: '本期刊献给所有在我们之前追求真理和思想自由的前辈。' },

            philosophyTitle: { en: 'Our Philosophy', zh: '我们的理念' },
            philosophyText: { en: 'We believe in the power of rational discourse and free expression. HUM Journal provides a platform for ideas to be shared, debated, and evolved. We welcome diverse perspectives while maintaining a commitment to intellectual rigor and civil discourse.', zh: '我们相信理性对话和自由表达的力量。HUM 期刊为思想分享、辩论和发展提供平台。我们欢迎多元观点，同时坚持学术严谨和文明讨论。' },

            teamTitle: { en: 'Our Team', zh: '核心团队' },
            editorInChief: { en: 'Editor-in-Chief', zh: '主编' },
            initialReviewEditor: { en: 'Initial Review Editor', zh: '初审编辑' }
        },

        // Journal Info page
        journalInfo: {
            title: { en: 'Journal Information', zh: '期刊介绍' },
            subtitle: { en: 'About HUM Journal', zh: '关于 HUM 期刊' },

            publicTitle: { en: 'HUM-Public (Public Journal)', zh: 'HUM-大众刊（大众网刊）' },
            publicDesc: { en: 'HUM-Public is an open platform for free expression. We believe that every voice matters and that ideas should be shared freely. This section welcomes all viewpoints except those that are illegal, abusive, discriminatory, or intentionally provocative.', zh: 'HUM-大众刊是一个自由表达的开放平台。我们相信每个声音都很重要，思想应该自由分享。本板块欢迎所有观点，除了违法、辱骂、歧视或故意引战的内容。' },
            publicFeatures: { en: 'Key Features:', zh: '主要特点：' },
            publicFeature1: { en: 'Open submission - no barriers to entry', zh: '开放投稿 - 无门槛' },
            publicFeature2: { en: 'Free expression of ideas', zh: '思想自由表达' },
            publicFeature3: { en: 'Diverse perspectives welcome', zh: '欢迎多元观点' },
            publicFeature4: { en: 'Minimal content review (legality only)', zh: ' minimal审核（仅审核合法性）' },

            academicTitle: { en: 'HUM-Academic (Professional Journal)', zh: 'HUM-专业刊（专业网刊）' },
            academicDesc: { en: 'HUM-Academic focuses on scholarly contributions with emphasis on logical rigor and academic standards. This section serves as a foundation for future formal academic development and peer-reviewed research.', zh: 'HUM-专业刊专注于学术贡献，强调逻辑严谨和学术标准。本板块为未来正规学术发展和同行评审研究奠定基础。' },
            academicFeatures: { en: 'Key Features:', zh: '主要特点：' },
            academicFeature1: { en: 'Emphasis on logic and academic rigor', zh: '注重逻辑与学术规范' },
            academicFeature2: { en: 'Peer-reviewed scholarly contributions', zh: '同行评审学术贡献' },
            academicFeature3: { en: 'Structured academic format', zh: '规范的学术格式' },
            academicFeature4: { en: 'Foundation for formal development', zh: '为正规发展奠定基础' }
        },

        // Submission page
        submission: {
            title: { en: 'Submission Guidelines', zh: '投稿指南' },
            subtitle: { en: 'Submit Your Work', zh: '提交您的作品' },

            emailTitle: { en: 'Submission Email', zh: '投稿邮箱' },
            emailDesc: { en: 'Please send your submissions to the following email address:', zh: '请将您的稿件发送至以下邮箱：' },

            formatTitle: { en: 'Email Subject Format', zh: '邮件主题格式' },
            formatDesc: { en: 'Please use the following format for your email subject:', zh: '请使用以下格式作为邮件主题：' },
            formatExample: { en: '[HUM-Public] Article Title - Author Name', zh: '[HUM-Public] 文章标题 - 作者名' },
            formatExample2: { en: '[HUM-Academic] Article Title - Author Name', zh: '[HUM-Academic] 文章标题 - 作者名' },

            publicTitle: { en: 'HUM-Public Submissions', zh: '大众刊投稿' },
            publicDesc: { en: 'For HUM-Public, we welcome submissions in any format - essays, opinions, reflections, or creative writing. There are no strict format requirements. Simply share your thoughts.', zh: '对于大众刊，我们欢迎任何形式的投稿——随笔、观点、感悟或创意写作。没有严格的格式要求。分享您的想法即可。' },

            academicTitle: { en: 'HUM-Academic Submissions', zh: '专业刊投稿' },
            academicDesc: { en: 'For HUM-Academic, submissions should follow academic conventions including abstract, introduction, body, conclusion, and references. Logical rigor and proper citation are expected.', zh: '对于专业刊，投稿应遵循学术惯例，包括摘要、引言、正文、结论和参考文献。需要逻辑严谨和规范引用。' },

            noteTitle: { en: 'Note', zh: '注意' },
            noteDesc: { en: 'All submissions will be reviewed for legal compliance only. We do not censor ideas or viewpoints.', zh: '所有投稿仅会审核是否合法。我们不会审查思想或观点。' }
        },

        // Rules page
        rules: {
            title: { en: 'Review Rules', zh: '审核规则' },
            subtitle: { en: 'Our Review Policy', zh: '我们的审核政策' },

            introTitle: { en: 'Our Approach', zh: '我们的方式' },
            introDesc: { en: 'HUM Journal believes in the fundamental right to free expression. We take a minimal approach to content review, allowing the marketplace of ideas to flourish.', zh: 'HUM 期刊相信思想自由的基本权利。我们采取 minimal的审核方式，让思想市场蓬勃发展。' },

            allowedTitle: { en: 'What We Allow', zh: '我们允许的内容' },
            allowedDesc: { en: 'All viewpoints and opinions are welcome on HUM Journal. We believe that through open discourse, truth will emerge. We do not judge the merit of ideas - that is for readers to decide.', zh: 'HUM 期刊欢迎所有观点和意见。我们相信通过公开讨论，真理会浮现。我们不评判思想的价值——这由读者决定。' },

            prohibitedTitle: { en: 'What We Prohibit', zh: '我们禁止的内容' },
            prohibitedDesc: { en: 'While we believe in free expression, we must draw some boundaries to maintain a civil discourse. The following content is not allowed:', zh: '虽然我们相信言论自由，但为了维护文明的讨论，我们必须划定一些界限。以下内容不被允许：' },

            prohibited1: { en: 'Illegal content - content that violates laws or regulations', zh: '违法内容 - 违反法律法规的内容' },
            prohibited2: { en: 'Abusive content - personal attacks, harassment, or hate speech', zh: '辱骂内容 - 人身攻击、骚扰或仇恨言论' },
            prohibited3: { en: 'Discriminatory content - content that promotes discrimination based on race, gender, religion, etc.', zh: '歧视内容 - 基于种族、性别、宗教等 promote 歧视的内容' },
            prohibited4: { en: 'Provocative content - content designed solely to incite anger or conflict without constructive purpose', zh: '引战内容 - 纯粹为了激起愤怒或冲突而无建设性目的的内容' },

            noteTitle: { en: 'Important Note', zh: '重要说明' },
            noteDesc: { en: 'Beyond these boundaries, all perspectives are welcome. We do not require academic rigor for HUM-Public submissions, nor do we judge the quality or merit of any idea. Our role is to provide a platform, not to censor.', zh: '除了这些界限，所有观点都受欢迎。我们不要求大众刊的投稿具有学术严谨性，也不评判任何思想的质量或价值。我们的角色是提供平台，而非审查。' },

            appealTitle: { en: 'Appeals', zh: '申诉' },
            appealDesc: { en: 'If you believe your content was removed in error, you may contact us to appeal. We are committed to fair review processes.', zh: '如果您认为您的内容被错误删除，您可以联系我们申诉。我们致力于公平的审核流程。' }
        },

        // Public/Academic pages
        section: {
            publicTitle: { en: 'HUM-Public', zh: 'HUM-大众刊' },
            publicDesc: { en: 'Open publication without barriers. Free expression of ideas.', zh: '无门槛发表，观点自由。' },
            academicTitle: { en: 'HUM-Academic', zh: 'HUM-专业刊' },
            academicDesc: { en: 'Emphasis on logic and academic rigor.', zh: '注重逻辑与学术规范。' },
            allArticles: { en: 'All Articles', zh: '全部文章' },
            noArticles: { en: 'No articles in this section yet.', zh: '本板块暂无文章。' }
        },

        // Footer
        footer: {
            slogan: { en: '"Freedom of Thought, Rational Expression"', zh: '"思想自由，理性表达"' },
            copyright: { en: 'Copyright © 2026 Kyrgyz. All rights reserved.', zh: '版权所有 © 2026 Kyrgyz。保留所有权利。' }
        },

        // Common
        common: {
            readMore: { en: 'Read More', zh: '阅读更多' },
            by: { en: 'by', zh: '作者：' },
            viewArticle: { en: 'View Article', zh: '查看文章' }
        }
    };

    // Current language
    let currentLang = 'en';

    // Initialize language from localStorage or default to English
    function init() {
        const savedLang = localStorage.getItem('hum_journal_lang');
        if (savedLang && (savedLang === 'en' || savedLang === 'zh')) {
            currentLang = savedLang;
        } else {
            // Try to detect browser language
            const browserLang = navigator.language || navigator.userLanguage;
            if (browserLang.startsWith('zh')) {
                currentLang = 'zh';
            }
        }

        // Apply language on load
        document.addEventListener('DOMContentLoaded', function() {
            applyLanguage();
            updateLangButton();
        });
    }

    // Get translation
    function t(category, key) {
        try {
            if (TRANSLATIONS[category] && TRANSLATIONS[category][key]) {
                return TRANSLATIONS[category][key][currentLang] || TRANSLATIONS[category][key].en;
            }
            return key;
        } catch (e) {
            return key;
        }
    }

    // Apply language to page elements with data-i18n attribute
    function applyLanguage() {
        // Elements with data-i18n attribute
        document.querySelectorAll('[data-i18n]').forEach(function(el) {
            const keys = el.getAttribute('data-i18n').split('.');
            if (keys.length >= 2) {
                const translation = t(keys[0], keys[1]);
                if (translation) {
                    if (el.tagName === 'INPUT' && el.type === 'text') {
                        el.placeholder = translation;
                    } else {
                        el.innerHTML = translation;
                    }
                }
            }
        });

        // Elements with data-i18n-placeholder attribute
        document.querySelectorAll('[data-i18n-placeholder]').forEach(function(el) {
            const keys = el.getAttribute('data-i18n-placeholder').split('.');
            if (keys.length >= 2) {
                const translation = t(keys[0], keys[1]);
                if (translation) {
                    el.placeholder = translation;
                }
            }
        });

        // Store current language
        localStorage.setItem('hum_journal_lang', currentLang);

        // Update document lang attribute
        document.documentElement.lang = currentLang;
    }

    // Toggle language
    function toggleLanguage() {
        currentLang = currentLang === 'en' ? 'zh' : 'en';
        applyLanguage();
        updateLangButton();

        // Dispatch custom event for pages that need to update dynamically
        window.dispatchEvent(new CustomEvent('languageChanged', { detail: { lang: currentLang } }));
    }

    // Update language button text
    function updateLangButton() {
        const langBtn = document.getElementById('langToggle');
        if (langBtn) {
            langBtn.textContent = currentLang === 'en' ? '中文' : 'EN';
        }
    }

    // Create language toggle button HTML
    function createLangButton() {
        return '<button id="langToggle" onclick="HUM_LANG.toggle()" style="background:none;border:1px solid #0A2342;color:#0A2342;padding:0.25rem 0.75rem;cursor:pointer;font-size:0.875rem;margin-left:1rem;border-radius:3px;">' + (currentLang === 'en' ? '中文' : 'EN') + '</button>';
    }

    // Expose API
    window.HUM_LANG = {
        t: t,
        toggle: toggleLanguage,
        getLang: function() { return currentLang; },
        setLang: function(lang) {
            if (lang === 'en' || lang === 'zh') {
                currentLang = lang;
                applyLanguage();
                updateLangButton();
            }
        },
        createLangButton: createLangButton
    };

    // Initialize
    init();
})();
