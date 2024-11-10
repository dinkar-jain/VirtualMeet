import { gameHeight, gameWidth, playerHeight, playerScale, playerWidth } from '@/Constants';
import { Players } from '../classes/Players';
import { Player } from '../classes/Player';
import { socket } from '../../socket';
import { Scene } from 'phaser';

export class Office extends Scene {
    currentPlayer: Player
    onlinePlayers: Players

    constructor() {
        super('Office');
    }

    create() {
        const currentPlayerName = this.registry.list.name;
        const texture = 'character-movements';

        const map = this.make.tilemap({ key: 'map' });
        const tileset = map.addTilesetImage('tiles', 'tiles');
        const background = map.createLayer('Tile Layer 1', tileset as Phaser.Tilemaps.Tileset);

        this.currentPlayer = new Player(socket.id as string, this, currentPlayerName, { x: 0, y: gameHeight - (playerHeight * playerScale) - 5 }, texture);

        if (background) {
            background.setCollisionByProperty({ collides: true });
            this.physics.add.collider(this.currentPlayer.sprite, background);
        }

        this.cameras.main.setBounds(0, 0, gameWidth, gameHeight);
        this.cameras.main.startFollow(this.currentPlayer.sprite, true, 0.1, 0.1);
        this.cameras.main.setZoom(1.5);

        this.onlinePlayers = new Players(this, this.currentPlayer);

        [
            { key: 'right', start: 0, end: 5 },
            { key: 'up', start: 6, end: 11 },
            { key: 'left', start: 12, end: 17 },
            { key: 'down', start: 18, end: 22 }
        ].forEach(anim => {
            this.anims.create({
                key: anim.key,
                frames: this.anims.generateFrameNumbers(texture, { start: anim.start, end: anim.end }),
                frameRate: 10,
                repeat: -1
            });
        });

        socket.emit("register", {
            name: currentPlayerName,
            x: this.currentPlayer.sprite.x,
            y: this.currentPlayer.sprite.y
        });
    }

    update() {
        const cursors = this.input.keyboard?.createCursorKeys();

        let isColliding = this.onlinePlayers?.players.some(player => {
            const xDiff = Math.abs(this.currentPlayer.sprite.x - player.sprite.x);
            const yDiff = Math.abs(this.currentPlayer.sprite.y - player.sprite.y);

            const isColliding = xDiff < 2 * playerWidth && yDiff < 1.2 * playerHeight;
            if (isColliding && !this.registry.list.isWebRTCConnected && !this.registry.list.roomId) {
                if (this.currentPlayer.lastMoved && new Date().getTime() - this.currentPlayer.lastMoved.getTime() < 1000) {
                    this.game.events.emit("isWebRTCConnected", true);
                    socket.emit("move", {
                        x: this.currentPlayer.sprite.x,
                        y: this.currentPlayer.sprite.y
                    });
                    socket.emit("connectToPlayer", { playerId: player.id });
                }
            }

            return isColliding;
        });
        if (!isColliding && this.registry.list.isWebRTCConnected && this.registry.list.roomId) {
            if (this.currentPlayer.lastMoved && new Date().getTime() - this.currentPlayer.lastMoved.getTime() < 1000) {
                socket.emit("exitRoom", { roomId: this.registry.list.roomId });
                this.game.events.emit("isWebRTCConnected", false);
            }
        }

        let direction = { x: 0, y: 0 };
        if (cursors?.left.isDown) {
            direction.x = -1;
            this.currentPlayer.move(direction.x, direction.y, 'left');
        } else if (cursors?.right.isDown) {
            direction.x = 1;
            this.currentPlayer.move(direction.x, direction.y, 'right');
        } else if (cursors?.up.isDown) {
            direction.y = -1;
            this.currentPlayer.move(direction.x, direction.y, 'up');
        } else if (cursors?.down.isDown) {
            direction.y = 1;
            this.currentPlayer.move(direction.x, direction.y, 'down');
        }

        if (direction.x !== 0 || direction.y !== 0) {
            this.currentPlayer.lastMoved = new Date();
        } else {
            this.currentPlayer.stop();
            this.emitPlayerPosition();
        }
    }

    private emitPlayerPosition() {
        if (this.currentPlayer.lastMoved && new Date().getTime() - this.currentPlayer.lastMoved.getTime() > 1000) {
            socket.emit("move", {
                x: this.currentPlayer.sprite.x,
                y: this.currentPlayer.sprite.y
            });
            this.currentPlayer.lastMoved = undefined;
        }
    }

    private debug(background: Phaser.Tilemaps.TilemapLayer) {
        this.physics.world.createDebugGraphic();
        background.renderDebug(this.add.graphics());
    }
}
