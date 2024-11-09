import { playerWidth, playerScale, playerHeight, playerHeightFactor } from '@/Constants';
import { Scene } from 'phaser';

export class Player {
    id: string;
    scene: Scene;
    sprite: Phaser.Physics.Arcade.Sprite;
    playerName: Phaser.GameObjects.Text;
    lastMoved: Date | undefined;

    constructor(
        id: string,
        scene: Scene,
        name: string,
        position: { x: number, y: number },
        texture: string,
    ) {
        this.id = id;
        this.scene = scene;
        this.sprite = scene.physics.add.sprite(position.x, position.y, texture)
            .setOrigin(0)
            .setScale(playerScale)
            .setSize(playerWidth, playerHeight * playerHeightFactor)
            .setOffset(0, playerHeight * (1 - playerHeightFactor));
        this.sprite.setCollideWorldBounds(true);

        this.playerName = this.scene.add.text(this.sprite.x, this.sprite.y, name.length < 5 ? name : name.substring(0, 4) + '..', {
            align: 'center',
            fixedWidth: playerWidth * playerScale,
            font: '9px Arial',
            stroke: '#000000',
            strokeThickness: 3,
        });
    }

    move(x: number, y: number, animationKey: string) {
        if (x !== 0 && x > 0) this.sprite.setVelocityX(100);
        else if (x !== 0 && x < 0) this.sprite.setVelocityX(-100);
        else if (x === 0) this.sprite.setVelocityX(0);

        if (y !== 0 && y > 0) this.sprite.setVelocityY(100);
        else if (y !== 0 && y < 0) this.sprite.setVelocityY(-100);
        else if (y === 0) this.sprite.setVelocityY(0);

        this.sprite.anims.play(animationKey, true);
        this.playerName.setX(this.sprite.x);
        this.playerName.setY(this.sprite.y);
    }

    stop() {
        this.sprite.setVelocityX(0);
        this.sprite.setVelocityY(0);
        if (this.sprite.anims.currentAnim?.key === 'right') {
            this.sprite.setFrame(0);
        }
        else if (this.sprite.anims.currentAnim?.key === 'left') {
            this.sprite.setFrame(12);
        }
        else if (this.sprite.anims.currentAnim?.key === 'down') {
            this.sprite.setFrame(18);
        }
        else if (this.sprite.anims.currentAnim?.key === 'up') {
            this.sprite.setFrame(6);
        }

        this.sprite.anims.stop();
    }
}