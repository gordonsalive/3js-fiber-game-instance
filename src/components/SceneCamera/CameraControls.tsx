import React from 'react';

interface CameraControlsProps {
    outerWindow: {height: number, width: number},
    updateCameraX: (delta: number) => void,
    updateCameraY: (delta: number) => void,
    resetCameraPosition: () => void,
    update3DState: (is3DEnabled: boolean) => void,
    updateGridRotation: (deltaDegrees: number) => void,
    gridRotation: number
}

export const CameraControls = ({outerWindow, updateCameraX, updateCameraY, resetCameraPosition, update3DState, updateGridRotation, gridRotation}: CameraControlsProps) => {
    const cameraStep = 5;
    const direction = {
        up: "up",
        right: "right",
        down: "down",
        left: "left"
    }

    const updateCamera = (key: string) => {
        // first check if the camera has been rotated and convert this into a quadrant 0 to 3 (to use with an index later)
        const absoluteQuadrant = (Math.abs(gridRotation) / 90) % 4; // 0 -> 0 ; 90 -> 1 ; 180 -> 2 ; 270 -> 3
        const clockwiseQuadrant = (gridRotation < 0) ? -absoluteQuadrant +4 : absoluteQuadrant; 
        // each time the camera is rotate 90° more, the pattern of method to call (and step) shift one along
        const updateCameraActions = [
            {method: updateCameraY, step: cameraStep},  // up at 0°,    left at 90°,  down at 18°,   right at 270°
            {method: updateCameraX, step: cameraStep},  // right at 0°, up at 90°,    left at 180°,  down at 270°
            {method: updateCameraY, step: -cameraStep}, // down at 0°,  right at 90°, up at 180°,    left at 270°
            {method: updateCameraX, step: -cameraStep}, // left at 0°,  down at 90°,  right at 180°, up at 270°
        ];
        // key passed in corresponds directly to camera actions, if camera hasn't been rotated
        const directionActionIndex = {[direction.up]: 0, [direction.right]: 1, [direction.down]: 2, [direction.left]: 3 };
        // then we can correct for the rotation of the camera and call the correct action with the correct step
        const actionIndex = (directionActionIndex[key] + clockwiseQuadrant) % 4;
        const actionItem = updateCameraActions[actionIndex];
        actionItem.method(actionItem.step);
    }

    return (
        <div className="CameraControls_Panel" style={{top: outerWindow.height - 100, left: outerWindow.width - 100}} >
            <div className="CameraControls_Buttons">
                <button onClick={() => update3DState(false)}><small>2D</small></button>
                <button onClick={() => updateCamera(direction.up)}>{"\u25B2"}</button>
                <button onClick={() => update3DState(true)}><small>3D</small></button>
                <button onClick={() => updateCamera(direction.left)}>{"\u25C0"}</button>
                <button 
                  className="CameraControl_ResetButton"
                  style={{transform: `rotate(${360 - gridRotation}deg)`, transition: 'transform 150ms ease'}} 
                  onClick={() => resetCameraPosition()}>{"\u221F"}</button>
                {/* <button onClick={() => resetCameraPosition()}>{"\u229B"}</button> */}
                <button onClick={() => updateCamera(direction.right)}>{"\u25B6"}</button>
                <button onClick={() => updateGridRotation(90)}>{"\u21AA"}</button>
                <button onClick={() => updateCamera(direction.down)}>{"\u25BC"}</button>
                <button onClick={() => updateGridRotation(-90)}>{"\u21A9"}</button>
            </div>
        </div>
    );
}