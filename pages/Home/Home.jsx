import React, { useEffect } from 'react';
import '../../src/App.css';
import Header from "../../components/Header.jsx";
import Hero from "./Hero-section.jsx";
import LifeSkill from "./LifeSkills.jsx";
import Whoisthisfor from "./Whoisthisfor.jsx";
import Services from "./Services.jsx";
import ExploreCourses from "./Explorecourses.jsx";
import Footer from "../../components/Footer.jsx";
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
    const { user, profile, loading } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (!loading && user && profile) {
            // Redirect based on user role
            if (profile.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        }
    }, [user, profile, loading, navigate]);

    // Show loading screen while checking authentication
    if (loading) {
        return (
            <div style={{
                minHeight: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)'
            }}>
                <div style={{ textAlign: 'center' }}>
                    <div style={{ 
                        fontSize: '64px', 
                        marginBottom: '16px',
                        animation: 'fadeIn 1s ease-in-out'
                    }}>
                        🎓
                    </div>
                    <p style={{ 
                        color: '#666', 
                        fontSize: '18px',
                        margin: 0
                    }}>
                        Preparing your learning journey...
                    </p>
                </div>
            </div>
        );
    }

    // Show your existing home page for non-authenticated users
    return (
        <>
            <Header />
            <Hero />
            <LifeSkill />
            <Whoisthisfor />
            <Services />
            <ExploreCourses />
            <Footer />
        </>
    );
}