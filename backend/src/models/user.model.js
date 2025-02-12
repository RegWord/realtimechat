import mongoose from 'mongoose'

const userSchema = new mongoose.Schema(
	{
		email: {
			type: String,
			required: true,
			unique: true,
		},
		fullName: {
			type: String,
			required: true,
		},
		password: {
			type: String,
			required: true,
			minlength: 6,
		},
		profilePic: {
			type: String,
			default: '',
		},
		sessionId: {
			type: String,
			default: null,
		},
		sessionExpiresAt: {
			type: Date,
			default: null,
		}, // Новое поле для времени истечения сессии
		refreshToken: {
			type: String,
			default: null,
		},
	},
	{ timestamps: true }
)

const User = mongoose.model('User', userSchema)
export default User
