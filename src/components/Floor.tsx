import React, { useLayoutEffect, useRef, useState } from "react";
import { Coordinate } from "../types/Floor.types";

import * as THREE from 'three';

// **
// ** This implementaiton uses instancedMesh and boxBufferedGeometry 
// ** and can deliver a hug smoothly rendering floor with much simpler code
// **

export const cellWidth = 0.761;
export const cellHeight = 0.561;

export const noOfCellsWide = 100;
export const noOfCellsHigh = 500;
// target is >38000 cells

interface FloorTileData {
    coord: Coordinate,
    color: string; //hex color
}

interface FloorTilesData {
    floorTiles: FloorTileData[]
}

// ** TODO: threejs has a thing called a sprite - how many sprites can it display?  Use Sprite for floor instead?

const createFloorData = (): FloorTilesData => {
    const randomTopQuintileHex = () => Math.floor(((Math.random()/5 + 0.8) * 256)).toString(16);
    const randomPastelHex = () => '#' + randomTopQuintileHex() + randomTopQuintileHex() + randomTopQuintileHex();
    return {
        floorTiles: [...Array(noOfCellsWide).keys()].flatMap(x => {
            return [...Array(noOfCellsHigh).keys()].map(y => {
                return {
                    coord: {x: x, y: y},
                    color: randomPastelHex()
                }
            })
        })
    };
};

// Floor holds a collection of tiles

const floorTiles: FloorTilesData = createFloorData();

const o = new THREE.Object3D();
o.rotateX(Math.PI * 0.5);
const c = new THREE.Color();
const colors: string[] = floorTiles.floorTiles.map((tile) => tile.color); //array of hex colours

export default function Floor() { 
    // This reference will give us direct access to the THREE.Mesh object
    const ref = useRef<THREE.InstancedMesh>(null!);
    const materialRef = useRef<THREE.MeshLambertMaterial>(null!);
    const length = floorTiles.floorTiles.length;
    const [colorArray] = useState(() => Float32Array.from(Array.from({ length }, (_, i) => c.set(colors[i]).convertSRGBToLinear().toArray()).flat()));

    useLayoutEffect(() => {
        floorTiles.floorTiles.forEach((tile, i) => {
            const id = i;
            o.position.set(tile.coord.x * cellWidth + cellWidth/2, 0, tile.coord.y * cellHeight + cellHeight/2);
            o.updateMatrix();
            ref.current.setMatrixAt(id, o.matrix);
        });
        ref.current.instanceMatrix.needsUpdate = true;
    }, []);

    return (
        <instancedMesh
            ref={ref}
            args={[undefined, undefined, floorTiles.floorTiles.length]}
            onPointerDown={(e) => console.log('down', e.point.x, '-', e.point.z)}
            onPointerMove={(e) => console.log('move', e.point.x, '-', e.point.z)}
            >
            <planeBufferGeometry args={[cellWidth, cellHeight]} >
                <instancedBufferAttribute attachObject={['attributes', 'color']} args={[colorArray, 3]} />
            </planeBufferGeometry>
            {/* <boxBufferGeometry args={[cellWidth, 0.05, cellHeight]}>
                <instancedBufferAttribute attachObject={['attributes', 'color']} args={[colorArray, 3]} />
            </boxBufferGeometry> */}
            {/* Basic: no consideration of light source direction - leads to flat blocks of colour, good for 'wireframe' style projects */}
            <meshBasicMaterial ref={materialRef} vertexColors toneMapped={false} />
        </instancedMesh>
    )
}
// One of the fun things with fiber and its poor documentation and tutorials, is stumbling upon stuff that apparently is a driver for using it and not having known about it until that moment.  In this case, I was looking at raycaster and fiber and stumbled across this article that states as a reason for using fiber that:
// It comes with some useful functions like raycaster and on each mesh it gives you access to all the useful pointer events like onClick, onPointerOver, onPointerOut, etc.
// Then I stumbled across <group ></group> that is a fiber version of a threejs concept that lets you group up meshs and update properties on all of them in one go (e.g. to rotate a group of meshs at once).  There's some stuff on group here.
// There's a simple example of using onPointOver and onPointOut here.
// There's some documentation on fiber pointer events here.  And fuller documentation about these events here.
// I had a go at implementing this in the branch locally and it seems to work fine and the code is a bit cleaner (no need for the FrameHandler or storing the scene or raycaster as state, and the calculateAndGetCellUnderPoint() method can be a little simpler.  But I haven't had a chance to properly test it or compare its performance (seems fine).  I think the x and z that we are interested in are on point on the passed in event, e.g. <group onPointerDown={(e) => console.log('down:', e.point.x, ',', e.point.z)} >