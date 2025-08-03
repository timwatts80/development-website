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
        this.taper = 0.5 // Taper intensity (-1 to 1 range, 50% = 0.5)
        this.velocityHistory = [] // Track velocity for taper calculations
        this.accelerationHistory = [] // Track acceleration for pressure simulation
        this.lastTimestamp = 0
        this.lastVelocity = 0
        
        // Brush type variables
        this.brushType = 'ink-pen' // 'ink-pen' or 'eraser'
        this.isEraser = false // Whether eraser mode is active
        this.strokeProgress = 0
        this.totalStrokeDistance = 0
        this.strokeDistances = []
        
        // Undo/Redo system
        this.canvasStates = [] // Store canvas states for undo
        this.maxUndoStates = 20 // Maximum number of undo states
        this.currentStateIndex = -1
        
        // Zoom system
        this.zoomLevel = 1.0
        this.baseZoom = 1.0 // The zoom level that represents 100% (fully in view)
        this.minZoom = 0.1
        this.maxZoom = 5.0
        this.canvasWidth = 1536 // Fixed canvas width (desktop landscape)
        this.canvasHeight = 1080 // Fixed canvas height
        
        // For mobile, we'll calculate responsive dimensions
        this.isMobile = window.innerWidth <= 768
        if (this.isMobile) {
            this.setMobileCanvasDimensions()
        }
        
        // Pan system
        this.panX = 0 // Pan offset X
        this.panY = 0 // Pan offset Y
        this.isPanning = false
        this.lastPanX = 0
        this.lastPanY = 0
        this.isHandTool = false // Whether hand tool is active
    }
    
    // Convert screen coordinates to canvas coordinates accounting for zoom and pan
    getCanvasCoordinates(clientX, clientY) {
        const rect = this.canvas.getBoundingClientRect()
        
        // Get relative position within the displayed canvas (0 to 1)
        const relativeX = (clientX - rect.left) / rect.width
        const relativeY = (clientY - rect.top) / rect.height
        
        // Convert to canvas coordinates (since canvas is now 1:1 with logical size)
        const canvasX = relativeX * this.canvasWidth
        const canvasY = relativeY * this.canvasHeight
        
        return {
            x: canvasX,
            y: canvasY
        }
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
    
    setMobileCanvasDimensions() {
        // Get the canvas wrapper dimensions
        const container = document.querySelector('.canvas-wrapper')
        if (!container) {
            console.warn('Canvas wrapper not found for mobile sizing')
            return
        }
        
        // Use viewport dimensions as fallback if container isn't ready
        const viewportWidth = window.innerWidth
        const viewportHeight = window.innerHeight
        
        // Account for toolbar height (approximately 80px) and padding
        const toolbarHeight = 80
        const padding = 32 // 16px on all sides = 32px total per dimension
        
        // Calculate available space
        const availableWidth = viewportWidth - padding
        const availableHeight = viewportHeight - toolbarHeight - padding
        
        // Set canvas dimensions to fill the available space
        this.canvasWidth = Math.max(availableWidth, 320) // Minimum width
        this.canvasHeight = Math.max(availableHeight, 240) // Minimum height
        
        console.log(`Mobile canvas size: ${this.canvasWidth}x${this.canvasHeight}`)
    }
    
    init() {
        this.setupCanvas()
        this.setupUI()
        this.setupEventListeners()
        this.connectToServer()
        this.updateConnectionStatus('connecting', 'Connecting to server...')
        this.updateCursor() // Set initial cursor
        
        // Delay the initial positioning to ensure container is properly sized
        setTimeout(() => {
            this.resizeCanvas()
        }, 100)
        
        // Save initial canvas state for undo functionality
        this.saveCanvasState()
    }
    
    setupCanvas() {
        this.canvas = document.getElementById('drawing-canvas')
        this.ctx = this.canvas.getContext('2d')
        
        // Set up resize listener (initial sizing will be done in init())
        window.addEventListener('resize', () => this.resizeCanvas())
        
        // Configure drawing context for maximum smoothness
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'
        this.ctx.imageSmoothingEnabled = true
        this.ctx.imageSmoothingQuality = 'high'
        
        // Set canvas to initial size
        this.canvas.width = this.canvasWidth
        this.canvas.height = this.canvasHeight
        
        // Set white background
        this.ctx.fillStyle = 'white'
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
        
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
        // Check if we're on mobile and update canvas dimensions if needed
        const wasMobile = this.isMobile
        this.isMobile = window.innerWidth <= 768
        
        // If mobile state changed or we're on mobile, recalculate canvas dimensions
        if (this.isMobile && (!wasMobile || this.isMobile)) {
            this.setMobileCanvasDimensions()
        } else if (!this.isMobile && wasMobile) {
            // Switched from mobile to desktop, restore desktop dimensions
            this.canvasWidth = 1536
            this.canvasHeight = 1080
        }
        
        // Use canvas-wrapper as the container for measuring available space
        const container = document.querySelector('.canvas-wrapper')
        if (!container) {
            console.error('Canvas wrapper not found')
            return
        }
        
        const rect = container.getBoundingClientRect()
        
        // Ensure we have valid dimensions
        if (rect.width === 0 || rect.height === 0) {
            console.log('Container not ready, retrying...')
            setTimeout(() => this.resizeCanvas(), 50)
            return
        }
        
        // Set canvas to logical size (not scaled by pixel ratio for simpler coordinate handling)
        this.canvas.width = this.canvasWidth
        this.canvas.height = this.canvasHeight
        
        // Calculate the base zoom level that fits the canvas fully in view with padding
        // Account for the available space minus some padding
        const availableWidth = rect.width - 40 // Leave 20px padding on each side
        const availableHeight = rect.height - 40 // Leave 20px padding on top/bottom
        
        const scaleX = availableWidth / this.canvasWidth
        const scaleY = availableHeight / this.canvasHeight
        this.baseZoom = Math.min(scaleX, scaleY) // Use the limiting dimension
        
        // Ensure base zoom is reasonable (not too small)
        this.baseZoom = Math.max(this.baseZoom, 0.1)
        
        // Set initial zoom to base zoom (100%)
        this.zoomLevel = this.baseZoom
        
        // Reset pan to center
        this.panX = 0
        this.panY = 0
        
        // Apply current zoom and pan
        this.updateCanvasTransform()
        
        // Update zoom display
        this.updateZoomDisplay()
        
        // Configure context for smooth lines
        this.ctx.lineCap = 'round'
        this.ctx.lineJoin = 'round'
        this.ctx.imageSmoothingEnabled = true
        this.ctx.imageSmoothingQuality = 'high'
        this.ctx.lineJoin = 'round'
        this.ctx.imageSmoothingEnabled = true
        this.ctx.imageSmoothingQuality = 'high'
        
        // Set white background
        this.ctx.fillStyle = 'white'
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
    }
    
    setupUI() {
        // Initialize ink pen as default and show taper slider
        document.getElementById('taper-group').style.display = 'flex'
        
        // Brush size control
        const brushSize = document.getElementById('brush-size')
        const brushSizeDisplay = document.getElementById('brush-size-display')
        
        brushSize.addEventListener('input', (e) => {
            this.currentSize = parseInt(e.target.value)
            brushSizeDisplay.textContent = `${this.currentSize}px`
            this.updateCursor()
        })
        
        // Brush type icon buttons
        const inkPenBtn = document.getElementById('ink-pen')
        const eraserBtn = document.getElementById('eraser-brush')
        
        inkPenBtn.addEventListener('click', () => {
            this.brushType = 'ink-pen'
            this.isEraser = false
            this.isHandTool = false
            inkPenBtn.classList.add('active')
            eraserBtn.classList.remove('active')
            document.getElementById('hand-tool').classList.remove('active')
            // Show taper slider when ink pen is selected
            document.getElementById('taper-group').style.display = 'flex'
            // Show brush size slider when ink pen is selected
            document.getElementById('brush-size-group').style.display = 'flex'
            this.updateCursor()
            console.log(`�️ Brush type changed to: Ink Pen`)
        })
        
        eraserBtn.addEventListener('click', () => {
            this.isEraser = true
            this.isHandTool = false
            eraserBtn.classList.add('active')
            inkPenBtn.classList.remove('active')
            document.getElementById('hand-tool').classList.remove('active')
            // Hide taper slider when eraser is selected
            document.getElementById('taper-group').style.display = 'none'
            // Show brush size slider when eraser is selected
            document.getElementById('brush-size-group').style.display = 'flex'
            this.updateCursor()
            console.log(`🧽 Eraser mode activated`)
        })
        
        // Taper control
        const taperSlider = document.getElementById('taper')
        const taperDisplay = document.getElementById('taper-display')
        
        taperSlider.addEventListener('input', (e) => {
            this.taper = parseInt(e.target.value) / 100 // Convert to -1 to 1 range
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
        
        // Undo button
        document.getElementById('undo-btn').addEventListener('click', () => {
            this.undo()
        })
        
        // Hand tool
        const handToolBtn = document.getElementById('hand-tool')
        if (handToolBtn) {
            handToolBtn.addEventListener('click', () => {
                this.isHandTool = !this.isHandTool
                if (this.isHandTool) {
                    handToolBtn.classList.add('active')
                    // Deactivate brush tools when hand tool is active
                    document.getElementById('ink-pen').classList.remove('active')
                    document.getElementById('eraser-brush').classList.remove('active')
                    this.isEraser = false
                    // Hide sliders when hand tool is active
                    document.getElementById('taper-group').style.display = 'none'
                    document.getElementById('brush-size-group').style.display = 'none'
                    this.canvas.style.cursor = 'grab'
                    console.log('🤚 Hand tool activated')
                } else {
                    handToolBtn.classList.remove('active')
                    // Reactivate ink pen as default
                    document.getElementById('ink-pen').classList.add('active')
                    this.brushType = 'ink-pen'
                    // Show sliders when returning to ink pen
                    document.getElementById('taper-group').style.display = 'flex'
                    document.getElementById('brush-size-group').style.display = 'flex'
                    this.updateCursor()
                    console.log('�️ Drawing mode restored')
                }
            })
        }
        
        // Zoom controls
        const zoomInBtn = document.getElementById('zoom-in')
        const zoomOutBtn = document.getElementById('zoom-out')
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener('click', () => {
                this.zoomIn()
            })
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener('click', () => {
                this.zoomOut()
            })
        }
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => {
            if (this.isHandTool) {
                this.startPan(e)
            } else {
                this.startDrawing(e)
            }
        })
        
        this.canvas.addEventListener('mousemove', (e) => {
            if (this.isHandTool && this.isPanning) {
                this.updatePan(e)
            } else if (!this.isHandTool) {
                this.draw(e)
            }
        })
        
        this.canvas.addEventListener('mouseup', () => {
            if (this.isHandTool) {
                this.stopPan()
            } else {
                this.stopDrawing()
            }
        })
        
        this.canvas.addEventListener('mouseout', () => {
            if (this.isHandTool) {
                this.stopPan()
            } else {
                this.stopDrawing()
            }
        })
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => {
            if (this.isHandTool) {
                this.handleTouchStartPan(e)
            } else {
                this.handleTouchStart(e)
            }
        }, { passive: false })
        
        this.canvas.addEventListener('touchmove', (e) => {
            if (this.isHandTool && this.isPanning) {
                this.handleTouchMovePan(e)
            } else if (!this.isHandTool) {
                this.handleTouchMove(e)
            }
        }, { passive: false })
        
        this.canvas.addEventListener('touchend', () => {
            if (this.isHandTool) {
                this.stopPan()
            } else {
                this.stopDrawing()
            }
        }, { passive: false })
        
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
        
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY)
        this.lastX = coords.x
        this.lastY = coords.y
        
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
        
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY)
        const currentX = coords.x
        const currentY = coords.y
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
        // Set composite operation based on eraser mode
        this.ctx.globalCompositeOperation = this.isEraser ? 'destination-out' : 'source-over'
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
    
    // Calculate tapered brush size based on ink pen taper value and velocity
    calculateTaperedSize(baseSize) {
        // Eraser should always have consistent size without taper
        if (this.isEraser) {
            return baseSize
        }
        
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
        
        // Smoother taper curve for ink pen
        const smoothedVelocity = normalizedVelocity * normalizedVelocity * (3 - 2 * normalizedVelocity)
        
        // Ink pen behavior with positive and negative taper values
        if (this.brushType === 'ink-pen') {
            if (this.taper >= 0) {
                // Positive taper (0% to 100%): Precision behavior - faster = thinner, slower = thicker
                const taperFactor = 1.0 - (smoothedVelocity * this.taper * 0.75) // Max 75% reduction
                const minSize = baseSize * 0.25 // 25% minimum
                return Math.max(baseSize * taperFactor, minSize)
            } else {
                // Negative taper (-100% to 0%): Expression behavior - faster = thicker, slower = thinner
                const absTaper = Math.abs(this.taper) // Convert to positive for calculations
                const taperFactor = 1.0 + (smoothedVelocity * absTaper * 0.75) // Max 75% increase
                const maxSize = baseSize * 1.75 // 175% maximum
                const minSize = baseSize * 0.25 // 25% minimum when slow
                
                // When velocity is low, reduce size; when high, increase size
                const adjustedSize = baseSize * (0.25 + (smoothedVelocity * 1.5)) // Range from 25% to 175%
                const finalSize = baseSize + ((adjustedSize - baseSize) * absTaper)
                
                return Math.max(Math.min(finalSize, maxSize), minSize)
            }
        }
        
        return baseSize
    }
    
    // Draw tapered Bezier curve using multiple segments with varying width
    drawTaperedBezier(p1, cp1, cp2, p2, size) {
        // Set composite operation based on eraser mode
        this.ctx.globalCompositeOperation = this.isEraser ? 'destination-out' : 'source-over'
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
        
        // Save canvas state for undo functionality
        this.saveCanvasState()
    }
    
    handleTouchStart(e) {
        e.preventDefault()
        const touch = e.touches[0]
        
        this.isDrawing = true
        const coords = this.getCanvasCoordinates(touch.clientX, touch.clientY)
        this.lastTouchX = coords.x
        this.lastTouchY = coords.y
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
        const coords = this.getCanvasCoordinates(touch.clientX, touch.clientY)
        const currentX = coords.x
        const currentY = coords.y
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
        // Set composite operation based on eraser mode
        this.ctx.globalCompositeOperation = this.isEraser ? 'destination-out' : 'source-over'
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
    
    updateCursor() {
        // Create a custom cursor that matches the brush size
        const size = Math.min(Math.max(this.currentSize, 4), 100) // Clamp size for visibility
        const cursorSize = Math.max(size * 2, 20) // Make cursor slightly larger than brush for visibility
        const half = cursorSize / 2
        
        // Create SVG cursor
        let cursorSvg
        if (this.isEraser) {
            // Eraser cursor - square with dashed border
            cursorSvg = `
                <svg width="${cursorSize}" height="${cursorSize}" xmlns="http://www.w3.org/2000/svg">
                    <rect x="2" y="2" width="${cursorSize - 4}" height="${cursorSize - 4}" 
                          fill="none" stroke="#666" stroke-width="2" stroke-dasharray="4,2" opacity="0.8"/>
                    <rect x="1" y="1" width="${cursorSize - 2}" height="${cursorSize - 2}" 
                          fill="none" stroke="#fff" stroke-width="1" stroke-dasharray="4,2" opacity="0.6"/>
                </svg>
            `
        } else {
            // Brush cursor - circle with cross hair
            cursorSvg = `
                <svg width="${cursorSize}" height="${cursorSize}" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="${half}" cy="${half}" r="${size}" fill="none" stroke="#666" stroke-width="2" opacity="0.8"/>
                    <circle cx="${half}" cy="${half}" r="${size}" fill="none" stroke="#fff" stroke-width="1" opacity="0.6"/>
                    <line x1="${half}" y1="0" x2="${half}" y2="${cursorSize}" stroke="#666" stroke-width="1" opacity="0.6"/>
                    <line x1="0" y1="${half}" x2="${cursorSize}" y2="${half}" stroke="#666" stroke-width="1" opacity="0.6"/>
                    <circle cx="${half}" cy="${half}" r="2" fill="#666" opacity="0.8"/>
                </svg>
            `
        }
        
        // Convert SVG to data URL
        const svgBlob = new Blob([cursorSvg], { type: 'image/svg+xml' })
        const svgUrl = URL.createObjectURL(svgBlob)
        
        // Apply cursor to canvas
        this.canvas.style.cursor = `url(${svgUrl}) ${half} ${half}, crosshair`
        
        // Clean up old URL after a delay to avoid flicker
        setTimeout(() => URL.revokeObjectURL(svgUrl), 1000)
    }
    
    sendCursorPosition(e) {
        const coords = this.getCanvasCoordinates(e.clientX, e.clientY)
        const x = coords.x
        const y = coords.y
        
        // In a real implementation, send cursor position to server
        // For now, just update local cursor tracking
    }
    
    clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
        
        // Restore white background
        this.ctx.fillStyle = 'white'
        this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight)
        
        // Send clear command to server
        this.sendDrawingData({
            type: 'clear',
            userId: this.userId
        })
        
        // Save canvas state for undo functionality
        this.saveCanvasState()
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
    
    // Undo/Redo functionality
    saveCanvasState() {
        // Remove any states after current index (for redo functionality)
        this.canvasStates = this.canvasStates.slice(0, this.currentStateIndex + 1)
        
        // Add new state
        const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
        this.canvasStates.push(imageData)
        this.currentStateIndex++
        
        // Limit the number of stored states
        if (this.canvasStates.length > this.maxUndoStates) {
            this.canvasStates.shift()
            this.currentStateIndex--
        }
        
        this.updateUndoButtonState()
    }
    
    undo() {
        if (this.currentStateIndex > 0) {
            this.currentStateIndex--
            const imageData = this.canvasStates[this.currentStateIndex]
            this.ctx.putImageData(imageData, 0, 0)
            this.updateUndoButtonState()
        }
    }
    
    updateUndoButtonState() {
        const undoBtn = document.getElementById('undo-btn')
        if (undoBtn) {
            undoBtn.disabled = this.currentStateIndex <= 0
            undoBtn.style.opacity = this.currentStateIndex <= 0 ? '0.5' : '1'
        }
    }
    
    // Pan methods
    startPan(e) {
        this.isPanning = true
        this.lastPanX = e.clientX
        this.lastPanY = e.clientY
        this.canvas.style.cursor = 'grabbing'
    }
    
    updatePan(e) {
        if (!this.isPanning) return
        
        const deltaX = e.clientX - this.lastPanX
        const deltaY = e.clientY - this.lastPanY
        
        // Convert screen movement to canvas movement (reverse direction for natural feel)
        this.panX += deltaX / this.zoomLevel
        this.panY += deltaY / this.zoomLevel
        
        this.lastPanX = e.clientX
        this.lastPanY = e.clientY
        
        this.updateCanvasTransform()
    }
    
    stopPan() {
        this.isPanning = false
        if (this.isHandTool) {
            this.canvas.style.cursor = 'grab'
        }
    }
    
    // Touch pan methods
    handleTouchStartPan(e) {
        e.preventDefault()
        const touch = e.touches[0]
        this.isPanning = true
        this.lastPanX = touch.clientX
        this.lastPanY = touch.clientY
    }
    
    handleTouchMovePan(e) {
        e.preventDefault()
        if (!this.isPanning) return
        
        const touch = e.touches[0]
        const deltaX = touch.clientX - this.lastPanX
        const deltaY = touch.clientY - this.lastPanY
        
        // Convert screen movement to canvas movement (reverse direction for natural feel)
        this.panX += deltaX / this.zoomLevel
        this.panY += deltaY / this.zoomLevel
        
        this.lastPanX = touch.clientX
        this.lastPanY = touch.clientY
        
        this.updateCanvasTransform()
    }
    
    // Zoom methods
    zoomIn() {
        const newZoom = Math.min(this.zoomLevel * 1.2, this.maxZoom)
        this.setZoom(newZoom)
    }
    
    zoomOut() {
        const newZoom = Math.max(this.zoomLevel / 1.2, this.minZoom)
        this.setZoom(newZoom)
    }
    
    setZoom(zoom) {
        this.zoomLevel = zoom
        this.updateCanvasTransform()
        this.updateZoomDisplay()
    }
    
    updateZoomDisplay() {
        const zoomDisplay = document.getElementById('zoom-display')
        if (zoomDisplay) {
            // Calculate percentage relative to base zoom (100% = fully in view)
            const percentage = Math.round((this.zoomLevel / this.baseZoom) * 100)
            zoomDisplay.textContent = `${percentage}%`
        }
    }
    
    updateCanvasTransform() {
        // Apply zoom and pan
        const displayWidth = this.canvasWidth * this.zoomLevel
        const displayHeight = this.canvasHeight * this.zoomLevel
        
        this.canvas.style.width = displayWidth + 'px'
        this.canvas.style.height = displayHeight + 'px'
        this.canvas.style.transform = `translate(${this.panX * this.zoomLevel}px, ${this.panY * this.zoomLevel}px)`
        this.canvas.style.position = 'absolute'
        this.canvas.style.top = '50%'
        this.canvas.style.left = '50%'
        this.canvas.style.marginTop = (-displayHeight/2) + 'px'
        this.canvas.style.marginLeft = (-displayWidth/2) + 'px'
        this.canvas.style.border = '2px solid rgba(255, 255, 255, 0.3)'
        this.canvas.style.boxShadow = '0 0 20px rgba(0, 0, 0, 0.5)'
    }
}
