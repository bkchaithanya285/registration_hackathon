const Team = require('../models/Team');

const generateTeamId = async () => {
    const lastTeam = await Team.findOne().sort({ teamId: -1 });
    let nextId = 1;
    if (lastTeam && lastTeam.teamId) {
        const lastIdNum = parseInt(lastTeam.teamId.split('-')[1]);
        if (!isNaN(lastIdNum)) {
            nextId = lastIdNum + 1;
        }
    }
    return `GENESIS-${String(nextId).padStart(3, '0')}`;
};

module.exports = generateTeamId;
