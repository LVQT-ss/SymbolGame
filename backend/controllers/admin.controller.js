import User from '../model/user.model.js';
import GameSession from '../model/game-sessions.model.js';
import UserStatistics from '../model/user-statistics.model.js';

// POST /api/admin/game/create-for-user
export const createGameSessionForUser = async (req, res) => {
    const adminId = req.userId; // From JWT token
    const {
        customer_id,
        difficulty_level = 1,
        number_of_rounds = 10,
        instructions = null
    } = req.body;

    // Validate admin permissions
    try {
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        if (!customer_id) {
            return res.status(400).json({ message: 'customer_id is required' });
        }

        // Verify customer exists and is active
        const customer = await User.findByPk(customer_id);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        if (customer.usertype !== 'Customer') {
            return res.status(400).json({ message: 'Target user must be a Customer' });
        }

        if (!customer.is_active) {
            return res.status(400).json({ message: 'Customer account is inactive' });
        }

        // Create game session for the customer
        const gameSession = await GameSession.create({
            user_id: customer_id,
            difficulty_level,
            number_of_rounds,
            total_time: 0,
            correct_answers: 0,
            score: 0,
            completed: false,
            is_public: true,
            created_by_admin: adminId, // Track which admin created it
            admin_instructions: instructions
        });

        // Get customer statistics for context
        const customerStats = await UserStatistics.findOne({
            where: { user_id: customer_id }
        });

        res.status(201).json({
            message: 'Game session created successfully for customer',
            admin: {
                id: admin.id,
                username: admin.username
            },
            customer: {
                id: customer.id,
                username: customer.username,
                full_name: customer.full_name,
                current_level: customer.current_level,
                games_played: customerStats?.games_played || 0
            },
            game_session: {
                id: gameSession.id,
                difficulty_level: gameSession.difficulty_level,
                number_of_rounds: gameSession.number_of_rounds,
                instructions: gameSession.admin_instructions,
                created_at: gameSession.createdAt
            }
        });

    } catch (err) {
        console.error('Error creating game session for user:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/admin/game/sessions
export const getAdminCreatedSessions = async (req, res) => {
    const adminId = req.userId;
    const { page = 1, limit = 20, status = 'all' } = req.query;

    try {
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const offset = (page - 1) * limit;
        const whereCondition = { created_by_admin: adminId };

        if (status === 'active') {
            whereCondition.completed = false;
        } else if (status === 'completed') {
            whereCondition.completed = true;
        }

        const { count, rows } = await GameSession.findAndCountAll({
            where: whereCondition,
            include: [
                {
                    model: User,
                    as: 'user',
                    attributes: ['id', 'username', 'full_name', 'avatar', 'current_level']
                }
            ],
            limit: parseInt(limit),
            offset: offset,
            order: [['createdAt', 'DESC']]
        });

        res.status(200).json({
            message: 'Admin-created game sessions retrieved successfully',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            sessions: rows
        });

    } catch (err) {
        console.error('Error fetching admin-created sessions:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

// GET /api/admin/customers/available
export const getAvailableCustomers = async (req, res) => {
    const adminId = req.userId;
    const { page = 1, limit = 50 } = req.query;

    try {
        const admin = await User.findByPk(adminId);
        if (!admin || admin.usertype !== 'Admin') {
            return res.status(403).json({ message: 'Admin access required' });
        }

        const offset = (page - 1) * limit;

        const { count, rows } = await User.findAndCountAll({
            where: {
                usertype: 'Customer',
                is_active: true
            },
            include: [
                {
                    model: UserStatistics,
                    as: 'statistics',
                    attributes: ['games_played', 'best_score', 'total_score']
                }
            ],
            attributes: ['id', 'username', 'full_name', 'avatar', 'current_level', 'experience_points', 'coins'],
            limit: parseInt(limit),
            offset: offset,
            order: [['username', 'ASC']]
        });

        res.status(200).json({
            message: 'Available customers retrieved successfully',
            pagination: {
                total: count,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(count / limit)
            },
            customers: rows
        });

    } catch (err) {
        console.error('Error fetching available customers:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
}; 