import { playerHeight, playerWidth } from '@/Constants';
import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    preload() {
        this.load.setPath('assets');
        this.load.image('tiles', 'tiles.jpeg');
        this.load.tilemapTiledJSON('map', 'map.json');
        this.load.spritesheet('character-movements', 'character-movements.png', { frameWidth: playerWidth, frameHeight: playerHeight });
    }

    create() {
        this.scene.start('Office');
    }
}
