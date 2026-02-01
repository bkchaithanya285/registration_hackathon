import { useState } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

const Export = () => {
    const [loading, setLoading] = useState(null);

    const handleExport = async (type) => {
        setLoading(type);
        try {
            let endpoint = '';
            let filename = '';

            switch (type) {
                // 'basic' case removed as it's no longer used
                case 'all-details':
                    endpoint = '/teams/admin/export/all-details';
                    filename = `createx_all_details_${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                case 'screenshot':
                    endpoint = '/teams/admin/export/screenshot-details';
                    filename = `createx_screenshot_details_${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                default:
                    return;
            }

            const response = await api.get(endpoint, {
                responseType: 'blob',
            });

            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Export successful!');
        } catch (err) {
            toast.error('Export failed');
            console.error(err);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className="min-h-screen p-8">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-5xl mx-auto"
            >
                <h2 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">
                    Export Registration Data
                </h2>
                <p className="text-primary/60 mb-12">Download registration data in CSV format</p>

                <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
                    {/* Option 1: All Team Data */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-10 flex flex-col items-center text-center hover:bg-white/5 transition-colors border border-white/20"
                    >
                        <div className="bg-primary/20 p-6 rounded-full mb-6">
                            <span className="text-4xl">📋</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white">All Team Data</h3>
                        <p className="text-slate-400 mb-8">Export complete CSV with Lead Details, All Members, and Payment Info.</p>

                        <motion.button
                            onClick={() => handleExport('all-details')}
                            disabled={loading === 'all-details'}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-primary w-full py-3 text-lg flex items-center justify-center gap-2"
                        >
                            {loading === 'all-details' ? (
                                <span className="loader"></span>
                            ) : (
                                <>Download Data CSV</>
                            )}
                        </motion.button>
                    </motion.div>

                    {/* Option 2: Payment Screenshots */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-10 flex flex-col items-center text-center hover:bg-white/5 transition-colors border border-white/20"
                    >
                        <div className="bg-accent/20 p-6 rounded-full mb-6">
                            <span className="text-4xl">📸</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white">Payment Proofs</h3>
                        <p className="text-slate-400 mb-8">Export simplified CSV with Team ID, Team Name, and Screenshot URL.</p>

                        <motion.button
                            onClick={() => handleExport('screenshot')}
                            disabled={loading === 'screenshot'}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="bg-accent hover:bg-accent-dark text-black font-bold py-3 px-6 rounded-lg w-full text-lg flex items-center justify-center gap-2 transition-all"
                        >
                            {loading === 'screenshot' ? (
                                <span className="loader"></span>
                            ) : (
                                <>Download Proofs CSV</>
                            )}
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Export;
