const Counter = require('../models/Counter');
const Team = require('../models/Team');

const generateTeamId = async () => {
    while (true) {
        try {
            // Try to atomically increment the counter
            let counter = await Counter.findByIdAndUpdate(
                { _id: 'teamId' },
                { $inc: { seq: 1 } },
                { new: true }
            );

            if (counter) {
                return `CREATOR-${String(counter.seq).padStart(3, '0')}`;
            }

            // If counter doesn't exist, initialize it from the Team collection
            const lastTeam = await Team.findOne({ teamId: /^CREATOR-\d+$/ }).sort({ teamId: -1 });
            let lastIdNum = 0;
            if (lastTeam && lastTeam.teamId) {
                const parts = lastTeam.teamId.split('-');
                if (parts.length === 2 && !isNaN(parts[1])) {
                    lastIdNum = parseInt(parts[1], 10);
                }
            }

            // Try to create the counter. 
            // We use create() to ensure we fail if it already exists (E11000)
            try {
                // Initialize with lastIdNum. The next loop iteration will increment it to lastIdNum + 1.
                await Counter.create({ _id: 'teamId', seq: lastIdNum });
            } catch (createErr) {
                if (createErr.code === 11000) {
                    // Counter created by another process, retry loop to increment
                    continue;
                }
                throw createErr;
            }
        } catch (err) {
            throw new Error('Failed to generate Team ID: ' + err.message);
        }
    }
};

module.exports = generateTeamId;
