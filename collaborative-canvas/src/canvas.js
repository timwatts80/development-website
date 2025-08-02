// Collaborative Canvas class for real-time drawing
export class CollaborativeCanvas {
    constructor() {
        this.canvas = null
        this.ctx = null
        this.isDrawing = false
        this.lastX = 0
        this.lastY = 0
        this.currentColor = '#000000'
        this.currentSize = 5
        this.socket = null
        this.userId = this.generateUserId()
        this.userName = this.generateUserName()
        this.users = new Map()
        this.cursors = new Map()
        this.isConnected = false
        
        // Drawing state
        this.currentStroke = []
        this.strokeId = 0
        
        // Touch handling
        this.lastTouchX = 0
        this.lastTouchY = 0
        
        // Smoothing variables
        this.points = []
        this.smoothing = 1.0 // Maximum smoothing (100%)
        this.minDistance = 1.5 // Reduced minimum distance for ultra-smooth lines
        this.smoothingBuffer = [] // Buffer for advanced smoothing
        
        // Taper variables with velocity-based sizing
        this.taper = 0.5 // Taper intensity (0-1)
        this.velocityHistory = [] // Track velocity for taper calculations
        this.accelerationHistory = [] // Track acceleration for pressure simulation
        this.lastTimestamp = 0
        this.lastVelocity = 0
        
        // Brush type variables
        this.brushType = 'precision' // 'precision' (fast=thin) or 'expression' (fast=thick)
        this.strokeProgress = 0
        this.totalStrokeDistance = 0
        this.strokeDistances = []
    }
    
    generateUserId() {
        return 'user_' + Math.random().toString(36).substr(2, 9)
    }
    
    generateUserName() {
        const adjectives = ['Creative', 'Artistic', 'Colorful', 'Bold', 'Bright', 'Vivid', 'Dynamic', 'Elegant']
        const nouns = ['Artist', 'Painter', 'Designer', 'Creator', 'Sketcher', 'Illustrator']
        return adjectives[Math.floor(Math.random() * adjectives.length)] + 
               nouns[Math.floor(Math.random() * nouns.length)] + 
               Math.floor(Math.random() * 100)
    }
    
    init() {
        this.setupCanvas()
        this.setupUI()
        this.setupEventListeners()
        this.connectToServer()
        this.updateConnectionStatus('connecting', 'Connecting to server...')
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('drawing-canvas')
        this.ctx = this.canvas.getContext('2d')
        
        // Set canvas size to fill container
        this.resizeCanvas()
        window.addEventListener('resize', () => this.resizeCanvas())
        
        // Configure drawing context for maximum smoothness
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'
        this.ctx.imageSmoothingEnabled = true
        this.ctx.imageSmoothingQuality = 'high'
        
        // Enable sub-pixel rendering for smoother lines
        const pixelRatio = window.devicePixelRatio || 1
        if (pixelRatio > 1) {
            this.canvas.style.width = this.canvas.width + 'px'
            this.canvas.style.height = this.canvas.height + 'px'
            this.canvas.width *= pixelRatio
            this.canvas.height *= pixelRatio
            this.ctx.scale(pixelRatio, pixelRatio)
        }
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement
        const rect = container.getBoundingClientRect()
        
        // Handle high DPI displays for smoother rendering
        const pixelRatio = window.devicePixelRatio || 1
        
        this.canvas.width = rect.width * pixelRatio
        this.canvas.height = rect.height * pixelRatio
        this.canvas.style.width = rect.width + 'px'
        this.canvas.style.height = rect.height + 'px'
        
        // Reconfigure context after resize for smooth lines
        this.ctx.scale(pixelRatio, pixelRatio)
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'
        this.ctx.imageSmoothingEnabled = true
        this.ctx.imageSmoothingQuality = 'high'
    }
    
    setupUI() {
        // Brush size control
        const brushSize = document.getElementById('brush-size')
        const brushSizeDisplay = document.getElementById('brush-size-display')
        
        brushSize.addEventListener('input', (e) => {
            this.currentSize = parseInt(e.target.value)
            brushSizeDisplay.textContent = `${this.currentSize}px`
        })
        
        // Brush type icon buttons
        const precisionBtn = document.getElementById('precision-brush')
        const expressionBtn = document.getElementById('expression-brush')
        
        precisionBtn.addEventListener('click', () => {
            this.brushType = 'precision'
            precisionBtn.classList.add('active')
            expressionBtn.classList.remove('active')
            console.log(`🖌️ Brush type changed to: Precision (fast=thin)`)
        })
        
        expressionBtn.addEventListener('click', () => {
            this.brushType = 'expression'
            expressionBtn.classList.add('active')
            precisionBtn.classList.remove('active')
            console.log(`🖌️ Brush type changed to: Expression (fast=thick)`)
        })
        
        // Taper control
        const taperSlider = document.getElementById('taper')
        const taperDisplay = document.getElementById('taper-display')
        
        taperSlider.addEventListener('input', (e) => {
            this.taper = parseInt(e.target.value) / 100 // Convert to 0-1 range
            taperDisplay.textContent = `${e.target.value}%`
        })
        
        // Color picker
        const colorPicker = document.getElementById('color-picker')
        colorPicker.addEventListener('change', (e) => {
            this.currentColor = e.target.value
        })
        
        // Clear canvas button
        document.getElementById('clear-canvas').addEventListener('click', () => {
            this.clearCanvas()
        })
        
        // Save canvas button
        document.getElementById('save-canvas').addEventListener('click', () => {
            this.saveCanvas()
        })
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.startDrawing(e))
        this.canvas.addEventListener('mousemove', (e) => this.draw(e))
        this.canvas.addEventListener('mouseup', () => this.stopDrawing())
        this.canvas.addEventListener('mouseout', () => this.stopDrawing())
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false })
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false })
        this.canvas.addEventListener('touchend', () => this.stopDrawing(), { passive: false })
        
        // Mouse move for cursor tracking (when not drawing)
        this.canvas.addEventListener('mousemove', (e) => {
            if (!this.isDrawing) {
                this.sendCursorPosition(e)
            }
        })
    }
    
    connectToServer() {
        // For now, simulate connection since we'll build the server separately
        // In a real implementation, this would connect to a Socket.IO server
        setTimeout(() => {
            this.isConnected = true
            this.updateConnectionStatus('connected', 'Connected to server')
            this.updateUserCount(1) // Simulate at least this user
            this.addUser(this.userId, this.userName, this.currentColor)
        }, 1000)
        
        // Removed user simulation - will be handled by real server later
    }
    
    getRandomColor() {
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']
        return colors[Math.floor(Math.random() * colors.length)]
    }
    
    startDrawing(e) {
        this.isDrawing = true
        
        const rect = this.canvas.getBoundingClientRect()
        this.lastX = e.clientX - rect.left
        this.lastY = e.clientY - rect.top
        
        // Start new stroke with enhanced smoothing and velocity-based taper
        this.points = [{ 
            x: this.lastX, 
            y: this.lastY, 
            timestamp: Date.now(),
            velocity: 0,
            acceleration: 0,
            distance: 0
        }]
        this.velocityHistory = [0] // Start with zero velocity
        this.accelerationHistory = [0] // Start with zero acceleration
        this.lastTimestamp = Date.now()
        this.lastVelocity = 0
        
        this.currentStroke = [{
            x: this.lastX,
            y: this.lastY,
            color: this.currentColor,
            size: this.currentSize
        }]
        this.strokeId++
    }
    
    draw(e) {
        if (!this.isDrawing) return
        
        const rect = this.canvas.getBoundingClientRect()
        const currentX = e.clientX - rect.left
        const currentY = e.clientY - rect.top
        const currentTime = Date.now()
        
        // Calculate distance and velocity for taper
        const distance = Math.sqrt(
            Math.pow(currentX - this.lastX, 2) + Math.pow(currentY - this.lastY, 2)
        )
        
        // Use adaptive minimum distance based on drawing speed
        const timeDelta = currentTime - this.lastTimestamp
        const velocity = timeDelta > 0 ? distance / timeDelta : 0
        
        // Adaptive minimum distance: smaller for slow drawing, larger for fast
        const adaptiveMinDistance = Math.max(this.minDistance * 0.5, 
                                           Math.min(this.minDistance * 2, 
                                                  this.minDistance * (1 + velocity * 0.3)))
        
        if (distance < adaptiveMinDistance) return
        
        // Calculate acceleration for pressure simulation
        const acceleration = Math.abs(velocity - this.lastVelocity) / Math.max(timeDelta, 1)
        
        // Update velocity and acceleration history for enhanced taper
        this.velocityHistory.push(velocity)
        this.accelerationHistory.push(acceleration)
        if (this.velocityHistory.length > 8) {
            this.velocityHistory.shift()
            this.accelerationHistory.shift()
        }
        
        // Add point to smoothing array with enhanced metadata
        this.points.push({ 
            x: currentX, 
            y: currentY, 
            timestamp: currentTime,
            velocity: velocity,
            acceleration: acceleration
        })
        
        // Keep optimal number of points for smoothing
        if (this.points.length > 12) { // Increased for better smoothing
            this.points.shift()
        }
        
        // Draw ultra-smooth line with enhanced taper
        this.drawSmoothLine(currentX, currentY)
        
        // Add point to current stroke
        this.currentStroke.push({
            x: currentX,
            y: currentY,
            color: this.currentColor,
            size: this.currentSize
        })
        
        // Send drawing data to server (simulated for now)
        this.sendDrawingData({
            type: 'draw',
            strokeId: this.strokeId,
            points: this.currentStroke,
            userId: this.userId
        })
        
        this.lastX = currentX
        this.lastY = currentY
        this.lastTimestamp = currentTime
        this.lastVelocity = velocity
    }
    
    drawSmoothLine(currentX, currentY) {
        if (this.points.length < 4) {
            // For first few points, use regular line with basic taper
            const taperedSize = this.calculateTaperedSize(this.currentSize)
            this.drawLine(this.lastX, this.lastY, currentX, currentY, this.currentColor, taperedSize)
            return
        }
        
        // Use advanced smoothing with multiple passes for ultra-smooth lines
        const len = this.points.length
        
        // Get more points for better curve fitting
        const p0 = len >= 6 ? this.points[len - 6] : this.points[0]
        const p1 = len >= 5 ? this.points[len - 5] : this.points[0]
        const p2 = this.points[len - 4]
        const p3 = this.points[len - 3]
        const p4 = this.points[len - 2]
        const p5 = this.points[len - 1]
        
        // Apply multi-level smoothing to reduce noise
        const smoothed1 = this.applyMultiPointSmoothing([p0, p1, p2, p3, p4])
        const smoothed2 = this.applyMultiPointSmoothing([p1, p2, p3, p4, p5])
        
        // Calculate adaptive control points for natural curves
        const cp1 = this.calculateAdaptiveControlPoint(smoothed1[1], smoothed1[2], smoothed1[3], true)
        const cp2 = this.calculateAdaptiveControlPoint(smoothed2[1], smoothed2[2], smoothed2[3], false)
        
        // Calculate tapered brush size with enhanced pressure simulation
        const taperedSize = this.calculateTaperedSize(this.currentSize)
        
        // Draw ultra-smooth Bezier curve with variable width
        this.drawAdvancedTaperedBezier(smoothed1[2], cp1, cp2, smoothed2[2], taperedSize)
    }
    
    // Apply multi-point smoothing to reduce jitter and noise
    applyMultiPointSmoothing(points) {
        if (points.length < 3) return points
        
        const smoothed = []
        
        // First point remains unchanged
        smoothed.push(points[0])
        
        // Apply weighted averaging to middle points
        for (let i = 1; i < points.length - 1; i++) {
            const prev = points[i - 1]
            const curr = points[i]
            const next = points[i + 1]
            
            // Weighted smoothing: more weight on current point
            const smoothedPoint = {
                x: (prev.x * 0.2 + curr.x * 0.6 + next.x * 0.2),
                y: (prev.y * 0.2 + curr.y * 0.6 + next.y * 0.2),
                timestamp: curr.timestamp
            }
            
            smoothed.push(smoothedPoint)
        }
        
        // Last point remains unchanged
        smoothed.push(points[points.length - 1])
        
        return smoothed
    }
    
    // Calculate adaptive control points that respond to drawing direction and curvature
    calculateAdaptiveControlPoint(p1, p2, p3, isFirst) {
        const smoothingFactor = this.smoothing * 0.25 // Increased factor for smoother curves
        
        // Calculate curvature to adapt smoothing strength
        const dx1 = p2.x - p1.x
        const dy1 = p2.y - p1.y
        const dx2 = p3.x - p2.x
        const dy2 = p3.y - p2.y
        
        // Detect sharp turns and reduce smoothing to preserve intentional angles
        const angle = Math.abs(Math.atan2(dy1, dx1) - Math.atan2(dy2, dx2))
        const isSharpTurn = angle > Math.PI / 3 // More than 60 degrees
        const adaptiveFactor = isSharpTurn ? smoothingFactor * 0.5 : smoothingFactor
        
        if (isFirst) {
            return {
                x: p2.x + (p3.x - p1.x) * adaptiveFactor,
                y: p2.y + (p3.y - p1.y) * adaptiveFactor
            }
        } else {
            return {
                x: p2.x - (p3.x - p1.x) * adaptiveFactor,
                y: p2.y - (p3.y - p1.y) * adaptiveFactor
            }
        }
    }
    
    // Enhanced Bezier drawing with better anti-aliasing and smoothing
    drawAdvancedTaperedBezier(p1, cp1, cp2, p2, size) {
        this.ctx.globalCompositeOperation = 'source-over'
        this.ctx.strokeStyle = this.currentColor
        this.ctx.lineWidth = size
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'
        
        // Enable additional smoothing options
        this.ctx.imageSmoothingEnabled = true
        this.ctx.imageSmoothingQuality = 'high'
        
        // For very small sizes, use sub-pixel rendering
        if (size < 2) {
            this.ctx.globalAlpha = 0.8 + (size / 2) * 0.2 // Slight transparency for fine lines
        } else {
            this.ctx.globalAlpha = 1.0
        }
        
        this.ctx.beginPath()
        this.ctx.moveTo(p1.x, p1.y)
        this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y)
        this.ctx.stroke()
        
        // Reset alpha
        this.ctx.globalAlpha = 1.0
    }
    
    // Calculate tapered brush size based on brush type and velocity
    calculateTaperedSize(baseSize) {
        if (this.taper === 0) {
            return baseSize
        }
        
        if (this.velocityHistory.length === 0) {
            return baseSize
        }
        
        // Use weighted average giving more importance to recent velocity
        let weightedVelocity = 0
        let totalWeight = 0
        for (let i = 0; i < this.velocityHistory.length; i++) {
            const weight = i + 1 // More recent = higher weight
            weightedVelocity += this.velocityHistory[i] * weight
            totalWeight += weight
        }
        const avgVelocity = weightedVelocity / totalWeight
        
        const maxVelocity = 2.5 // Adjusted for better sensitivity
        const normalizedVelocity = Math.min(avgVelocity / maxVelocity, 1.0)
        
        // Smoother taper curve for both brush types
        const smoothedVelocity = normalizedVelocity * normalizedVelocity * (3 - 2 * normalizedVelocity)
        
        if (this.brushType === 'precision') {
            // Precision Brush: faster = thinner, slower = thicker (original behavior)
            const taperFactor = 1.0 - (smoothedVelocity * this.taper * 0.75) // Max 75% reduction
            const minSize = baseSize * 0.25 // 25% minimum
            return Math.max(baseSize * taperFactor, minSize)
        } else if (this.brushType === 'expression') {
            // Expression Brush: faster = thicker, slower = thinner (reversed behavior)
            const taperFactor = 1.0 + (smoothedVelocity * this.taper * 0.75) // Max 75% increase
            const maxSize = baseSize * 1.75 // 175% maximum
            const minSize = baseSize * 0.25 // 25% minimum when slow
            
            // When velocity is low, reduce size; when high, increase size
            const adjustedSize = baseSize * (0.25 + (smoothedVelocity * 1.5)) // Range from 25% to 175%
            const finalSize = baseSize + ((adjustedSize - baseSize) * this.taper)
            
            return Math.max(Math.min(finalSize, maxSize), minSize)
        }
        
        return baseSize
    }
    
    // Draw tapered Bezier curve using multiple segments with varying width
    drawTaperedBezier(p1, cp1, cp2, p2, size) {
        this.ctx.globalCompositeOperation = 'source-over'
        this.ctx.strokeStyle = this.currentColor
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'
        
        // For simple implementation, use the calculated size
        // In the future, we could implement true variable-width strokes
        this.ctx.lineWidth = size
        
        this.ctx.beginPath()
        this.ctx.moveTo(p1.x, p1.y)
        this.ctx.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, p2.x, p2.y)
        this.ctx.stroke()
    }
    
    // Average three points to reduce noise and jitter
    averagePoint(p1, p2, p3) {
        return {
            x: (p1.x + p2.x + p3.x) / 3,
            y: (p1.y + p2.y + p3.y) / 3
        }
    }
    
    // Calculate control point for Bezier curve
    calculateControlPoint(p1, p2, p3, isFirst) {
        const smoothingFactor = this.smoothing * 0.2 // Reduced factor for more natural curves
        
        if (isFirst) {
            return {
                x: p2.x + (p3.x - p1.x) * smoothingFactor,
                y: p2.y + (p3.y - p1.y) * smoothingFactor
            }
        } else {
            return {
                x: p2.x - (p3.x - p1.x) * smoothingFactor,
                y: p2.y - (p3.y - p1.y) * smoothingFactor
            }
        }
    }
    
    stopDrawing() {
        if (!this.isDrawing) return
        
        this.isDrawing = false
        
        // Send final stroke data
        if (this.currentStroke.length > 0) {
            this.sendDrawingData({
                type: 'strokeComplete',
                strokeId: this.strokeId,
                points: this.currentStroke,
                userId: this.userId
            })
        }
        
        this.currentStroke = []
    }
    
    handleTouchStart(e) {
        e.preventDefault()
        const touch = e.touches[0]
        const rect = this.canvas.getBoundingClientRect()
        
        this.isDrawing = true
        this.lastTouchX = touch.clientX - rect.left
        this.lastTouchY = touch.clientY - rect.top
        this.lastX = this.lastTouchX
        this.lastY = this.lastTouchY
        
        // Start new stroke with enhanced smoothing and velocity-based taper
        this.points = [{ 
            x: this.lastX, 
            y: this.lastY, 
            timestamp: Date.now(),
            velocity: 0,
            acceleration: 0
        }]
        this.velocityHistory = [0] // Start with zero velocity
        this.accelerationHistory = [0] // Start with zero acceleration
        this.lastTimestamp = Date.now()
        this.lastVelocity = 0
        
        this.currentStroke = [{
            x: this.lastX,
            y: this.lastY,
            color: this.currentColor,
            size: this.currentSize
        }]
        this.strokeId++
    }
    
    handleTouchMove(e) {
        e.preventDefault()
        if (!this.isDrawing) return
        
        const touch = e.touches[0]
        const rect = this.canvas.getBoundingClientRect()
        const currentX = touch.clientX - rect.left
        const currentY = touch.clientY - rect.top
        const currentTime = Date.now()
        
        // Calculate distance and velocity for taper
        const distance = Math.sqrt(
            Math.pow(currentX - this.lastX, 2) + Math.pow(currentY - this.lastY, 2)
        )
        
        // Use adaptive minimum distance for touch (more sensitive and adaptive)
        const timeDelta = currentTime - this.lastTimestamp
        const velocity = timeDelta > 0 ? distance / timeDelta : 0
        
        // More sensitive adaptive distance for touch
        const adaptiveMinDistance = Math.max(this.minDistance * 0.3, 
                                           Math.min(this.minDistance * 1.5, 
                                                  this.minDistance * (1 + velocity * 0.2)))
        
        if (distance < adaptiveMinDistance) return
        
        // Calculate acceleration for pressure simulation
        const acceleration = Math.abs(velocity - this.lastVelocity) / Math.max(timeDelta, 1)
        
        // Update velocity and acceleration history for enhanced taper
        this.velocityHistory.push(velocity)
        this.accelerationHistory.push(acceleration)
        if (this.velocityHistory.length > 8) {
            this.velocityHistory.shift()
            this.accelerationHistory.shift()
        }
        
        // Add point to smoothing array with enhanced metadata
        this.points.push({ 
            x: currentX, 
            y: currentY, 
            timestamp: currentTime,
            velocity: velocity,
            acceleration: acceleration
        })
        
        // Keep optimal number of points for smoothing
        if (this.points.length > 12) {
            this.points.shift()
        }
        
        // Draw ultra-smooth line with enhanced taper
        this.drawSmoothLine(currentX, currentY)
        
        // Add point to current stroke
        this.currentStroke.push({
            x: currentX,
            y: currentY,
            color: this.currentColor,
            size: this.currentSize
        })
        
        // Send drawing data
        this.sendDrawingData({
            type: 'draw',
            strokeId: this.strokeId,
            points: this.currentStroke,
            userId: this.userId
        })
        
        this.lastX = currentX
        this.lastY = currentY
        this.lastTimestamp = currentTime
        this.lastVelocity = velocity
    }
    
    drawLine(x1, y1, x2, y2, color, size) {
        this.ctx.globalCompositeOperation = 'source-over'
        this.ctx.strokeStyle = color
        this.ctx.lineWidth = size
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'
        
        this.ctx.beginPath()
        this.ctx.moveTo(x1, y1)
        this.ctx.lineTo(x2, y2)
        this.ctx.stroke()
    }
    
    sendDrawingData(data) {
        // In a real implementation, this would send via Socket.IO
        // For now, just store locally - no simulation
        console.log('Drawing data:', data)
    }
    
    sendCursorPosition(e) {
        const rect = this.canvas.getBoundingClientRect()
        const x = e.clientX - rect.left
        const y = e.clientY - rect.top
        
        // In a real implementation, send cursor position to server
        // For now, just update local cursor tracking
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        
        // Send clear command to server
        this.sendDrawingData({
            type: 'clear',
            userId: this.userId
        })
    }
    
    saveCanvas() {
        const link = document.createElement('a')
        link.download = `collaborative-canvas-${Date.now()}.png`
        link.href = this.canvas.toDataURL()
        link.click()
    }
    
    updateConnectionStatus(status, message) {
        const indicator = document.getElementById('status-indicator')
        const text = document.getElementById('status-text')
        
        indicator.className = `status-indicator ${status}`
        text.textContent = message
    }
    
    updateUserCount(count) {
        document.getElementById('user-count').textContent = `${count} user${count !== 1 ? 's' : ''} online`
    }
    
    addUser(userId, userName, color) {
        this.users.set(userId, { name: userName, color })
        this.updateUsersList()
        this.updateUserCount(this.users.size)
    }
    
    removeUser(userId) {
        this.users.delete(userId)
        this.removeCursor(userId)
        this.updateUsersList()
        this.updateUserCount(this.users.size)
    }
    
    updateUsersList() {
        const usersList = document.getElementById('users-list')
        usersList.innerHTML = ''
        
        this.users.forEach((user, userId) => {
            const userItem = document.createElement('div')
            userItem.className = 'user-item'
            userItem.innerHTML = `
                <div class="user-color" style="background-color: ${user.color}"></div>
                <span>${user.name}</span>
            `
            usersList.appendChild(userItem)
        })
    }
    
    showCursor(userId, x, y) {
        if (!this.users.has(userId)) return
        
        const user = this.users.get(userId)
        let cursor = this.cursors.get(userId)
        
        if (!cursor) {
            cursor = document.createElement('div')
            cursor.className = 'user-cursor'
            cursor.setAttribute('data-username', user.name)
            cursor.style.borderColor = user.color
            cursor.style.backgroundColor = user.color + '40' // Add transparency
            document.getElementById('cursors-layer').appendChild(cursor)
            this.cursors.set(userId, cursor)
        }
        
        cursor.style.left = x + 'px'
        cursor.style.top = y + 'px'
        cursor.style.display = 'block'
    }
    
    removeCursor(userId) {
        const cursor = this.cursors.get(userId)
        if (cursor) {
            cursor.remove()
            this.cursors.delete(userId)
        }
    }
}
