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
                case 'basic':
                    endpoint = '/teams/admin/export';
                    filename = 'createx_summary.csv';
                    break;
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

    const exportOptions = [
        {
            id: 'basic',
            title: '📊 Summary Export',
            description: 'Team Code, Name, Payment Status',
            details: 'Quick overview of all teams',
            color: 'from-primary to-primary-dark'
        },
        {
            id: 'all-details',
            title: '📋 Complete Details',
            description: 'All participant info (Name, Email, Phone, Dept, Year, etc.)',
            details: 'Full registration data for each member',
            color: 'from-secondary to-secondary-dark'
        },
        {
            id: 'screenshot',
            title: '📸 Payment Screenshots',
            description: 'Team Code, Name, Screenshot Links',
            details: 'Payment proof and verification details',
            color: 'from-accent to-amber-600'
        }
    ];

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

                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Option 1: Whole Data */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 }}
                        className="glass-card p-10 flex flex-col items-center text-center hover:bg-white/5 transition-colors border border-white/20"
                    >
                        <div className="bg-primary/20 p-6 rounded-full mb-6">
                            <span className="text-4xl">📋</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white">All Details</h3>
                        <p className="text-slate-400 mb-8">Export complete details of all teams and members including payments.</p>

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
                                <>Download CSV</>
                            )}
                        </motion.button>
                    </motion.div>

                    {/* Option 2: Team ID, Name, QR */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass-card p-10 flex flex-col items-center text-center hover:bg-white/5 transition-colors border border-white/20"
                    >
                        <div className="bg-accent/20 p-6 rounded-full mb-6">
                            <span className="text-4xl">📸</span>
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white">Screenshots Details</h3>
                        <p className="text-slate-400 mb-8">Export a simplified list containing only Team ID, Name, and Payment Screenshots.</p>

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
                                <>Download CSV</>
                            )}
                        </motion.button>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Export;
