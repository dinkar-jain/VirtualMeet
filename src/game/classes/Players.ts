import { socket } from '../../socket';
import { Player } from './Player';

export class Players {
    currentPlayer: Player;
    scene: Phaser.Scene;
    players: Player[];

    constructor(scene: Phaser.Scene, currentPlayer: Player) {
        this.currentPlayer = currentPlayer;
        this.scene = scene;
        this.players = [];

        socket.on("playersData", (playersData: { id: string, name: string, x: number, y: number }[]) => {
            this.updatePlayersPosition(playersData.filter(player => player.id !== socket.id));
        })
    }

    updatePlayersPosition(players: { id: string, name: string, x: number, y: number }[]) {
        players.map(player => {
            const targetX = player.x;
            const targetY = player.y;

            const playerInArray = this.players.find(playerInArray => playerInArray.id === player.id);
            if (playerInArray) {
                const playerXPosition = playerInArray.sprite.x;
                const playerYPosition = playerInArray.sprite.y;

                if (playerXPosition !== player.x && playerYPosition !== player.y) {
                    this.xTween(playerInArray, targetX, targetY);
                }
                else if (playerXPosition !== player.x) {
                    this.xTween(playerInArray, targetX);
                }
                else if (playerYPosition !== player.y) {
                    this.yTween(playerInArray, targetY);
                }
            }
            else {
                const newPlayer = new Player(player.id, this.scene, player.name, { x: targetX, y: targetY }, 'character-movements');
                this.scene.physics.add.collider(newPlayer.sprite, this.currentPlayer.sprite);
                newPlayer.sprite.setImmovable(true);
                this.players.push(newPlayer);
            }
        })

        this.removeDisconnectedPlayers(players);
    }

    private xTween(player: Player, targetX: number, targetY?: number) {
        this.scene.tweens.add({
            targets: [player.sprite, player.playerName],
            x: targetX,
            duration: Math.abs(player.sprite.x - targetX) * 10,
            onStart: () => player.sprite.anims.play(player.sprite.x < targetX ? 'right' : 'left', true),
            onComplete: () => {
                if (this.players.find(playerInArray => playerInArray.id === player.id)) {
                    player.stop();
                    if (targetY) {
                        this.yTween(player, targetY);
                    }
                }
            }
        })
    }

    private yTween(player: Player, targetY: number) {
        this.scene.tweens.add({
            targets: [player.sprite, player.playerName],
            y: targetY,
            duration: Math.abs(player.sprite.y - targetY) * 10,
            onStart: () => player.sprite.anims.play(player.sprite.y < targetY ? 'down' : 'up', true),
            onComplete: () => {
                if (this.players.find(playerInArray => playerInArray.id === player.id))
                    player.stop()
            }
        })
    }

    private removeDisconnectedPlayers(playersData: { id: string }[]) {
        this.players = this.players.filter(player => {
            const isConnected = playersData.some(data => data.id === player.id);
            if (!isConnected) {
                player.sprite.destroy();
                player.playerName.destroy();
            }
            return isConnected;
        });
    }
}