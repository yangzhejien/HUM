/**
 * HUM Journal - Main JavaScript
 * Minimalist Academic Style
 */

(function() {
    'use strict';

    // Language Toggle
    const langToggle = document.querySelectorAll('.lang-toggle span');
    let currentLang = 'en';

    function setLanguage(lang) {
        currentLang = lang;

        // Update toggle buttons
        langToggle.forEach(btn => {
            if (btn.dataset.lang === lang) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Update all translatable elements
        document.querySelectorAll('[data-en][data-cn]').forEach(el => {
            const text = el.dataset[lang];
            if (text) {
                // Handle elements with both English and Chinese
                if (el.tagName === 'SPAN' && el.parentElement && el.parentElement.querySelector) {
                    // Check if this is a mixed language element
                    const parent = el.parentElement;
                    if (parent && parent.innerHTML.includes('</span>')) {
                        // Already has mixed content, update only the span
                        el.textContent = text;
                    }
                } else {
                    el.textContent = text;
                }
            }
        });

        // Update page title and meta
        updatePageContent(lang);

        // Save preference
        localStorage.setItem('hum-journal-lang', lang);
    }

    function updatePageContent(lang) {
        // Update document title
        const titles = {
            'index': { en: 'HUM Journal | Humanity & Thought Journal', cn: 'HUM Journal | 人文与思想期刊' },
            'about': { en: 'About Us | HUM Journal', cn: '关于我们 | HUM Journal' },
            'introduction': { en: 'Journal Introduction | HUM Journal', cn: '期刊介绍 | HUM Journal' },
            'submission': { en: 'Submission Guidelines | HUM Journal', cn: '投稿指南 | HUM Journal' },
            'review': { en: 'Review Rules | HUM Journal', cn: '审核规则 | HUM Journal' }
        };

        // Get current page
        const path = window.location.pathname;
        let page = 'index';
        if (path.includes('about')) page = 'about';
        else if (path.includes('introduction')) page = 'introduction';
        else if (path.includes('submission')) page = 'submission';
        else if (path.includes('review')) page = 'review';

        document.title = titles[page][lang];
    }

    // Language toggle event listeners
    langToggle.forEach(btn => {
        btn.addEventListener('click', () => {
            setLanguage(btn.dataset.lang);
        });
    });

    // Load saved language preference
    const savedLang = localStorage.getItem('hum-journal-lang');
    if (savedLang) {
        setLanguage(savedLang);
    }

    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const nav = document.querySelector('.nav');

    if (mobileMenuBtn && nav) {
        mobileMenuBtn.addEventListener('click', () => {
            nav.classList.toggle('active');
            mobileMenuBtn.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                nav.classList.remove('active');
                mobileMenuBtn.classList.remove('active');
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href !== '#') {
                e.preventDefault();
                const target = document.querySelector(href);
                if (target) {
                    target.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
        });
    });

    // Add active class to current nav link
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        const linkPage = link.getAttribute('href');
        if (linkPage === currentPage || (currentPage === '' && linkPage === 'index.html')) {
            link.classList.add('active');
        }
    });

    // Intersection Observer for animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-fade-in');
            }
        });
    }, observerOptions);

    // Observe elements that should animate
    document.querySelectorAll('.section-card, .team-card, .philosophy-item, .intro-block').forEach(el => {
        el.style.opacity = '0';
        observer.observe(el);
    });

    // Add animation class dynamically
    const style = document.createElement('style');
    style.textContent = `
        .animate-fade-in {
            animation: fadeIn 0.6s ease forwards;
        }
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);

})();
