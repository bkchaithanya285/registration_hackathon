import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';
import { yearOptions } from '../utils/romanNumerals';

const Register = () => {
    const navigate = useNavigate();
    const { state } = useLocation();
    const isEditing = state?.isEditing || false;

    const { register, control, handleSubmit, watch, formState: { errors } } = useForm({
        defaultValues: {
            teamName: state?.registrationData?.teamName || '',
            leader: state?.registrationData?.leader || { yearOfStudy: '', department: '', email: '', teamLeadEmail: '', gender: '' },
            members: state?.registrationData?.members || [
                { name: '', registerNumber: '', mobileNumber: '', isHosteler: false, hostelName: '', roomNumber: '', yearOfStudy: '', department: '', gender: '' },
                { name: '', registerNumber: '', mobileNumber: '', isHosteler: false, hostelName: '', roomNumber: '', yearOfStudy: '', department: '', gender: '' },
                { name: '', registerNumber: '', mobileNumber: '', isHosteler: false, hostelName: '', roomNumber: '', yearOfStudy: '', department: '', gender: '' },
                { name: '', registerNumber: '', mobileNumber: '', isHosteler: false, hostelName: '', roomNumber: '', yearOfStudy: '', department: '', gender: '' }
            ]
        }
    });

    // Move useFieldArray BEFORE any conditional rendering
    const { fields, append, remove } = useFieldArray({
        control,
        name: "members"
    });

    const [isClosed, setIsClosed] = useState(false);
    const [loading, setLoading] = useState(true);

    // Watch lead hosteler status
    const isLeadHosteler = watch("leader.isHosteler");

    useEffect(() => {
        const timeout = setTimeout(() => {
            console.log('Loading timeout reached');
            setLoading(false);
        }, 5000); // Fallback timeout after 5 seconds

        api.get('/teams/stats')
            .then(res => {
                console.log('Stats fetched:', res.data);
                clearTimeout(timeout);
                if (!res.data.isRegistrationOpen) {
                    setIsClosed(true);
                }
                setLoading(false);
            })
            .catch(err => {
                console.error('Error fetching stats:', err);
                clearTimeout(timeout);
                setLoading(false);
            });

        return () => clearTimeout(timeout);
    }, []);

    if (loading) return <div className="text-white text-center mt-20">Loading status...</div>;

    if (isClosed) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="glass-card p-10 text-center max-w-lg border border-red-500/30">
                    <h2 className="text-3xl font-bold text-red-500 mb-4">Registration Closed</h2>
                    <p className="text-light-subtext mb-6 font-medium">The registration limit has been reached. Please contact the organizers for more information.</p>
                    <button onClick={() => navigate('/')} className="btn-secondary">Back to Home</button>
                </div >
            </div >
        );
    }

    // Auto-populate members on mount to ensure user knows 5 are needed? 
    // Or just validate on submit. Let's validate.

    const onSubmit = async (data) => {
        // All 4 members are mandatory and always present
        // Pass data to Review page
        navigate('/review', { state: { registrationData: data } });
    };

    return (
        <div className="min-h-screen p-8 max-w-4xl mx-auto">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="glass-card p-8"
            >
                <h2 className="text-4xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Team Registration</h2>
                <p className="text-primary/70 mb-6">Join the GENESIS Hackathon</p>

                <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg mb-6">
                    <p className="text-primary text-sm font-semibold">📋 Team Requirements</p>
                    <p className="text-primary/80 text-sm mt-1">A team must have exactly 5 members (Lead + 4 Members) to register.</p>
                </div>

                <div className="bg-secondary/10 border border-secondary/30 p-4 rounded-lg mb-6">
                    <p className="text-secondary text-sm font-semibold mb-2">✓ Important Instructions:</p>
                    <ul className="text-secondary/80 text-xs space-y-1 ml-4 list-disc">
                        <li>Fill all details in BLOCK LETTERS</li>
                        <li>Fill your name as per your SIS KARE record</li>
                        <li>No changes allowed after registration submission</li>
                        <li>Ensure all information is accurate before submitting</li>
                    </ul>
                </div>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">

                    {/* Team Name */}
                    <div className="space-y-2">
                        <label className="text-sm font-semibold text-primary ml-1">Team Name <span className="text-red-500">*</span></label>
                        <input
                            {...register("teamName", { required: "Team Name is required", onChange: (e) => { e.target.value = e.target.value.toUpperCase(); } })}
                            className="input-field uppercase"
                            placeholder="Enter Team Name"
                            style={{ textTransform: 'uppercase' }}
                            onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }}
                        />
                        {errors.teamName && <span className="text-red-500 text-xs ml-1 font-medium">{errors.teamName.message}</span>}
                    </div>

                    <hr className="border-primary/20" />

                    {/* District / Leader Details */}
                    <div>
                        <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Team Lead Details</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-light-subtext ml-1">FULL NAME <span className="text-red-500">*</span></label>
                                <input {...register("leader.name", { required: "Name is required" })} className="input-field uppercase" placeholder="Full Name" style={{ textTransform: 'uppercase' }} onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }} />
                                {errors.leader?.name && <span className="text-red-500 text-xs">{errors.leader.name.message}</span>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-light-subtext ml-1">EMAIL <span className="text-red-500">*</span></label>
                                <input {...register("leader.email", { required: "Email is required" })} className="input-field" placeholder="Email Address" type="email" />
                                {errors.leader?.email && <span className="text-red-500 text-xs">{errors.leader.email.message}</span>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-light-subtext ml-1">REGISTER NUMBER <span className="text-red-500">*</span></label>
                                <input {...register("leader.registerNumber", { required: "Register Number is required" })} className="input-field" placeholder="Register Number" type="text" inputMode="numeric" pattern="[0-9]*" onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }} />
                                {errors.leader?.registerNumber && <span className="text-red-500 text-xs">{errors.leader.registerNumber.message}</span>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-light-subtext ml-1">GENDER <span className="text-red-500">*</span></label>
                                <select {...register("leader.gender", { required: "Gender is required" })} className="year-select">
                                    <option value="">Select Gender</option>
                                    <option value="Male">Male</option>
                                    <option value="Female">Female</option>
                                </select>
                                {errors.leader?.gender && <span className="text-red-500 text-xs">{errors.leader.gender.message}</span>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-light-subtext ml-1">MOBILE NUMBER <span className="text-red-500">*</span></label>
                                <input {...register("leader.mobileNumber", { required: "Mobile Number is required" })} className="input-field" placeholder="Mobile Number" type="text" inputMode="numeric" pattern="[0-9]*" onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }} />
                                {errors.leader?.mobileNumber && <span className="text-red-500 text-xs">{errors.leader.mobileNumber.message}</span>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-light-subtext ml-1">YEAR OF STUDY <span className="text-red-500">*</span></label>
                                <select {...register("leader.yearOfStudy", { required: "Year is required" })} className="year-select">
                                    <option value="">Select Year</option>
                                    {yearOptions.map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {errors.leader?.yearOfStudy && <span className="text-red-500 text-xs">{errors.leader.yearOfStudy.message}</span>}
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-light-subtext ml-1">DEPARTMENT <span className="text-red-500">*</span></label>
                                <input {...register("leader.department", { required: "Department is required" })} className="input-field uppercase" placeholder="Department" style={{ textTransform: 'uppercase' }} onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }} />
                                {errors.leader?.department && <span className="text-red-500 text-xs">{errors.leader.department.message}</span>}
                            </div>

                            <div className="flex items-center space-x-4 h-full pt-6">
                                <label className="flex items-center cursor-pointer">
                                    <input type="checkbox" {...register("leader.isHosteler")} className="mr-2 w-5 h-5 accent-primary" />
                                    <span className="text-light-text font-medium">Hosteler?</span>
                                </label>
                            </div>

                            {isLeadHosteler && (
                                <>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-light-subtext ml-1">HOSTEL NAME <span className="text-red-500">*</span></label>
                                        <input {...register("leader.hostelName", { required: "Hostel Name is required" })} className="input-field" placeholder="Hostel Name" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-light-subtext ml-1">ROOM NUMBER <span className="text-red-500">*</span></label>
                                        <input {...register("leader.roomNumber", { required: "Room Number is required" })} className="input-field" placeholder="Room Number" />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <hr className="border-primary/20" />

                    {/* Members */}
                    <div>
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-secondary">Team Members ({fields.length}/4)</h3>
                        </div>

                        {fields.map((field, index) => {
                            const isMemberHosteler = watch(`members.${index}.isHosteler`);
                            return (
                                <motion.div
                                    key={field.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card-secondary mb-6"
                                >
                                    <h4 className="text-sm font-bold text-primary mb-4 uppercase tracking-wide">Member {index + 1}</h4>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-light-subtext ml-1">FULL NAME <span className="text-red-500">*</span></label>
                                            <input {...register(`members.${index}.name`, { required: "Name is required" })} className="input-field uppercase" placeholder="Full Name" style={{ textTransform: 'uppercase' }} onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }} />
                                            {errors.members?.[index]?.name && <span className="text-red-500 text-xs">{errors.members[index].name.message}</span>}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-light-subtext ml-1">REGISTER NUMBER <span className="text-red-500">*</span></label>
                                            <input {...register(`members.${index}.registerNumber`, { required: "Register Number is required" })} className="input-field" placeholder="Register Number" type="text" inputMode="numeric" pattern="[0-9]*" onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }} />
                                            {errors.members?.[index]?.registerNumber && <span className="text-red-500 text-xs">{errors.members[index].registerNumber.message}</span>}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-light-subtext ml-1">GENDER <span className="text-red-500">*</span></label>
                                            <select {...register(`members.${index}.gender`, { required: "Gender is required" })} className="year-select">
                                                <option value="">Select Gender</option>
                                                <option value="Male">Male</option>
                                                <option value="Female">Female</option>
                                            </select>
                                            {errors.members?.[index]?.gender && <span className="text-red-500 text-xs">{errors.members[index].gender.message}</span>}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-light-subtext ml-1">MOBILE NUMBER <span className="text-red-500">*</span></label>
                                            <input {...register(`members.${index}.mobileNumber`, { required: "Mobile Number is required" })} className="input-field" placeholder="Mobile Number" type="text" inputMode="numeric" pattern="[0-9]*" onInput={(e) => { e.target.value = e.target.value.replace(/[^0-9]/g, ''); }} />
                                            {errors.members?.[index]?.mobileNumber && <span className="text-red-500 text-xs">{errors.members[index].mobileNumber.message}</span>}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-light-subtext ml-1">YEAR OF STUDY <span className="text-red-500">*</span></label>
                                            <select {...register(`members.${index}.yearOfStudy`, { required: "Year is required" })} className="year-select">
                                                <option value="">Select Year</option>
                                                {yearOptions.map(opt => (
                                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                                ))}
                                            </select>
                                            {errors.members?.[index]?.yearOfStudy && <span className="text-red-500 text-xs">{errors.members[index].yearOfStudy.message}</span>}
                                        </div>

                                        <div className="space-y-1">
                                            <label className="text-xs font-bold text-light-subtext ml-1">DEPARTMENT <span className="text-red-500">*</span></label>
                                            <input {...register(`members.${index}.department`, { required: "Department is required" })} className="input-field uppercase" placeholder="Department" style={{ textTransform: 'uppercase' }} onInput={(e) => { e.target.value = e.target.value.toUpperCase(); }} />
                                            {errors.members?.[index]?.department && <span className="text-red-500 text-xs">{errors.members[index].department.message}</span>}
                                        </div>

                                        <div className="flex items-center space-x-4 h-full pt-6">
                                            <label className="flex items-center cursor-pointer">
                                                <input type="checkbox" {...register(`members.${index}.isHosteler`)} className="mr-2 w-5 h-5 accent-primary" />
                                                <span className="text-light-text font-medium">Hosteler?</span>
                                            </label>
                                        </div>

                                        {isMemberHosteler && (
                                            <>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-light-subtext ml-1">HOSTEL NAME <span className="text-red-500">*</span></label>
                                                    <input {...register(`members.${index}.hostelName`, { required: "Hostel Name is required" })} className="input-field" placeholder="Hostel Name" />
                                                </div>
                                                <div className="space-y-1">
                                                    <label className="text-xs font-bold text-light-subtext ml-1">ROOM NUMBER <span className="text-red-500">*</span></label>
                                                    <input {...register(`members.${index}.roomNumber`, { required: "Room Number is required" })} className="input-field" placeholder="Room Number" />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>

                    <div className="pt-4">
                        <button type="submit" className="btn-primary w-full">Review Registration</button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
};

export default Register;
