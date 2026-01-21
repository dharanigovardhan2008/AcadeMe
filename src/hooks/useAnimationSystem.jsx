import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const useAnimationSystem = () => {
    const location = useLocation();

    useEffect(() => {
        // 1. SCROLL REVEAL OBSERVER
        const observerOptions = {
            root: null,
            rootMargin: '0px 0px -50px 0px', // Trigger slightly before element is in view
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('is-visible');
                    observer.unobserve(entry.target); // Only animate once
                }
            });
        }, observerOptions);

        const scrollElements = document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right, .reveal-scale');
        scrollElements.forEach(el => observer.observe(el));

        // 2. 3D CARD TILT LOGIC
        const cards = document.querySelectorAll('.card-3d');
        const handleMouseMove = (e) => {
            const card = e.currentTarget;
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const centerX = rect.width / 2;
            const centerY = rect.height / 2;
            
            // Max rotation 10 degrees
            const rotateX = ((y - centerY) / centerY) * -10; 
            const rotateY = ((x - centerX) / centerX) * 10;

            card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
        };

        const handleMouseLeave = (e) => {
            e.currentTarget.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
        };

        cards.forEach(card => {
            card.addEventListener('mousemove', handleMouseMove);
            card.addEventListener('mouseleave', handleMouseLeave);
        });

        // 3. CLEANUP
        return () => {
            observer.disconnect();
            cards.forEach(card => {
                card.removeEventListener('mousemove', handleMouseMove);
                card.removeEventListener('mouseleave', handleMouseLeave);
            });
        };

    }, [location.pathname]); // Re-run whenever route changes
};

export default useAnimationSystem;
