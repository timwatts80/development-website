// Real-time collaborative canvas application
import './style.css'
import { CollaborativeCanvas } from './canvas.js'

// Mobile UI functionality
class MobileUI {
    constructor() {
        this.activeSlider = null
        this.sliderJustOpened = false
        this.sliderData = {
            'brush-size': { min: 1, max: 50, value: 5, unit: 'px', group: 'brush-size-group' },
            'taper': { min: 0, max: 100, value: 50, unit: '%', group: 'taper-group' }
        }
        this.init()
    }
    
    init() {
        this.setupSliderButtons()
        this.setupMobileSliders()
        this.setupDocumentClick()
    }
    
    setupSliderButtons() {
        // Add click handlers for mobile slider buttons
        const sliderGroups = document.querySelectorAll('.tool-group.slider-group')
        sliderGroups.forEach(group => {
            group.addEventListener('click', (e) => {
                if (window.innerWidth <= 768) { // Only on mobile
                    e.preventDefault()
                    e.stopPropagation()
                    
                    this.sliderJustOpened = true // Flag to prevent immediate closing
                    
                    const groupId = group.id
                    
                    // Find the corresponding slider ID
                    let sliderId = null
                    if (groupId === 'brush-size-group') sliderId = 'brush-size'
                    if (groupId === 'taper-group') sliderId = 'taper'
                    
                    if (sliderId) {
                        this.toggleMobileSlider(sliderId)
                    }
                }
            })
        })
    }
    
    setupMobileSliders() {
        // Setup each mobile slider
        Object.keys(this.sliderData).forEach(sliderId => {
            const data = this.sliderData[sliderId]
            const mobileSlider = document.getElementById(`${sliderId}-mobile-slider`)
            if (!mobileSlider) return
            
            const track = mobileSlider.querySelector('.mobile-slider-track')
            const thumb = mobileSlider.querySelector('.mobile-slider-thumb')
            
            if (!track || !thumb) return
            
            // Handle touch/mouse events on this specific slider
            let isDragging = false
            
            const startDrag = (e) => {
                e.stopPropagation()
                isDragging = true
                this.updateSliderFromEvent(e, sliderId, track)
            }
            
            const drag = (e) => {
                if (!isDragging) return
                e.preventDefault()
                e.stopPropagation()
                this.updateSliderFromEvent(e, sliderId, track)
            }
            
            const endDrag = () => {
                isDragging = false
            }
            
            // Touch events
            thumb.addEventListener('touchstart', startDrag, { passive: false })
            track.addEventListener('touchstart', startDrag, { passive: false })
            document.addEventListener('touchmove', drag, { passive: false })
            document.addEventListener('touchend', endDrag)
            
            // Mouse events for desktop testing
            thumb.addEventListener('mousedown', startDrag)
            track.addEventListener('mousedown', startDrag)
            document.addEventListener('mousemove', drag)
            document.addEventListener('mouseup', endDrag)
        })
    }
    
    setupDocumentClick() {
        // Close sliders when clicking outside
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768 && this.activeSlider && !this.sliderJustOpened) {
                const activeGroup = document.getElementById(this.sliderData[this.activeSlider].group)
                const mobileSlider = document.getElementById(`${this.activeSlider}-mobile-slider`)
                
                // Check if click is outside both the group and the mobile slider
                if (activeGroup && mobileSlider && 
                    !activeGroup.contains(e.target) && 
                    !mobileSlider.contains(e.target)) {
                    this.closeMobileSlider()
                }
            }
        }, true) // Use capture phase to ensure it runs
        
        // Also handle touch events for mobile
        document.addEventListener('touchstart', (e) => {
            if (window.innerWidth <= 768 && this.activeSlider && !this.sliderJustOpened) {
                const activeGroup = document.getElementById(this.sliderData[this.activeSlider].group)
                const mobileSlider = document.getElementById(`${this.activeSlider}-mobile-slider`)
                
                // Check if touch is outside both the group and the mobile slider
                if (activeGroup && mobileSlider && 
                    !activeGroup.contains(e.target) && 
                    !mobileSlider.contains(e.target)) {
                    this.closeMobileSlider()
                }
            }
        }, true) // Use capture phase
    }
    
    toggleMobileSlider(sliderId) {
        if (this.activeSlider === sliderId) {
            this.closeMobileSlider()
        } else {
            this.openMobileSlider(sliderId)
        }
    }
    
    openMobileSlider(sliderId) {
        // Close any currently open slider
        this.closeMobileSlider()
        
        this.activeSlider = sliderId
        const data = this.sliderData[sliderId]
        const mobileSlider = document.getElementById(`${sliderId}-mobile-slider`)
        const valueDisplay = mobileSlider.querySelector('.mobile-slider-value')
        
        // Set initial value
        valueDisplay.textContent = `${data.value}${data.unit}`
        
        // Position thumb based on current value
        this.updateThumbPosition(sliderId, data.value, data.min, data.max)
        
        // Show slider
        mobileSlider.classList.add('active')
        
        // Small delay to prevent immediate closing from the same click event
        setTimeout(() => {
            this.sliderJustOpened = false
        }, 100)
    }
    
    closeMobileSlider() {
        if (this.activeSlider) {
            const mobileSlider = document.getElementById(`${this.activeSlider}-mobile-slider`)
            mobileSlider.classList.remove('active')
            this.activeSlider = null
        }
    }
    
    updateSliderFromEvent(e, sliderId, track) {
        const trackRect = track.getBoundingClientRect()
        
        // Get touch/mouse position
        const clientY = e.touches ? e.touches[0].clientY : e.clientY
        
        // Calculate position relative to track
        const relativeY = clientY - trackRect.top
        const percentage = Math.max(0, Math.min(1, 1 - (relativeY / trackRect.height)))
        
        // Update value
        const data = this.sliderData[sliderId]
        const newValue = Math.round(data.min + (percentage * (data.max - data.min)))
        data.value = newValue
        
        // Update displays
        this.updateThumbPosition(sliderId, newValue, data.min, data.max)
        this.updateValueDisplays(sliderId, newValue, data.unit)
        
        // Update the actual input element
        const input = document.getElementById(sliderId)
        if (input) {
            input.value = newValue
            input.dispatchEvent(new Event('input', { bubbles: true }))
        }
    }
    
    updateThumbPosition(sliderId, value, min, max) {
        const mobileSlider = document.getElementById(`${sliderId}-mobile-slider`)
        const thumb = mobileSlider.querySelector('.mobile-slider-thumb')
        const track = mobileSlider.querySelector('.mobile-slider-track')
        
        const percentage = (value - min) / (max - min)
        const trackHeight = 120 // Updated track height
        const thumbHeight = 24 // Updated thumb height
        const position = (1 - percentage) * (trackHeight - thumbHeight)
        thumb.style.top = `${Math.max(0, Math.min(trackHeight - thumbHeight, position))}px`
    }
    
    updateValueDisplays(sliderId, value, unit) {
        // Update mobile slider display
        const mobileSlider = document.getElementById(`${sliderId}-mobile-slider`)
        const mobileValueDisplay = mobileSlider.querySelector('.mobile-slider-value')
        mobileValueDisplay.textContent = `${value}${unit}`
        
        // Update toolbar display
        const toolbarDisplay = document.getElementById(`${sliderId}-display`)
        if (toolbarDisplay) {
            toolbarDisplay.textContent = `${value}${unit}`
        }
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const canvas = new CollaborativeCanvas()
    canvas.init()
    
    // Initialize mobile UI
    const mobileUI = new MobileUI()
})
