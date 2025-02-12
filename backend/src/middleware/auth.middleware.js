import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
	try {
		const token = req.cookies.jwt
		if (!token) {
			console.log('No token provided')
			return res
				.status(401)
				.json({ message: 'Unauthorized - No Token Provided' })
		}

		let decoded
		try {
			decoded = jwt.verify(token, process.env.JWT_SECRET)
		} catch (err) {
			console.log('Invalid token:', err.message)
			return res.status(401).json({ message: 'Unauthorized - Invalid Token' })
		}

		const user = await User.findById(decoded.userId).select('-password')
		if (!user) {
			console.log('User not found')
			return res.status(404).json({ message: 'User not found' })
		}

		// Проверка времени истечения сессии
		if (user.sessionExpiresAt && new Date(user.sessionExpiresAt) < new Date()) {
			return res
				.status(401)
				.json({ message: 'Session expired. Please log in again.' })
		}

		// Проверка совпадения sessionId
		if (user.sessionId !== decoded.sessionId) {
			if (!req.loggedOut) {
				console.log('Session mismatch! Logging out user.')
				req.loggedOut = true
			}
			return res.status(401).json({
				message:
					'Session expired due to login from another device. Please log in again.',
			})
		}

		req.user = user
		next()
	} catch (error) {
		console.log('Error in protectRoute middleware:', error.message)
		res.status(500).json({ message: 'Internal server error' })
	}
}




