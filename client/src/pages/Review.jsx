import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { yearToRoman } from '../utils/romanNumerals';
import api from '../api';

const Review = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const data = state?.registrationData;

    if (!data) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-red-400">No data found. Please register first, redirecting...</p>
                {/* Auto redirect or link */}
                <button onClick={() => navigate('/register')} className="text-secondary ml-2 underline">Go to Register</button>
            </div>
        );
    }

    const { teamName, leader, members } = data;

    const handleConfirm = async () => {
        try {
            const res = await api.get('/teams/stats');
            if (res.data.isRegistrationOpen === false) {
                alert('Registration has just closed! Limit reached.');
                navigate('/');
                return;
            }
            navigate('/payment', { state: { registrationData: data } });
        } catch (err) {
            console.error(err);
            // If check fails, maybe let them proceed or allow retry? 
            // Better to let them try to avoid blocking if just network glitch
            navigate('/payment', { state: { registrationData: data } });
        }
    };

    const handleEdit = () => {
        navigate('/register', { state: { registrationData: data, isEditing: true } });
    };

    return (
        <div className="min-h-screen p-4 md:p-8 flex justify-center bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card max-w-5xl w-full"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-primary via-secondary to-accent p-6 md:p-8 text-white">
                    <h2 className="text-3xl md:text-4xl font-bold mb-2">Review Your Registration</h2>
                    <p className="text-white/90">Verify all details before proceeding to payment</p>
                </div>

                {/* Content */}
                <div className="p-6 md:p-8 space-y-6">
                    {/* Team Name Card */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="bg-gradient-to-r from-primary/10 to-primary/5 border-2 border-primary/20 rounded-xl p-4"
                    >
                        <p className="text-primary text-xs uppercase font-bold tracking-wider mb-2">Team Name</p>
                        <p className="text-3xl font-bold text-slate-800">{teamName}</p>
                    </motion.div>

                    {/* Team Lead */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="border-2 border-secondary/20 rounded-xl p-6"
                    >
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-secondary rounded-full"></span>
                            Team Lead
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 text-sm">
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-400 text-xs font-bold uppercase">Name</p>
                                <p className="text-slate-800 font-semibold mt-1">{leader.name}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-400 text-xs font-bold uppercase">Reg. No</p>
                                <p className="text-slate-800 font-semibold mt-1 font-mono">{leader.registerNumber}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-400 text-xs font-bold uppercase">Mobile</p>
                                <p className="text-slate-800 font-semibold mt-1">{leader.mobileNumber}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-400 text-xs font-bold uppercase">Year</p>
                                <p className="text-slate-800 font-semibold mt-1">{yearToRoman(leader.yearOfStudy)}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-400 text-xs font-bold uppercase">Email</p>
                                <p className="text-slate-800 font-semibold mt-1 text-xs break-all">{leader.email}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-400 text-xs font-bold uppercase">Dept</p>
                                <p className="text-slate-800 font-semibold mt-1 text-xs">{leader.department}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-400 text-xs font-bold uppercase">Contact Email</p>
                                <p className="text-slate-800 font-semibold mt-1 text-xs break-all">{leader.teamLeadEmail}</p>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-lg">
                                <p className="text-slate-400 text-xs font-bold uppercase">Status</p>
                                <span className={`inline-block mt-1 px-2 py-1 rounded text-xs font-bold ${leader.isHosteler ? 'bg-accent/20 text-accent' : 'bg-secondary/20 text-secondary'}`}>
                                    {leader.isHosteler ? 'Hosteler' : 'Day Scholar'}
                                </span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Team Members */}
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="border-2 border-accent/20 rounded-xl p-6"
                    >
                        <h3 className="text-lg font-bold text-slate-800 uppercase tracking-wide mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-accent rounded-full"></span>
                            Team Members ({members.length})
                        </h3>
                        <div className="space-y-3">
                            {members.map((member, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: 0.2 + 0.05 * idx }}
                                    className="bg-gradient-to-r from-accent/5 to-transparent border-l-4 border-accent p-4 rounded-lg"
                                >
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className="bg-accent text-white text-xs font-bold px-2 py-1 rounded-full">M{idx + 1}</span>
                                        <p className="font-bold text-slate-800">{member.name}</p>
                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded font-mono">{member.registerNumber}</span>
                                    </div>
                                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-slate-600">
                                        <div><span className="font-bold">Mobile:</span> {member.mobileNumber}</div>
                                        <div><span className="font-bold">Gender:</span> {member.gender}</div>
                                        <div><span className="font-bold">Year:</span> {yearToRoman(member.yearOfStudy)}</div>
                                        <div><span className="font-bold">Dept:</span> {member.department}</div>
                                        <div><span className="font-bold">{member.isHosteler ? 'Hosteler' : 'Day Scholar'}</span></div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Payment Summary */}
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.25 }}
                        className="bg-gradient-to-r from-primary to-secondary text-white rounded-xl p-6 shadow-lg"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-white/90 text-sm uppercase font-bold tracking-wider mb-1">Total Registration Fee</p>
                                <p className="text-4xl font-bold">₹1750</p>
                                <p className="text-white/80 text-xs mt-1">5 Participants (1 Lead + 4 Members)</p>
                            </div>
                            <div className="text-right">
                                <p className="text-white/90 text-xs uppercase font-bold tracking-wider mb-2">Amount per head</p>
                                <p className="text-3xl font-bold">₹350</p>
                            </div>
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleEdit}
                            className="flex-1 btn-secondary py-3 rounded-lg font-bold uppercase tracking-wide"
                        >
                            ← Back to Edit
                        </motion.button>
                        <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleConfirm}
                            className="flex-1 btn-primary py-3 rounded-lg font-bold uppercase tracking-wide"
                        >
                            Proceed to Payment →
                        </motion.button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default Review;
