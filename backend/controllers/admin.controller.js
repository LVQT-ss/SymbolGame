import User from '../model/user.model.js';






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