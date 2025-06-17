import User from '../model/user.model.js';
import GameSession from '../model/game-sessions.model.js';
import RoundDetail from '../model/round-details.model.js';






// GET /api/admin/customers/count
export const getCustomerCount = async (req, res) => {
    const adminId = req.userId;

    try {
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const customerCount = await User.count({
            where: {
                usertype: 'Customer',
                is_active: true
            }
        });

        const totalCustomers = await User.count({
            where: {
                usertype: 'Customer'
            }
        });

        res.status(200).json({
            message: 'Customer count retrieved successfully',
            active_customers: customerCount,
            total_customers: totalCustomers,
            inactive_customers: totalCustomers - customerCount
        });

    } catch (err) {
        console.error('Error getting customer count:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// POST /api/admin/create-sample-games - Create sample game sessions for testing (ADMIN ONLY)
export const createSampleGames = async (req, res) => {
    const adminId = req.userId;

    try {
        // Verify admin permissions
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({
                message: 'Access denied. Admin privileges required.'
            });
        }

        // Sample game sessions data
        const sampleGameSessions = [
            {
                number_of_rounds: 10,
                admin_instructions: "Practice basic number comparison - great for beginners!",
                is_public: true,
                user_id: null,
                completed: false
            },
            {
                number_of_rounds: 15,
                admin_instructions: "Intermediate level math challenges - test your skills!",
                is_public: true,
                user_id: null,
                completed: false
            },
            {
                number_of_rounds: 20,
                admin_instructions: "Advanced mathematical symbol comparison - for experts only!",
                is_public: true,
                user_id: null,
                completed: false
            }
        ];

        const createdSessions = [];

        // Create each game session
        for (const sessionData of sampleGameSessions) {
            const gameSession = await GameSession.create({
                ...sessionData,
                total_time: 0,
                correct_answers: 0,
                score: 0,
                created_by_admin: adminId
            });

            // Generate random rounds for this session
            const rounds = [];
            for (let i = 0; i < sessionData.number_of_rounds; i++) {
                const first_number = Math.floor(Math.random() * 50) + 1;
                const second_number = Math.floor(Math.random() * 50) + 1;

                let correct_symbol;
                if (first_number > second_number) {
                    correct_symbol = '>';
                } else if (first_number < second_number) {
                    correct_symbol = '<';
                } else {
                    correct_symbol = '=';
                }

                const roundDetail = await RoundDetail.create({
                    game_session_id: gameSession.id,
                    round_number: i + 1,
                    first_number,
                    second_number,
                    correct_symbol,
                    user_symbol: null,
                    response_time: null,
                    is_correct: false
                });

                rounds.push({
                    round_number: roundDetail.round_number,
                    first_number: roundDetail.first_number,
                    second_number: roundDetail.second_number,
                    correct_symbol: roundDetail.correct_symbol
                });
            }

            createdSessions.push({
                id: gameSession.id,
                number_of_rounds: gameSession.number_of_rounds,
                admin_instructions: gameSession.admin_instructions,
                rounds_created: rounds.length
            });
        }

        res.status(201).json({
            message: 'Sample game sessions created successfully',
            admin: {
                id: admin.id,
                username: admin.username,
                full_name: admin.full_name
            },
            created_sessions: createdSessions,
            total_created: createdSessions.length
        });

    } catch (err) {
        console.error('Error creating sample game sessions:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}; 