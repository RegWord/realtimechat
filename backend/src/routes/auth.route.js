
import express from 'express'
import {
	signup,
	login,
	logout,
	updateProfile,
	checkAuth,
	refreshToken,
} from '../controllers/auth.controller.js'
import { protectRoute } from '../middleware/auth.middleware.js'

const router = express.Router()

// Публичные маршруты
router.post('/signup', signup)
router.post('/login', login)

// Защищенные маршруты
router.post('/logout', protectRoute, logout) // Добавляем protectRoute
router.put('/update-profile', protectRoute, updateProfile)
router.get('/check', protectRoute, checkAuth)
router.post('/refresh-token', refreshToken)
export default router
