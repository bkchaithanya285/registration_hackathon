import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';

const Landing = () => {
    const navigate = useNavigate();
    const [stats, setStats] = useState({ totalTeams: 0, isRegistrationOpen: true });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/teams/stats')
            .then(res => {
                setStats(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const isRegistrationOpen = stats.isRegistrationOpen;

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden bg-light-bg">
            {/* Background Animations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
                <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float"></div>
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-secondary/20 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="z-10 text-center max-w-4xl w-full">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8 }}
                >
                    <h1 className="text-5xl md:text-7xl font-bold mb-0 tracking-tight">
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-secondary to-accent">
                            CreateX
                        </span>
                    </h1>
                    <p className="text-xl md:text-2xl font-light tracking-[0.5em] text-slate-400 uppercase mb-6">
                        Launch Edition
                    </p>

                    <p className="text-sm md:text-base text-slate-500 font-bold uppercase tracking-widest mb-2">
                        The Biggest Collaboration of KARE
                    </p>
                    <p className="text-xl md:text-3xl font-extrabold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
                        CSI × OWASP × CYBERNERDS
                    </p>


                    {/* Event Details */}
                    <div className="flex flex-wrap justify-center gap-8 mb-12">
                        <div className="text-center px-8 py-6 bg-white rounded-2xl shadow-lg border-t-4 border-primary transform hover:-translate-y-1 transition-transform duration-300">
                            <h3 className="text-xs font-extrabold text-primary uppercase tracking-widest mb-2">Duration</h3>
                            <p className="text-4xl font-extrabold text-slate-800">24 Hours</p>
                        </div>
                        <div className="text-center px-8 py-6 bg-white rounded-2xl shadow-lg border-t-4 border-secondary transform hover:-translate-y-1 transition-transform duration-300">
                            <h3 className="text-xs font-extrabold text-secondary uppercase tracking-widest mb-2">Registration Fee</h3>
                            <p className="text-4xl font-extrabold text-slate-800">₹350 <span className="text-sm text-slate-500 font-bold">/ head</span></p>
                        </div>
                    </div>

                    <div className="mb-10">
                        <h2 className="text-2xl font-bold mb-4 text-primary">Registration Status</h2>
                        {loading ? (
                            <p className="text-gray-400 animate-pulse">Checking status...</p>
                        ) : isRegistrationOpen ? (
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                            >
                                <p className="text-sm text-light-subtext mb-3 font-semibold">{stats.totalTeams} out of {stats.limit} teams registered</p>
                                <div className="w-full bg-gray-200 rounded-full h-2 mb-4 overflow-hidden">
                                    <motion.div
                                        className="bg-gradient-to-r from-secondary to-accent h-full"
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(stats.totalTeams / stats.limit) * 100}%` }}
                                        transition={{ duration: 0.8, ease: "easeOut" }}
                                    />
                                </div>
                                <span className="status-badge status-open">
                                    ✓ Open - Slots Available
                                </span>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{ scale: 1 }}
                            >
                                <p className="text-sm text-light-subtext mb-3 font-semibold">{stats.totalTeams} out of {stats.limit} teams registered</p>
                                <span className="status-badge status-closed">
                                    Registration Closed - Limit Reached
                                </span>
                            </motion.div>
                        )}
                    </div>

                    <div className="flex flex-col md:flex-row gap-6 justify-center items-center">
                        {isRegistrationOpen ? (
                            <button
                                onClick={() => navigate('/register')}
                                className="btn-primary flex items-center gap-2 group shadow-lg shadow-primary/25"
                            >
                                Register Now
                                <span className="group-hover:translate-x-1 transition-transform">→</span>
                            </button>
                        ) : (
                            <button disabled className="px-8 py-4 rounded-xl bg-gray-200 text-gray-400 font-bold cursor-not-allowed">
                                Registration Closed
                            </button>
                        )}

                        <button
                            onClick={() => navigate('/status')}
                            className="btn-secondary flex items-center gap-2 group shadow-lg shadow-secondary/25"
                        >
                            Check Payment Status
                            <span className="group-hover:translate-x-1 transition-transform">→</span>
                        </button>
                    </div>
                </motion.div>
            </div>

            <footer className="absolute bottom-6 text-light-subtext/60 text-sm font-medium">
                © {new Date().getFullYear()} CreateX. All rights reserved.
            </footer>
        </div>
    );
};

export default Landing;
