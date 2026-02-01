import { useState } from 'react';
import api from '../api';
import { motion } from 'framer-motion';

const CheckStatus = () => {
    const [formData, setFormData] = useState({ teamId: '', registerNumber: '' });
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        try {
            const res = await api.get('/teams/status', { params: formData });
            setResult(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error checking status');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4">
            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="glass-card max-w-md w-full p-8"
            >
                <h2 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Check Status</h2>
                <p className="text-light-subtext mb-6 font-medium">Track your registration</p>

                <motion.form
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div>
                        <label className="text-sm font-bold text-primary uppercase tracking-wide block mb-2">Team ID</label>
                        <input
                            placeholder="e.g. CREATOR-042"
                            className="input-field"
                            value={formData.teamId}
                            onChange={(e) => setFormData({ ...formData, teamId: e.target.value })}
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-bold text-primary uppercase tracking-wide block mb-2">Team Lead Register Number</label>
                        <input
                            placeholder="e.g. 40110XXX"
                            className="input-field"
                            value={formData.registerNumber}
                            onChange={(e) => setFormData({ ...formData, registerNumber: e.target.value })}
                            required
                        />
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Checking...' : 'Check Status'}
                    </motion.button>
                </motion.form>

                {error && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30"
                    >
                        <p className="text-red-600 text-center font-bold px-2">{error}</p>
                    </motion.div>
                )}

                {result && (
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="mt-6 space-y-4"
                    >
                        <div className="card-primary p-6 text-center">
                            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">Status</p>
                            <p className={`text-3xl font-bold uppercase tracking-wider ${result.status === 'Verified' ? 'text-secondary' :
                                result.status === 'Rejected' ? 'text-red-600' :
                                    'text-accent'
                                }`}>
                                {result.status}
                            </p>
                        </div>

                        {result.reason && (
                            <div className="card-secondary p-4">
                                <p className="text-secondary text-xs uppercase tracking-widest font-bold mb-1">Reason</p>
                                <p className="text-red-600 text-sm font-semibold">{result.reason}</p>
                            </div>
                        )}

                        {result.status === 'Verified' && (
                            <div className="bg-secondary/10 border border-secondary/30 p-4 rounded-lg text-center mb-4">
                                <p className="text-secondary font-semibold">Your payment is verified!</p>
                                <p className="text-secondary/60 text-xs mt-1">You will receive a confirmation email shortly.</p>
                            </div>
                        )}

                        {result.status === 'Verified' && (
                            <div className="bg-green-50 border-2 border-green-300 p-6 rounded-lg">
                                <p className="text-green-700 text-xs uppercase tracking-widest font-bold mb-4 text-center">Join Our WhatsApp Group</p>

                                <div className="bg-red-50 border-l-4 border-red-500 p-3 mb-4 rounded">
                                    <p className="text-red-700 text-xs font-bold uppercase tracking-wide mb-1">Important Notice</p>
                                    <p className="text-red-600 text-sm">Joining the WhatsApp group is compulsory for event updates and important announcements.</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex justify-center">
                                        <a
                                            href="https://chat.whatsapp.com/J9FBRwUSbNwERWUDTApVgV?mode=gi_t"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="bg-white p-3 rounded-lg border-2 border-green-400 cursor-pointer hover:shadow-xl hover:border-green-600 transition transform hover:scale-105 shadow-lg"
                                        >
                                            <img
                                                src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://chat.whatsapp.com/J9FBRwUSbNwERWUDTApVgV?mode=gi_t"
                                                alt="WhatsApp Group QR Code"
                                                className="w-36 h-36 object-contain"
                                            />
                                        </a>
                                    </div>
                                    <a
                                        href="https://chat.whatsapp.com/J9FBRwUSbNwERWUDTApVgV?mode=gi_t"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="block w-full bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-center transition transform active:scale-95 shadow-lg text-sm"
                                    >
                                        Join WhatsApp Group
                                    </a>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
};

export default CheckStatus;
