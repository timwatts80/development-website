// Real-time collaborative canvas application
import './style.css'
import { CollaborativeCanvas } from './canvas.js'

document.addEventListener('DOMContentLoaded', () => {
    const canvas = new CollaborativeCanvas()
    canvas.init()
})
