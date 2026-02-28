import { useLocation, Link } from 'react-router-dom';
import React from 'react';
import { motion } from 'framer-motion';

const Success = () => {
    const { state } = useLocation();

    // Clear the auto-save draft upon reaching the success page
    React.useEffect(() => {
        localStorage.removeItem('hack_registration_draft');
    }, []);

    if (!state?.teamId) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Link to="/" className="text-primary underline font-semibold">← Go Home</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-primary/5 via-accent/5 to-secondary/5">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="glass-card max-w-4xl w-full"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-secondary via-primary to-accent p-8 text-white text-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring" }}
                        className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur"
                    >
                        <motion.svg
                            className="w-10 h-10 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            initial={{ scale: 0, rotate: -180 }}
                            animate={{ scale: 1, rotate: 0 }}
                            transition={{ delay: 0.4, type: "spring" }}
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                        </motion.svg>
                    </motion.div>
                    <motion.h1
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-4xl font-bold mb-2"
                    >
                        Registration Successful!
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.4 }}
                        className="text-white/90 text-lg"
                    >
                        Your team is registered for CreateX: Launch Edition
                    </motion.p>
                </div>

                {/* Content */}
                <div className="p-8 space-y-6">
                    {/* Info Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-4"
                    >
                        <div className="card-primary p-5 rounded-xl border-2 border-primary/20">
                            <p className="text-primary text-xs uppercase tracking-widest font-bold mb-2">Team ID</p>
                            <p className="text-2xl font-mono text-slate-800 font-bold tracking-wider">{state.teamId}</p>
                            <p className="text-xs text-slate-500 mt-3 font-medium">✓ Save for reference</p>
                        </div>
                        <div className="card-secondary p-5 rounded-xl border-2 border-secondary/20">
                            <p className="text-secondary text-xs uppercase tracking-widest font-bold mb-2">✓ Confirmation Email</p>
                            <p className="text-xl font-bold text-secondary">Sent</p>
                            <p className="text-xs text-slate-500 mt-3 font-medium">Check inbox & spam</p>
                        </div>
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 border-2 border-orange-300 p-5 rounded-xl">
                            <p className="text-orange-700 text-xs uppercase tracking-widest font-bold mb-2">⏱ Payment Status</p>
                            <p className="text-xl font-bold text-orange-700">Pending</p>
                            <p className="text-xs text-orange-600 mt-3 font-medium">Verification within 24hrs</p>
                        </div>
                    </motion.div>

                    {/* Payment Verification Instructions */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 p-6 rounded-xl"
                    >
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <span className="text-purple-600 font-bold text-lg">📝</span>
                                <div>
                                    <p className="text-purple-700 font-bold text-sm uppercase tracking-wide mb-1">Note Your Team ID</p>
                                    <p className="text-purple-600 text-sm">
                                        <strong className="font-bold">{state.teamId}</strong> will be needed to check your payment verification status. Keep it safe!
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <span className="text-purple-600 font-bold text-lg">⏳</span>
                                <div>
                                    <p className="text-purple-700 font-bold text-sm uppercase tracking-wide mb-1">Verification Timeline</p>
                                    <p className="text-purple-600 text-sm">Payment verification will be completed within <strong className="font-bold text-purple-700">24 hours</strong>. You'll receive a confirmation email once verified.</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* WhatsApp Group */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="bg-gradient-to-r from-green-50 to-green-100 border-2 border-green-300 p-6 rounded-xl"
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                    <svg className="w-5 h-5 text-green-600" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.025 0-2.031.313-2.896.893L4.734 3.47 5.703 6.303c-.666.823-1.023 1.892-1.023 2.964 0 3.289 2.676 5.965 5.965 5.965 1.588 0 3.083-.616 4.209-1.741 1.125-1.125 1.742-2.62 1.742-4.209 0-3.288-2.676-5.965-5.965-5.965" />
                                    </svg>
                                    <p className="text-green-700 font-bold text-sm uppercase tracking-wide">Join WhatsApp Group (Compulsory)</p>
                                </div>
                                <p className="text-green-700 text-sm mb-3">Stay updated with event announcements and important information</p>
                                <div className="flex gap-3 flex-wrap">
                                    <a
                                        href="https://chat.whatsapp.com/J9FBRwUSbNwERWUDTApVgV?mode=gi_t"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg text-sm transition transform active:scale-95"
                                    >
                                        Open WhatsApp
                                    </a>
                                    <a
                                        href="https://chat.whatsapp.com/J9FBRwUSbNwERWUDTApVgV?mode=gi_t"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="bg-white border-2 border-green-600 text-green-600 hover:bg-green-50 font-bold py-2 px-4 rounded-lg text-sm transition"
                                    >
                                        Scan QR
                                    </a>
                                </div>
                            </div>
                            <a
                                href="https://chat.whatsapp.com/J9FBRwUSbNwERWUDTApVgV?mode=gi_t"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="cursor-pointer group"
                            >
                                <img
                                    src="https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=https://chat.whatsapp.com/J9FBRwUSbNwERWUDTApVgV?mode=gi_t"
                                    alt="WhatsApp QR Code - Click to join"
                                    className="w-24 h-24 rounded-lg border-2 border-green-400 shadow-md hover:shadow-xl hover:border-green-600 transition transform hover:scale-110 group-hover:brightness-110"
                                />
                            </a>
                        </div>
                    </motion.div>

                    {/* Action Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.55 }}
                        className="flex gap-4 pt-4"
                    >
                        <Link to="/" className="flex-1 btn-primary text-center py-3 rounded-lg">
                            ← Back to Home
                        </Link>
                    </motion.div>
                </div>
            </motion.div>
        </div>
    );
};

export default Success;

