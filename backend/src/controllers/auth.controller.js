import { generateToken } from '../lib/utils.js'
import User from '../models/user.model.js'
import bcrypt from 'bcryptjs'
import cloudinary from '../lib/cloudinary.js'
import { v4 as uuidv4 } from 'uuid'
import jwt from 'jsonwebtoken'

export const signup = async (req, res) => {
	const { fullName, email, password } = req.body
	try {
		if (!fullName || !email || !password) {
			return res.status(400).json({ message: 'All fields are required' })
		}

		if (password.length < 6) {
			return res
				.status(400)
				.json({ message: 'Password must be at least 6 characters' })
		}

		const existingUser = await User.findOne({ email })
		if (existingUser) {
			return res.status(400).json({ message: 'Email already exists' })
		}

		const salt = await bcrypt.genSalt(10)
		const hashedPassword = await bcrypt.hash(password, salt)
		const newSessionId = uuidv4()

		const newUser = new User({
			fullName,
			email,
			password: hashedPassword,
			sessionId: newSessionId,
		})

		await newUser.save()

		const token = jwt.sign(
			{ userId: newUser._id, sessionId: newSessionId },
			process.env.JWT_SECRET,
			{ expiresIn: '1h' }
		)

		res.cookie('jwt', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			maxAge: 3600000, // 1 час
		})

		res.status(201).json({
			_id: newUser._id,
			fullName: newUser.fullName,
			email: newUser.email,
			profilePic: newUser.profilePic,
			sessionId: newSessionId,
		})
	} catch (error) {
		console.log('Error in signup controller:', error.message)
		res.status(500).json({ message: 'Internal Server Error' })
	}
}

export const login = async (req, res) => {
	const { email, password } = req.body
	try {
		const user = await User.findOne({ email })
		if (!user) {
			return res.status(400).json({ message: 'Invalid credentials' })
		}
		const isMatch = await bcrypt.compare(password, user.password)
		if (!isMatch) {
			return res.status(400).json({ message: 'Invalid credentials' })
		}

		// Генерация нового sessionId
		const newSessionId = uuidv4()

		// Установка времени истечения сессии (24 часа)
		const sessionDuration = 24 * 60 * 60 * 1000 // 24 часа в миллисекундах
		const sessionExpiresAt = new Date(Date.now() + sessionDuration)

		// Обновление sessionId и времени истечения в базе данных
		user.sessionId = newSessionId
		user.sessionExpiresAt = sessionExpiresAt
		await user.save()

		console.log(`User ${user.email} logged in with sessionId: ${newSessionId}`)

		// Создание нового JWT токена
		const token = jwt.sign(
			{ userId: user._id, sessionId: newSessionId },
			process.env.JWT_SECRET,
			{ expiresIn: '1h' }
		)

		// Установка токена в cookie
		res.cookie('jwt', token, {
			httpOnly: true,
			secure: process.env.NODE_ENV === 'production',
			sameSite: 'lax',
			maxAge: 3600000, // 1 час
		})

		res.status(200).json({
			_id: user._id,
			fullName: user.fullName,
			email: user.email,
			profilePic: user.profilePic,
			sessionId: newSessionId,
		})
	} catch (error) {
		console.log('Error in login controller:', error.message)
		res.status(500).json({ message: 'Internal Server Error' })
	}
}

export const logout = async (req, res) => {
	try {
		// Проверяем, что req.user существует
		if (!req.user) {
			return res.status(401).json({ message: 'Unauthorized' })
		}

		const userId = req.user._id

		// Очистка sessionId в базе данных
		await User.findByIdAndUpdate(userId, { sessionId: null })

		// Удаление токена из cookies
		res.cookie('jwt', '', { maxAge: 0 })

		res.status(200).json({ message: 'Logged out successfully' })
	} catch (error) {
		console.log('Error in logout controller:', error.message)
		res.status(500).json({ message: 'Internal Server Error' })
	}
}

export const updateProfile = async (req, res) => {
	try {
		const { profilePic } = req.body
		const userId = req.user._id

		if (!profilePic) {
			return res.status(400).json({ message: 'Profile pic is required' })
		}

		const uploadResponse = await cloudinary.uploader.upload(profilePic)
		const updatedUser = await User.findByIdAndUpdate(
			userId,
			{ profilePic: uploadResponse.secure_url },
			{ new: true }
		)

		res.status(200).json(updatedUser)
	} catch (error) {
		console.log('Error in updateProfile controller:', error.message)
		res.status(500).json({ message: 'Internal Server Error' })
	}
}

export const checkAuth = async (req, res) => {
	try {
		if (!req.user) {
			return res.status(401).json({ message: 'Unauthorized' })
		}

		res.status(200).json(req.user)
	} catch (error) {
		console.log('Error in checkAuth controller:', error.message)
		res.status(500).json({ message: 'Internal Server Error' })
	}
}

export const refreshToken = async (req, res) => {
	const { refreshToken } = req.body
	try {
		const user = await User.findOne({ refreshToken })
		if (!user) {
			return res.status(401).json({ message: 'Invalid refresh token' })
		}

		// Создание нового access token
		const newAccessToken = jwt.sign(
			{ userId: user._id, sessionId: user.sessionId },
			process.env.JWT_SECRET,
			{ expiresIn: '1h' }
		)

		res.json({ accessToken: newAccessToken })
	} catch (error) {
		console.log('Error in refreshToken:', error.message)
		res.status(500).json({ message: 'Internal Server Error' })
	}
}