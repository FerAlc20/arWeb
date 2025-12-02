/* script.js
   Contiene los componentes de A-Frame para interactividad táctil
*/

// COMPONENTE 1: GESTURE DETECTOR
// Escucha si hay 1 dedo (rotar) o 2 dedos (escalar) en la pantalla
AFRAME.registerComponent("gesture-detector", {
    schema: { element: { default: "" } },
    init: function() {
        this.targetElement = this.data.element && document.querySelector(this.data.element);
        if (!this.targetElement) { this.targetElement = this.el; }
        this.internalState = { previousState: null };
        this.emitGestureEvent = this.emitGestureEvent.bind(this);
        this.targetElement.addEventListener("touchstart", this.emitGestureEvent);
        this.targetElement.addEventListener("touchend", this.emitGestureEvent);
        this.targetElement.addEventListener("touchmove", this.emitGestureEvent);
    },
    remove: function() {
        this.targetElement.removeEventListener("touchstart", this.emitGestureEvent);
        this.targetElement.removeEventListener("touchend", this.emitGestureEvent);
        this.targetElement.removeEventListener("touchmove", this.emitGestureEvent);
    },
    emitGestureEvent: function(event) {
        const currentState = this.getTouchState(event);
        const previousState = this.internalState.previousState;
        const gestureContinues = previousState && currentState && currentState.touchCount == previousState.touchCount;
        const gestureEnded = previousState && !gestureContinues;
        const gestureStarted = currentState && !gestureContinues;

        if (gestureEnded) {
            const eventName = this.getEventPrefix(previousState.touchCount) + "fingerend";
            this.el.emit(eventName, previousState);
            this.internalState.previousState = null;
        }
        if (gestureStarted) {
            currentState.startTime = performance.now();
            currentState.startPosition = currentState.position;
            currentState.startSpread = currentState.spread;
            const eventName = this.getEventPrefix(currentState.touchCount) + "fingerstart";
            this.el.emit(eventName, currentState);
            this.internalState.previousState = currentState;
        }
        if (gestureContinues) {
            const eventDetail = {
                positionChange: { x: currentState.position.x - previousState.position.x, y: currentState.position.y - previousState.position.y },
                spreadChange: currentState.spread - previousState.spread,
                startSpread: currentState.startSpread,
                position: currentState.position,
                spread: currentState.spread
            };
            const eventName = this.getEventPrefix(currentState.touchCount) + "fingermove";
            this.el.emit(eventName, eventDetail);
            this.internalState.previousState = currentState;
        }
    },
    getTouchState: function(event) {
        if (event.touches.length === 0) return null;
        const touchList = [];
        for (let i = 0; i < event.touches.length; i++) { touchList.push(event.touches[i]); }
        const touchState = { touchCount: touchList.length };
        const centerPosition = touchList.reduce((sum, touch) => ({ x: sum.x + touch.clientX, y: sum.y + touch.clientY }), { x: 0, y: 0 });
        touchState.position = { x: centerPosition.x / touchList.length, y: centerPosition.y / touchList.length };
        if (touchList.length >= 2) {
            const spread = Math.hypot(touchList[0].clientX - touchList[1].clientX, touchList[0].clientY - touchList[1].clientY);
            touchState.spread = spread;
        }
        return touchState;
    },
    getEventPrefix: function(touchCount) {
        const names = ["one", "two", "three", "many"];
        return names[Math.min(touchCount, 4) - 1];
    }
});

// COMPONENTE 2: GESTURE HANDLER
// Recibe la información del detector y modifica el tamaño/rotación del modelo
AFRAME.registerComponent("gesture-handler", {
    schema: {
        enabled: { default: true },
        rotationFactor: { default: 5 },
        minScale: { default: 0.005 },
        maxScale: { default: 0.08 },
    },
    init: function() {
        this.handleScale = this.handleScale.bind(this);
        this.handleRotation = this.handleRotation.bind(this);
        this.isVisible = false;
        this.initialScale = this.el.object3D.scale.clone();
        this.scaleFactor = 1;

        this.el.sceneEl.addEventListener("markerFound", (e) => { this.isVisible = true; });
        this.el.sceneEl.addEventListener("markerLost", (e) => { this.isVisible = false; });
    },
    update: function() {
        if (this.data.enabled) {
            this.el.sceneEl.addEventListener("onefingermove", this.handleRotation);
            this.el.sceneEl.addEventListener("twofingermove", this.handleScale);
        } else {
            this.el.sceneEl.removeEventListener("onefingermove", this.handleRotation);
            this.el.sceneEl.removeEventListener("twofingermove", this.handleScale);
        }
    },
    remove: function() {
        this.el.sceneEl.removeEventListener("onefingermove", this.handleRotation);
        this.el.sceneEl.removeEventListener("twofingermove", this.handleScale);
    },
    handleRotation: function(event) {
        if (this.isVisible) {
            // Rota en el eje Y (horizontal)
            this.el.object3D.rotation.y += event.detail.positionChange.x * this.data.rotationFactor;
            
            // Si quieres rotar también arriba/abajo, descomenta esta línea:
            // this.el.object3D.rotation.x += event.detail.positionChange.y * this.data.rotationFactor;
        }
    },
    handleScale: function(event) {
        if (this.isVisible) {
            this.scaleFactor *= 1 + event.detail.spreadChange / event.detail.startSpread;
            this.scaleFactor = Math.min(Math.max(this.scaleFactor, this.data.minScale), this.data.maxScale);

            this.el.object3D.scale.x = this.scaleFactor * this.initialScale.x;
            this.el.object3D.scale.y = this.scaleFactor * this.initialScale.y;
            this.el.object3D.scale.z = this.scaleFactor * this.initialScale.z;
        }
    }
});
