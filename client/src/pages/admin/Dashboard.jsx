import { useEffect, useState } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, sub, color = "bg-white/60 border-slate-200 shadow-sm" }) => (
    <div className={`p-6 rounded-xl border-2 ${color} backdrop-blur-md`}>
        <h3 className="text-slate-500 text-sm mb-1 font-bold uppercase tracking-wider">{title}</h3>
        <p className="text-4xl font-bold text-slate-800">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1 font-medium">{sub}</p>}
    </div>
);

const Dashboard = () => {
    const [teams, setTeams] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [rejectReason, setRejectReason] = useState('');
    const [stats, setStats] = useState({ total: 0, pending: 0, verified: 0 });
    const [limit, setLimit] = useState(75);
    const [isEditingLimit, setIsEditingLimit] = useState(false);
    const [newLimit, setNewLimit] = useState('');
    const [isResendingEmail, setIsResendingEmail] = useState(false);

    const [expandedScreenshot, setExpandedScreenshot] = useState(false);

    // New Features
    const [statusFilter, setStatusFilter] = useState('All'); // All, Verified, Pending, Rejected


    // Payment Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [paymentSettings, setPaymentSettings] = useState({
        qrCodeUrl: null,
        upiId: '',
        exportColumns: {}
    });
    const [qrFile, setQrFile] = useState(null);
    const [upiId, setUpiId] = useState('');
    const [isUpdatingSettings, setIsUpdatingSettings] = useState(false);



    const fetchTeams = async () => {
        try {
            const res = await api.get('/teams/admin/teams');
            setTeams(res.data);
            calculateStats(res.data);

            const statsRes = await api.get('/teams/stats');
            setLimit(statsRes.data.limit);
            setNewLimit(statsRes.data.limit);
        } catch (err) {
            toast.error('Failed to fetch teams');
        }
    };

    const fetchPaymentSettings = async () => {
        try {
            const res = await api.get('/teams/admin/settings/payment');
            setPaymentSettings(res.data);
            setUpiId(res.data.upiId || '');
        } catch (err) {
            console.error('Failed to fetch payment settings');
        }
    };

    const calculateStats = (data) => {
        const total = data.length;
        const pending = data.filter(t => t.payment.status === 'Pending').length;
        const verified = data.filter(t => t.payment.status === 'Verified').length;
        setStats({ total, pending, verified });
    };

    useEffect(() => {
        // Check if logged in
        const token = localStorage.getItem('token');
        if (!token) {
            console.warn('No token found - user might not be logged in');
        }

        fetchTeams();
        fetchPaymentSettings();
    }, []);

    const handleUpdateStatus = async (status) => {
        if (!selectedTeam) return;
        try {
            await api.put('/teams/admin/verify', {
                teamId: selectedTeam.teamId,
                status,
                rejectionReason: status === 'Rejected' ? rejectReason : ''
            });
            toast.success(`Team ${status}`);
            setSelectedTeam(null);
            setRejectReason('');
            fetchTeams();
        } catch (err) {
            toast.error('Update failed');
        }
    };

    const handleResendEmail = async (teamId) => {
        setIsResendingEmail(true);
        try {
            const response = await api.post(`/teams/admin/resend-email/${teamId}`);
            toast.success('Email resent successfully');

            // Update the selected team with fresh data
            if (response.data && response.data.team) {
                setSelectedTeam(response.data.team);
            }

            // Also refresh all teams
            fetchTeams();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to resend email');
        } finally {
            setIsResendingEmail(false);
        }
    };



    const handleUpdateLimit = async () => {
        try {
            await api.put('/teams/admin/limit', { limit: newLimit });
            setLimit(newLimit);
            setIsEditingLimit(false);
            toast.success('Limit updated successfully');
        } catch (err) {
            toast.error('Failed to update limit');
        }
    };

    const handleLogout = () => {
        // localStorage.removeItem('token'); // No token used
        window.location.href = '/';
    };

    const handleUpdatePaymentSettings = async () => {
        console.log('=== PAYMENT SETTINGS UPDATE ===');

        // Validation
        if (!qrFile && !upiId) {
            toast.error('Please upload a QR code or enter a UPI ID');
            return;
        }

        setIsUpdatingSettings(true);
        try {
            // Get token for verification
            const token = localStorage.getItem('token');
            console.log('Token exists:', !!token);

            if (!token) {
                toast.error('Not logged in. Please login first.');
                setIsUpdatingSettings(false);
                return;
            }

            const formData = new FormData();
            if (qrFile) {
                console.log('Adding QR file:', {
                    name: qrFile.name,
                    type: qrFile.type,
                    size: qrFile.size
                });
                formData.append('qrCode', qrFile);
            }
            if (upiId) {
                console.log('Adding UPI ID:', upiId);
                formData.append('upiId', upiId);
            }

            console.log('Sending PUT request to /teams/admin/settings/payment');
            const response = await api.put('/teams/admin/settings/payment', formData);

            console.log('Success response:', response.data);
            toast.success(response.data.message || 'Payment settings updated successfully');
            setIsSettingsOpen(false);
            setQrFile(null);
            setUpiId('');
            fetchPaymentSettings();
        } catch (err) {
            console.error('ERROR:', {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data,
                message: err.message,
                config: err.config
            });

            let errorMsg = 'Failed to update settings';
            if (err.response?.status === 401) {
                errorMsg = 'Session expired. Please login again.';
                localStorage.removeItem('token');
            } else if (err.response?.status === 400) {
                errorMsg = err.response?.data?.message || 'Please check your input';
            } else if (err.response?.data?.message) {
                errorMsg = err.response.data.message;
            } else if (err.message) {
                errorMsg = err.message;
            }

            toast.error(errorMsg);
        } finally {
            setIsUpdatingSettings(false);
        }
    };

    const handleDeleteTeam = async (teamId) => {
        if (window.confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
            try {
                await api.delete(`/teams/admin/team/${teamId}`);
                toast.success('Team deleted successfully');
                setSelectedTeam(null);
                fetchTeams();
                fetchTeams();
            } catch (err) {
                toast.error('Failed to delete team');
            }
        }
    };

    const downloadScreenshot = (url, teamId) => {
        const link = document.createElement('a');
        link.href = url;
        link.download = `payment_${teamId}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleClearAllData = async () => {
        const confirm1 = window.confirm("⚠️ DANGER: Are you sure you want to DELETE ALL TEAMS? This action CANNOT be undone.");
        if (!confirm1) return;

        const confirm2 = window.confirm("Please confirm again. All registration data will be wiped permanently.");
        if (confirm2) {
            try {
                await api.delete('/teams/admin/clear-all');
                toast.success('All data cleared successfully.');
                fetchTeams();
                fetchTeams();
            } catch (error) {
                toast.error('Failed to clear data.');
            }
        }
    };

    // Filter Logic
    const filteredTeams = teams.filter(team => {
        if (statusFilter === 'All') return true;
        return team.payment.status === statusFilter;
    });

    // Global Export Logic
    const handleGlobalExport = async (type) => {
        try {
            const endpoint = type === 'all'
                ? '/teams/admin/export/all-details'
                : '/teams/admin/export/screenshot-details';
            const filename = type === 'all'
                ? `createx_all_data_${new Date().toISOString().split('T')[0]}.csv`
                : `createx_payment_proofs_${new Date().toISOString().split('T')[0]}.csv`;

            const response = await api.get(endpoint, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', filename);
            document.body.appendChild(link);
            link.click();
            link.remove();
            toast.success('Export successful!');
        } catch (err) {
            toast.error('Export failed');
        }
    };

    return (
        <div className="p-8 min-h-screen bg-slate-50">
            <div className="flex justify-between items-center mb-8 bg-white p-6 border-l-4 border-primary rounded-xl shadow-md">
                <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">Admin Dashboard</h1>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Registration & Payment Management</p>
                </div>
                <div className="space-x-4 flex items-center flex-wrap gap-2">
                    <div className="flex gap-2 flex-wrap">

                        <button onClick={() => setIsSettingsOpen(true)} className="px-4 py-2 rounded-xl font-bold bg-blue-100 text-blue-600 hover:bg-blue-200 border border-blue-200 transition-colors text-sm flex items-center gap-1">
                            ⚙️ Settings
                        </button>
                        <button onClick={handleClearAllData} className="px-4 py-2 rounded-xl font-bold bg-red-100 text-red-600 hover:bg-red-200 border border-red-200 transition-colors text-sm flex items-center gap-1">
                            ⚠️ Clear All Data
                        </button>
                        <button onClick={() => handleGlobalExport('all')} className="btn-primary text-sm flex items-center gap-1 px-4 py-2 shadow-lg hover:shadow-xl transition-all">
                            📥 Whole Data
                        </button>
                        <button onClick={() => handleGlobalExport('screenshots')} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm flex items-center gap-1 px-4 py-2 shadow-lg hover:shadow-xl transition-all">
                            📸 Screenshots
                        </button>
                    </div>
                    <button onClick={handleLogout} className="text-primary hover:text-primary/80 font-semibold transition-colors">Logout</button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                <div onClick={() => setIsEditingLimit(true)} className="cursor-pointer hover:opacity-80 transition">
                    <StatCard title="Total Teams" value={stats.total} sub={`Limit: ${limit} (Click to Edit)`} />
                </div>
                <StatCard title="Verified" value={stats.verified} color="bg-green-100 border-green-300 text-green-700" />
                <StatCard title="Pending" value={stats.pending} color="bg-amber-100 border-amber-300 text-amber-700" />
                <StatCard title="Rejected" value={teams.length - stats.verified - stats.pending} color="bg-red-100 border-red-300 text-red-700" />
            </div>

            {/* Filter Buttons */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
                {['All', 'Verified', 'Pending', 'Rejected'].map(status => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm border ${statusFilter === status
                            ? 'bg-primary text-white border-primary shadow-md'
                            : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-100 border-b-2 border-slate-300 pointer-events-none">
                        <tr>

                            <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Team ID</th>
                            <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Name</th>
                            <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Leader</th>
                            <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Members</th>
                            <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Status</th>
                            <th className="p-4 font-bold text-slate-700 text-sm uppercase tracking-wide">Action</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {filteredTeams.map(team => (
                            <tr key={team._id} className="hover:bg-slate-50 transition-colors bg-white">
                                <td className="p-4 font-mono font-bold text-slate-800 text-sm">{team.teamId}</td>
                                <td className="p-4 font-bold text-slate-800">{team.teamName}</td>
                                <td className="p-4">
                                    <div className="font-bold text-slate-800">{team.leader.name}</div>
                                    <div className="text-xs text-slate-500 font-bold">{team.leader.mobileNumber}</div>
                                </td>
                                <td className="p-4 font-bold text-slate-800 text-center"><span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-bold text-sm">{team.members.length + 1}</span></td>
                                <td className="p-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border ${team.payment.status === 'Verified' ? 'bg-green-100 border-green-200 text-green-700' :
                                        team.payment.status === 'Rejected' ? 'bg-red-100 border-red-200 text-red-700' :
                                            'bg-amber-100 border-amber-200 text-amber-700'
                                        }`}>
                                        {team.payment.status}
                                    </span>
                                </td>
                                <td className="p-4">
                                    {team.payment.status === 'Pending' ? (
                                        <button
                                            onClick={() => setSelectedTeam(team)}
                                            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-bold shadow-sm"
                                        >
                                            Verify
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedTeam(team)}
                                            className="px-3 py-1 bg-slate-200 text-slate-700 rounded hover:bg-slate-300 text-sm font-bold"
                                        >
                                            Details
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal */}
            {
                selectedTeam && (
                    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-0 relative animate-fadeIn">

                            {/* Header */}
                            <div className="bg-slate-50 border-b border-slate-100 p-6 flex justify-between items-center sticky top-0 z-10">
                                <div>
                                    <h2 className="text-2xl font-bold text-slate-800">Team Details</h2>
                                    <p className="text-slate-500 text-sm">{selectedTeam.teamId}</p>
                                </div>
                                <button
                                    onClick={() => setSelectedTeam(null)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-500 hover:bg-slate-300 transition"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="p-6 space-y-6">
                                {/* Team Information */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Team Name</p>
                                        <p className="font-bold text-slate-800 text-lg">{selectedTeam.teamName}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-400">Status</p>
                                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase ${selectedTeam.payment.status === 'Verified' ? 'bg-green-100 text-green-700' :
                                            selectedTeam.payment.status === 'Rejected' ? 'bg-red-100 text-red-700' :
                                                'bg-amber-100 text-amber-700'
                                            }`}>
                                            {selectedTeam.payment.status}
                                        </span>
                                    </div>
                                </div>

                                {/* Email Status */}
                                <div className="bg-slate-900 rounded-xl p-4 border border-slate-700 flex items-center justify-between">
                                    <div>
                                        <p className="text-xs uppercase tracking-wider font-bold text-slate-400 mb-1">Email Status</p>
                                        <p className={`text-sm font-semibold ${selectedTeam.payment.emailSent ? 'text-green-400' : 'text-amber-400'}`}>
                                            {selectedTeam.payment.emailSent ? `Sent at ${new Date(selectedTeam.payment.emailSentAt).toLocaleString()}` : 'Not Sent'}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleResendEmail(selectedTeam.teamId)}
                                        disabled={isResendingEmail}
                                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-lg transition"
                                    >
                                        {isResendingEmail ? 'Sending...' : 'Resend Email'}
                                    </button>
                                </div>

                                <hr className="border-slate-100" />

                                {/* Team Lead */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-primary rounded-full"></span>
                                        Team Lead
                                    </h3>
                                    <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 grid grid-cols-2 md:grid-cols-3 gap-4">
                                        <div><p className="text-slate-400 text-xs font-bold uppercase">Name</p><p className="font-semibold text-slate-700">{selectedTeam.leader.name}</p></div>
                                        <div><p className="text-slate-400 text-xs font-bold uppercase">Reg. No</p><p className="font-mono text-slate-700 font-medium">{selectedTeam.leader.registerNumber}</p></div>
                                        <div><p className="text-slate-400 text-xs font-bold uppercase">Mobile</p><p className="font-semibold text-slate-700">{selectedTeam.leader.mobileNumber}</p></div>
                                        <div><p className="text-slate-400 text-xs font-bold uppercase">Gender</p><p className="font-semibold text-slate-700">{selectedTeam.leader.gender || '-'}</p></div>
                                        <div className="col-span-2"><p className="text-slate-400 text-xs font-bold uppercase">Type</p><p className="font-semibold text-slate-700">{selectedTeam.leader.isHosteler ? `Hosteler (${selectedTeam.leader.hostelName}, Room ${selectedTeam.leader.roomNumber})` : 'Day Scholar'}</p></div>
                                    </div>
                                </div>

                                {/* Members */}
                                <div>
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide mb-4 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-secondary rounded-full"></span>
                                        Team Members
                                    </h3>
                                    <div className="grid gap-3">
                                        {selectedTeam.members.map((member, idx) => (
                                            <div key={idx} className="bg-white border border-slate-200 p-3 rounded-lg flex flex-wrap gap-4 items-center text-sm shadow-sm hover:border-slate-300 transition">
                                                <span className="bg-slate-100 text-slate-500 font-bold px-2 py-1 rounded text-xs">M{idx + 1}</span>
                                                <div className="flex-1">
                                                    <p className="font-bold text-slate-800">{member.name}</p>
                                                    <p className="text-xs text-slate-500 font-mono">{member.registerNumber}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-slate-600 font-medium">{member.mobileNumber}</p>
                                                    <p className="text-xs text-slate-400">{member.gender || '-'}, {member.isHosteler ? 'Hosteler' : 'Day Scholar'}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment */}
                                <div className="bg-slate-900 rounded-xl p-6 text-white overflow-hidden relative">
                                    <div className="absolute top-0 right-0 p-32 bg-primary/20 blur-3xl rounded-full translate-x-10 -translate-y-10"></div>
                                    <h3 className="text-lg font-bold mb-4 relative z-10">Payment Details</h3>
                                    <div className="flex flex-col md:flex-row gap-6 relative z-10">
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <p className="text-slate-400 text-xs font-bold uppercase">UTR Number</p>
                                                <p className="font-mono text-xl font-bold tracking-wider text-green-400">{selectedTeam.payment.utr}</p>
                                            </div>
                                            <div>
                                                <p className="text-slate-400 text-xs font-bold uppercase">Amount Paid</p>
                                                <p className="text-2xl font-bold">₹1750</p>
                                            </div>
                                        </div>

                                        <div className="w-full md:w-40 shrink-0">
                                            <p className="text-slate-400 text-xs font-bold uppercase mb-2">Screenshot</p>
                                            <div
                                                onClick={() => setExpandedScreenshot(true)}
                                                className="h-20 w-full bg-black/50 rounded-lg border border-slate-700 overflow-hidden cursor-pointer hover:border-white/50 transition relative group"
                                            >
                                                <img src={selectedTeam.payment.screenshotUrl} alt="Payment" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition" />
                                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/40">
                                                    <span className="text-xs font-bold bg-white/20 backdrop-blur px-2 py-1 rounded">Expand</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => downloadScreenshot(selectedTeam.payment.screenshotUrl, selectedTeam.teamId)}
                                                className="text-xs text-slate-400 hover:text-white mt-2 flex items-center gap-1 transition"
                                            >
                                                Download
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="bg-slate-50 p-6 -mx-6 -mb-6 border-t border-slate-100 sticky bottom-0 z-10">
                                    {selectedTeam.payment.status === 'Pending' ? (
                                        <div className="grid gap-4">
                                            <button
                                                onClick={() => handleUpdateStatus('Verified')}
                                                className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-lg shadow-green-600/20 transition transform active:scale-[0.98]"
                                            >
                                                Approve Payment
                                            </button>
                                            <div className="flex gap-2">
                                                <input
                                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-4 text-sm focus:outline-none focus:border-red-400"
                                                    placeholder="Reason for rejection..."
                                                    value={rejectReason}
                                                    onChange={(e) => setRejectReason(e.target.value)}
                                                />
                                                <button
                                                    onClick={() => handleUpdateStatus('Rejected')}
                                                    className="px-6 py-2 bg-red-100 text-red-600 hover:bg-red-200 font-bold rounded-lg transition"
                                                >
                                                    Reject
                                                </button>
                                            </div>
                                        </div>
                                    ) : selectedTeam.payment.status === 'Rejected' ? (
                                        <div className="space-y-3">
                                            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                                                <p className="text-xs font-bold text-red-600 uppercase tracking-wide mb-2">Rejection Reason</p>
                                                <p className="text-red-700 font-medium text-sm">{selectedTeam.payment.rejectionReason || 'No reason provided'}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteTeam(selectedTeam.teamId)}
                                                className="w-full px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold transition border border-red-200"
                                            >
                                                Delete Team
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex justify-between items-center">
                                            <p className="text-slate-500 text-sm font-medium">
                                                Processed as <span className="font-bold text-slate-800">{selectedTeam.payment.status}</span>
                                            </p>
                                            <button
                                                onClick={() => handleDeleteTeam(selectedTeam.teamId)}
                                                className="px-4 py-2 text-red-500 hover:bg-red-50 rounded-lg text-sm font-bold transition"
                                            >
                                                Delete Team
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Screenshot Expanded Modal */}
            {
                expandedScreenshot && selectedTeam && (
                    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="max-w-5xl w-full max-h-[90vh] relative">
                            <button
                                onClick={() => setExpandedScreenshot(false)}
                                className="absolute top-4 right-4 text-white text-3xl hover:text-gray-300 bg-black/50 rounded-full w-10 h-10 flex items-center justify-center"
                            >
                                ✕
                            </button>
                            <img src={selectedTeam.payment.screenshotUrl} alt="Payment Screenshot" className="w-full h-full object-contain rounded-lg" />
                        </div>
                    </div>
                )
            }

            {/* Limit Modal */}
            {
                isEditingLimit && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl max-w-sm w-full p-6 relative shadow-2xl">
                            <h3 className="text-xl font-bold mb-4">Set Registration Limit</h3>
                            <input
                                type="number"
                                className="input-field mb-4"
                                value={newLimit}
                                onChange={(e) => setNewLimit(e.target.value)}
                            />
                            <div className="flex space-x-2">
                                <button
                                    onClick={handleUpdateLimit}
                                    className="btn-primary flex-1"
                                >
                                    Save
                                </button>
                                <button
                                    onClick={() => setIsEditingLimit(false)}
                                    className="px-4 py-2 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold flex-1"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }


            {/* Settings Modal */}
            {
                isSettingsOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-white rounded-xl max-w-2xl w-full p-8 relative shadow-2xl my-8">
                            <div className="flex justify-between items-center mb-8">
                                <h3 className="text-2xl font-bold text-slate-800">⚙️ Admin Settings</h3>
                                <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-2xl">✕</button>
                            </div>

                            <div className="space-y-6">
                                {/* Payment QR Code Upload */}
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6">
                                    <h4 className="text-lg font-bold text-blue-900 mb-4 flex items-center gap-2">
                                        <span className="text-2xl">📱</span> Payment QR Code
                                    </h4>
                                    <div className="space-y-3">
                                        {paymentSettings.qrCodeUrl && (
                                            <div className="p-4 bg-white rounded-lg border-2 border-blue-200 flex items-center justify-between shadow-sm">
                                                <span className="text-sm text-slate-700 font-bold">✓ QR Code Uploaded</span>
                                                <a href={paymentSettings.qrCodeUrl} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-blue-500 text-white hover:bg-blue-600 rounded-lg text-sm font-bold transition">
                                                    View QR
                                                </a>
                                            </div>
                                        )}
                                        <label className="block">
                                            <span className="text-sm font-bold text-slate-700 mb-2 block">Upload New QR Code Image:</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        console.log('File selected:', {
                                                            name: file.name,
                                                            size: file.size,
                                                            type: file.type
                                                        });
                                                        if (file.size > 10 * 1024 * 1024) {
                                                            toast.error('File size exceeds 10MB limit');
                                                            return;
                                                        }
                                                        setQrFile(file);
                                                    } else {
                                                        setQrFile(null);
                                                    }
                                                }}
                                                className="w-full p-4 border-2 border-dashed border-blue-300 rounded-lg text-sm text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-bold file:bg-blue-500 file:text-white hover:file:bg-blue-600 transition cursor-pointer bg-white"
                                            />
                                            {qrFile && <p className="text-xs text-blue-600 font-bold mt-2">📁 Selected: {qrFile.name} ({(qrFile.size / 1024).toFixed(2)} KB)</p>}
                                        </label>
                                    </div>
                                </div>

                                {/* UPI ID */}
                                <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6">
                                    <h4 className="text-lg font-bold text-green-900 mb-4 flex items-center gap-2">
                                        <span className="text-2xl">🏦</span> UPI ID
                                    </h4>
                                    <div>
                                        <label className="block">
                                            <span className="text-sm font-bold text-slate-700 mb-2 block">Enter UPI ID:</span>
                                            <input
                                                type="text"
                                                placeholder="example@upi"
                                                value={upiId}
                                                onChange={(e) => setUpiId(e.target.value)}
                                                className="w-full p-4 border-2 border-green-300 rounded-lg text-base font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-200 transition bg-white"
                                            />
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 flex space-x-3 gap-3">
                                <button
                                    onClick={handleUpdatePaymentSettings}
                                    disabled={isUpdatingSettings}
                                    className="btn-primary flex-1 py-3 font-bold text-base disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transition"
                                >
                                    {isUpdatingSettings ? '⏳ Saving...' : '💾 Save Settings'}
                                </button>
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="px-6 py-3 rounded-lg border-2 border-slate-300 text-slate-700 hover:bg-slate-100 font-bold flex-1 transition"
                                >
                                    ✕ Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {/* Column Selection Modal in Export */}
            {
                isExportModalOpen && (
                    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
                        <div className="bg-white rounded-xl max-w-2xl w-full p-6 relative shadow-2xl animate-fadeIn overflow-y-auto max-h-[90vh]">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-slate-800">Export Options</h3>
                                <button onClick={() => setIsExportModalOpen(false)} className="text-slate-400 hover:text-slate-600 font-bold text-xl">✕</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                {/* Gender Filter */}
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Gender</p>
                                    <div className="flex bg-slate-100 rounded-lg p-1">
                                        {['All', 'Male', 'Female'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setExportFilters({ ...exportFilters, gender: opt })}
                                                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${exportFilters.gender === opt ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Type Filter */}
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Accommodation</p>
                                    <div className="flex bg-slate-100 rounded-lg p-1">
                                        {['All', 'Hosteler', 'Day Scholar'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setExportFilters({ ...exportFilters, type: opt })}
                                                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${exportFilters.type === opt ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Year Filter */}
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Year of Study</p>
                                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                                        {['All', 'I', 'II', 'III', 'IV'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setExportFilters({ ...exportFilters, year: opt })}
                                                className={`flex-1 py-1.5 rounded-md text-sm font-bold transition-all ${exportFilters.year === opt ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Filter */}
                                <div>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Payment Status</p>
                                    <div className="flex bg-slate-100 rounded-lg p-1 gap-1">
                                        {['All', 'Verified', 'Pending', 'Rejected'].map(opt => (
                                            <button
                                                key={opt}
                                                onClick={() => setExportFilters({ ...exportFilters, status: opt })}
                                                className={`flex-1 py-1.5 px-2 rounded-md text-[10px] sm:text-xs font-bold transition-all whitespace-nowrap ${exportFilters.status === opt ? 'bg-white shadow text-primary' : 'text-slate-500 hover:text-slate-700'
                                                    }`}
                                            >
                                                {opt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Column Selection */}
                            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="text-sm font-bold text-slate-800 mb-3">Select Columns to Export:</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(selectedColumns).map(([key, value]) => (
                                        <label key={key} className="flex items-center space-x-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={value}
                                                onChange={(e) => setSelectedColumns({
                                                    ...selectedColumns,
                                                    [key]: e.target.checked
                                                })}
                                                className="w-4 h-4 rounded border-slate-300 text-primary cursor-pointer accent-primary"
                                            />
                                            <span className="text-xs text-slate-600 font-medium capitalize">
                                                {key.replace(/([A-Z])/g, ' $1').trim()}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm">
                                <p className="text-slate-600 mb-1 font-semibold">Generating Report for:</p>
                                <ul className="list-disc list-inside space-y-1 text-slate-500">
                                    <li>Gender: <span className="font-bold text-slate-800">{exportFilters.gender}</span></li>
                                    <li>Accommodation: <span className="font-bold text-slate-800">{exportFilters.type}</span></li>
                                    <li>Year: <span className="font-bold text-slate-800">{exportFilters.year}</span></li>
                                    <li>Status: <span className="font-bold text-slate-800">{exportFilters.status}</span></li>
                                </ul>
                                <p className="mt-3 text-xs text-slate-400 font-medium border-t border-slate-200 pt-2">
                                    Scope: <span className="text-primary font-bold">{selectedIds.length > 0 ? `${selectedIds.length} Selected Teams` : 'All Teams'}</span>
                                </p>
                            </div>

                            <div className="flex space-x-3">
                                <button
                                    onClick={handleConfirmExport}
                                    disabled={isExporting}
                                    className="btn-primary flex-1 py-3 text-base"
                                >
                                    {isExporting ? 'Generating CSV...' : 'Download Report'}
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
};



export default Dashboard;
