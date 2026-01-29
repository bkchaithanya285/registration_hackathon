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
                    filename = 'genesis_summary.csv';
                    break;
                case 'all-details':
                    endpoint = '/teams/admin/export/all-details';
                    filename = `genesis_all_details_${new Date().toISOString().split('T')[0]}.csv`;
                    break;
                case 'screenshot':
                    endpoint = '/teams/admin/export/screenshot-details';
                    filename = `genesis_screenshot_details_${new Date().toISOString().split('T')[0]}.csv`;
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

                <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-6">
                    {exportOptions.map((option, idx) => (
                        <motion.div
                            key={option.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 * (idx + 1) }}
                        >
                            <div className={`glass-card p-8 h-full flex flex-col bg-gradient-to-br ${option.color} bg-opacity-10`}>
                                <div className="flex-1">
                                    <h3 className="text-2xl font-bold mb-2 text-slate-800">{option.title}</h3>
                                    <p className="text-slate-600 text-sm mb-4 font-semibold">{option.description}</p>
                                    <div className="bg-white/40 p-4 rounded-lg mb-6 border border-white/50 shadow-sm">
                                        <p className="text-slate-700 text-xs font-medium">{option.details}</p>
                                    </div>
                                </div>

                                <motion.button
                                    onClick={() => handleExport(option.id)}
                                    disabled={loading === option.id}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading === option.id ? (
                                        <>
                                            <motion.span
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity }}
                                                className="inline-block border-2 border-white border-t-transparent rounded-full h-4 w-4"
                                            />
                                            <span>Exporting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                                            </svg>
                                            <span>Download CSV</span>
                                        </>
                                    )}
                                </motion.button>
                            </div>
                        </motion.div>
                    ))}
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="card-secondary p-8 mt-12"
                >
                    <h3 className="text-2xl font-bold mb-4 text-secondary">📥 Export Information</h3>
                    <div className="space-y-4">
                        <div className="flex gap-4">
                            <span className="text-secondary text-2xl">📊</span>
                            <div className='p-2'>
                                <p className="font-semibold text-slate-800">Summary Export</p>
                                <p className="text-slate-600 text-sm">Quick reference for team registration status and payment information.</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-secondary text-2xl">📋</span>
                            <div>
                                <p className="font-semibold text-slate-800">Complete Details</p>
                                <p className="text-slate-600 text-sm">Comprehensive data including all participant details (email, phone, department, year of study, accommodation status, etc.)</p>
                            </div>
                        </div>
                        <div className="flex gap-4">
                            <span className="text-secondary text-2xl">📸</span>
                            <div>
                                <p className="font-semibold text-slate-800">Payment Screenshots</p>
                                <p className="text-slate-600 text-sm">Payment proof references and screenshot URLs for verification purposes.</p>
                            </div>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
};

export default Export;
