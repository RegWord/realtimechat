import express from 'express'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import cors from 'cors'
import path from 'path'
import { connectDB } from './lib/db.js'
import authRoutes from './routes/auth.route.js'
import messageRoutes from './routes/message.route.js'
import { app, server } from './lib/socket.js'

// Загрузка переменных окружения
dotenv.config()

// Определение порта
const PORT = process.env.PORT || 5000
const __dirname = path.resolve()

// Middleware
app.use(express.json())
app.use(cookieParser())
app.use(
	cors({
		origin: 'http://localhost:5173',
		credentials: true,
	})
)

// Маршруты
app.use('/api/auth', authRoutes)
app.use('/api/messages', messageRoutes)

// Обработка статических файлов для production
if (process.env.NODE_ENV === 'production') {
	app.use(express.static(path.join(__dirname, '../frontend/dist')))
	app.get('*', (req, res) => {
		res.sendFile(path.join(__dirname, '../frontend', 'dist', 'index.html'))
	})
}

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
	console.error('Global error handler:', err.message)
	const statusCode = err.statusCode || 500
	const message = err.message || 'Internal Server Error'
	res.status(statusCode).json({ message })
})

// Запуск сервера
server.listen(PORT, () => {
	console.log('Server is running on PORT:' + PORT)
	connectDB()
})
