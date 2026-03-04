import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import imageCompression from 'browser-image-compression';

const Payment = () => {
    const { state } = useLocation();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [utr, setUtr] = useState('');
    const [file, setFile] = useState(null);
    const [paymentSettings, setPaymentSettings] = useState({ qrCodeUrl: null, upiId: null });
    const [settingsLoading, setSettingsLoading] = useState(true);

    useEffect(() => {
        if (!state?.teamId) {
            navigate('/register');
        }
    }, [state, navigate]);

    // Timer logic removed as per user request

    // Fetch payment settings (QR code and UPI ID) from admin
    useEffect(() => {
        const fetchPaymentSettings = async () => {
            try {
                const response = await api.get('/teams/payment-settings');
                setPaymentSettings(response.data);
                console.log('Payment settings fetched:', response.data);
            } catch (err) {
                console.error('Error fetching payment settings:', err);
                // Settings are optional, continue without them
                setPaymentSettings({ qrCodeUrl: null, upiId: null });
            } finally {
                setSettingsLoading(false);
            }
        };
        fetchPaymentSettings();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file || !utr) {
            toast.error('Please provide both UTR and Screenshot');
            return;
        }

        setLoading(true);

        try {
            // Compress the image before uploading to make it feel absolutely instant
            const options = {
                maxSizeMB: 0.5,
                maxWidthOrHeight: 1024,
                useWebWorker: true,
            };

            const compressedFile = await imageCompression(file, options);

            const formData = new FormData();

            // Append JSON data
            formData.append('teamId', state.teamId);
            formData.append('utr', utr);
            formData.append('screenshot', compressedFile, compressedFile.name);

            const res = await api.post('/teams/register', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            navigate('/success', { state: { teamId: res.data.teamId } });
        } catch (err) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen p-8 flex items-center justify-center">
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card max-w-lg w-full p-8"
            >
                <h2 className="text-4xl font-bold mb-2 text-center bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Payment</h2>
                <p className="text-center text-primary/60 mb-6">Complete your registration</p>

                <motion.div
                    initial={{ y: 10, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="bg-red-50 border-l-4 border-red-500 p-4 mb-6 rounded-r-lg shadow-sm"
                >
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-red-600 text-lg">🚨</span>
                        <p className="text-red-700 text-sm font-bold uppercase tracking-widest">Strict Notice</p>
                    </div>
                    <p className="text-red-700 text-sm font-semibold mb-2">
                        Pay the EXACT amount of <span className="text-lg font-bold">₹1750</span>. Do not double pay!
                    </p>
                    <p className="text-red-600 text-xs font-medium leading-relaxed">
                        Wrong payments or fake payments will face severe action, and this can lead to EMRGC escalation and immediate suspension.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ scale: 0.95 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 }}
                    className="card-primary p-6 mb-8 text-center"
                >
                    {/* QR Code - Display if available */}
                    <div className="w-48 h-48 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center text-primary/40 mb-4 rounded-lg border-2 border-dashed border-primary/30 mx-auto overflow-hidden">
                        {settingsLoading ? (
                            <div className="text-center">
                                <p className="text-sm font-semibold">Loading...</p>
                            </div>
                        ) : paymentSettings.qrCodeUrl ? (
                            <img
                                src={paymentSettings.qrCodeUrl}
                                alt="Payment QR Code"
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="text-center">
                                <p className="text-sm font-semibold">📱 QR Code</p>
                                <p className="text-xs mt-1">Scan to Pay</p>
                            </div>
                        )}
                    </div>

                    {/* UPI ID - Display if available */}
                    <p className="font-bold text-slate-800 text-lg">UPI ID</p>
                    <p className="text-primary font-mono text-sm mb-4">
                        {paymentSettings.upiId || 'example@upi'}
                    </p>

                    {/* UPI button removed as per request */}

                    <div className="border-t border-primary/20 pt-4">
                        <p className="text-gray-400 text-xs uppercase tracking-widest">Total Amount</p>
                        <p className="text-6xl font-extrabold text-primary mb-2">₹1750</p>
                        <p className="text-sm font-semibold text-primary/80 mt-1">5 Participants × ₹350</p>
                    </div>
                </motion.div>

                <motion.form
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    onSubmit={handleSubmit}
                    className="space-y-4"
                >
                    <div>
                        <label className="text-sm font-semibold text-primary uppercase tracking-wide">Transaction ID (UTR)</label>
                        <input
                            value={utr}
                            onChange={(e) => setUtr(e.target.value)}
                            className="input-field"
                            placeholder="Enter 12 digit UTR from your payment"
                            required
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-primary uppercase tracking-wide">Payment Screenshot</label>
                        <div className="relative">
                            <div className="border-2 border-dashed border-primary/40 rounded-lg p-6 hover:border-primary/60 transition-all duration-300 hover:bg-primary/5 cursor-pointer">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    required
                                />
                                <div className="text-center pointer-events-none">
                                    {file ? (
                                        <div className="space-y-3">
                                            <p className="text-2xl">📸</p>
                                            <p className="text-primary font-semibold text-sm">{file.name}</p>
                                            <p className="text-xs text-primary/60">Click to change screenshot</p>
                                            {/* Preview Thumbnail */}
                                            <div className="mt-3 flex justify-center">
                                                <img
                                                    src={URL.createObjectURL(file)}
                                                    alt="Preview"
                                                    className="max-h-40 max-w-full rounded-lg border border-primary/30 shadow-md"
                                                />
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <p className="text-3xl">📸</p>
                                            <p className="text-primary font-semibold">Drop screenshot here</p>
                                            <p className="text-xs text-primary/60">or click to select file</p>
                                            <p className="text-xs text-primary/50 mt-3">Supports: JPG, PNG, JPEG, GIF, WebP</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {file && (
                                <div className="mt-3 flex items-center gap-2">
                                    <span className="text-secondary text-sm font-medium">✓ Screenshot ready for upload</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="btn-primary w-full flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <motion.span
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 1, repeat: Infinity }}
                                    className="border-2 border-white border-t-transparent rounded-full h-4 w-4"
                                />
                                Processing...
                            </>
                        ) : (
                            <>💳 Complete Registration</>
                        )}
                    </motion.button>
                </motion.form>
            </motion.div>
        </div>
    );
};

export default Payment;
